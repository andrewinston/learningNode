'use strict';


var mongoose = require('mongoose'),
	Item = mongoose.model('Items');
var request = require('request-promise-native');
const axios = require('axios')
const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore({});
const orchestratorUrl = 'https://orchestrator-224010.appspot.com'
const projectName = "ratingengine-225019";
const unauthorizedMessage = "Unauthorized request, you should send an object 'authorize' in the body of your post request, containing the 'token-id' and 'client-appspot'"

//validates request through orchestrator
const validateRequisition = async function(tokenId, clientAppspot, service_name){
	var ret = {};
	return Promise.resolve(request({
		"method": "POST",
		"url": orchestratorUrl+"/token/validate",
		"json": true,
		"body": {
			"token-id": tokenId,
			"server-appspot": projectName,
			"client-appspot": clientAppspot,
			"service-name":service_name
		},
		"headers": {
			"Content-type": "application/json"
		}
	}).then(function(res){
		ret['status'] = "ok";
		ret['res'] = res;
		return ret;
	}).catch((err)=>{
		ret['status'] = "error";
		ret['error'] = err;
		return ret;
	}));
	//return ret;
}

exports.list_all_items = async function(req, res){
	validateRequisition(req.params.tokenId, req.params.clientAppspot, 'List Items').then((result) =>{
		if(result.status !== "ok"){
			res.status(result.error.statusCode).json({status:"error", errors:[result.error.error.message]});
		}
		datastore.runQuery(datastore.createQuery('Item').filter('created_by', '=', req.params.clientAppspot)).then(results =>{
			const items = results[0];
			res.status(200).json({status: "ok", data:items});
		});
	})
	/*console.log(reqVal);
	if(reqVal['status'] !== 'ok'){
		res.status(reqVal.error.error.status).json({status: "error", errors:[reqVal.res.message]});
	}
	*/
}

exports.vote_item = function(req, res){
	validateRequisition(req.body.authorize['token-id'], req.body.authorize['client-appspot'], 'Vote').then((result)=>{
		if(result.status !== "ok"){
			res.status(result.error.statusCode).json({status:"error", errors:[result.error.error.message]});
		}
		const query = datastore.createQuery('Item').filter('__key__', '=', {kind: "Item", id: req.params.itemId});
		datastore.runQuery(query).then(results =>{
			const item = results[0][0];
			var errors = [];
			if(item['ratingType'] === 'stars'){
				if(parseInt(req.params.grade) > 5 || parseInt(req.params.grade) < 0){
					errors.push('Stars rating type must be a number between 0 and 5');
				}
			}
			else if(item['ratingType'] === 'thumbs'){
				if(parseInt(req.params.grade) !== 1 && parseInt(req.params.grade) !== 0){
					errors.push('Thumbs rating type must be a number between 0 and 1');
				}
			}
			var userHasAlreadyVoted = false;
			for (var i = 0; i < item['ratings'].length; i++) {
				if(item['ratings'][i]['voterId'] === req.params.voterId){
					userHasAlreadyVoted = true;
					break;
				}
			}
			if(userHasAlreadyVoted){
				errors.push('This user has already voted for this item');
			}
			if(errors.length > 0){
				res.status(500).json({status: "error", errors: errors});
			}
			else{
				item.ratings.push({voterId: req.params.voterId, creation_time: new Date(), grade: parseInt(req.params.grade)});
			}

			const entity = {
				key: {kind: "Item", id: req.params.itemId},
				data: item
			};
			datastore.upsert(entity).then(()=>{
				res.status(200).jsothenn({status:"ok", entity:entity});
			}).catch(err =>{
				res.status(500).send({status:"error", errors: [err]})
			});
		}).catch(err =>{
			res.status(500).send({status:"error", errors:[err]});
		});
	});
}

exports.create_item = function(req, res){
	validateRequisition(req.body.authorize['token-id'], req.body.authorize['client-appspot'], 'Create Item').then((result) =>{
		if(result.status !== "ok"){
			res.status(result.error.statusCode).json({status:"error", errors:[result.error.error.message]});
		}
		const itemKey = datastore.key('Item');
		const entity = {
			key: itemKey,
			data:{
				id: itemKey.id,
				created_by: req.body.authorize['client-appspot'],
				item: {
					name: req.body.data['item']['name'],
					description: req.body.data['item']['description']
				},
				ratingType: req.body.data['ratingType'],
				ratings: []
			}
		}
		var errors = [];
		if(typeof entity['data']['item']['name'] === 'undefined'){
			errors.push('Entity must have a name');
		}
		if(entity['data']['ratingType'] !== 'stars' && entity['data']['ratingType'] !== 'thumbs'){
			errors.push('Types of rating supported are only stars and thumbs');
		}
		if(errors.length === 0){
			datastore.save(entity).then(()=>{
				res.status(200).json({status:"ok", key:itemKey});
			}).catch(err =>{
				res.status(500).json({status:"error", errors:["Error saving entity"]});
			})
		}
		else{
			res.status(500).json({status:"error", errors: errors});
		}
	}).catch((err)=>{
		res.status(500).json(err);
	});
}

exports.get_ratings = function(req, res){
	validateRequisition(req.params.tokenId, req.params.clientAppspot, 'Get ratings').then((result)=>{
		if(result.status !== "ok"){
			res.status(result.error.statusCode).json({status:"error", errors:[result.error.error.message]});
		}
		const query = datastore.createQuery('Item').filter('__key__', '=', {kind: "Item", id: req.params.itemId});
		datastore.runQuery(query).then((results)=>{
			if(results[0].length === 0) res.status(404).json({status: 'error', errors:"There are no items with the specified ID"})
			
			var item = results[0][0];
			var ans = {}
			if(item.ratingType === 'stars'){
				var avg = 0.0;
				for (var i = 0; i < item.ratings.length; i++) {
					avg += parseInt(item.ratings[i].grade);
				}
				avg /= item.ratings.length;
				ans = {avg: avg, ratings: item.ratings};
			}
			else if(item.ratingType === 'thumbs'){
				var up = 0, down = 0;
				for (var i = 0; i < item.ratings.length; i++) {
					up += parseInt(item.ratings[i].grade);
					down += 1-parseInt(item.ratings[i].grade);
				}
				ans = {thumbsup: up, thumbsdown: down, ratings: item.ratings};
			}
			res.status(200).json({status:"ok", data:ans});

		}).catch(err =>{
			res.status(500).json({status: "error", errors: ["Couldn't fetch data"]});
		});
	});
	
}
