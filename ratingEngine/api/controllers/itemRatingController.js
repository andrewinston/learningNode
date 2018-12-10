'use strict';


var mongoose = require('mongoose'),
	Item = mongoose.model('Items');

const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore({});

exports.list_all_items = function(req, res){
	datastore.runQuery(datastore.createQuery('Item')).then(results =>{
		const items = results;
		res.json(items);
	});
}

exports.vote_item = function(req, res){
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
			res.status(200).json({status:"ok", entity:entity});
		}).catch(err =>{
			res.status(500).send({status:"error", errors: [err]})
		});
	}).catch(err =>{
		res.status(500).send({status:"error", errors:[err]});
	});
}

exports.create_item = function(req, res){
	const itemKey = datastore.key('Item');
	const entity = {
		key: itemKey,
		data:{
			item: {
				name: req.body['item']['name'],
				description: req.body['item']['description']
			},
			ratingType: req.body['ratingType'],
			ratings: []
		}
	}
	var errors = '';
	if(typeof entity['data']['item']['name'] === 'undefined'){
		errors +='Entity must have a name\n';
	}
	if(entity['data']['ratingType'] !== 'stars' && entity['data']['ratingType'] !== 'thumbs'){
		errors +='Types of rating supported are only stars and thumbs\n'; 
	}
	if(errors === ''){
		datastore.save(entity).then(()=>{
			res.status(200).json(itemKey);
		}).catch(err =>{
			res.status(500).send("Error saving entity");
		})
	}
	else{
		res.status(500).send("Errors found:\n" + errors);
	}
}

exports.get_ratings = function(req, res){
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
			console.log("avg = " + avg);
			avg /= item.ratings.length;
			console.log("avg = " + avg);
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
		res.status(200).json(ans);

	}).catch(err =>{
		res.status(500).json({status: "error", errors: ["Couldn't fetch data"]});
	});

	/*var item = Item.findById(req.params.itemId, function(err, item){
		if(err)
			res.send(err);
		var ans = {ratings: item.ratings}
		if(item.ratingType === "thumbs"){
			var up = 0;
			var down = 0;
			for (var i = 0; i < item.ratings.length; i++) {
				if(item.ratings[i].grade === 1){
					up++;
				}
				else{
					down++;
				}
			}
			ans['thumbs_up'] = up;
			ans['thumbs_down'] = down;
		}
		if(item.ratingType === "stars"){
			var avg = 0.0;

			for (var i = 0; i < items.ratings.length; i++) {
				avg += items.ratings[i];
			}

			avg /= items.ratings.length;
		}
		res.json(ans)
	});*/
	
}
