'use strict';
module.exports = function(app) {
	var itemRating = require('../controllers/itemRatingController');

	
	app.route('/items/createItem/')
		.post(itemRating.create_item)
	
	app.route('/items/:clientAppspot/:tokenId')
		.get(itemRating.list_all_items)

	app.route('/items/:itemId/vote/:grade/:voterId/')
		.post(itemRating.vote_item)

	app.route('/items/:itemId/getRatings/:clientAppspot/:tokenId')
		.get(itemRating.get_ratings)


};