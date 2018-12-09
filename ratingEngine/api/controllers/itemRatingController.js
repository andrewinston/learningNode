'use strict';


var mongoose = require('mongoose'),
	Item = mongoose.model('Items');

exports.list_all_items = function(req, res){
	Item.find({}, function(err, item){
		if(err)
			res.send(err);
		res.json(item);
	});
}

exports.vote_item = function(req, res){
	Item.findByIdAndUpdate(req.params.itemId, {$push: {ratings: {grade: req.params.grade}}}, {new:true}, function(err, item){
		if(err)
			res.send(err);
		res.json(item);
	});
}

exports.create_item = function(req, res){
	var new_item = new Item(req.body);
	new_item.save(function(err, item) {
		if (err)
			res.send(err);
		res.json(item);
	});
}

exports.get_ratings = function(req, res){
	var item = Item.findById(req.params.itemId, function(err, item){
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
	});
	
}
