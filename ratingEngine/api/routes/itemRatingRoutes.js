'use strict';
module.exports = function(app) {
	var itemRating = require('../controllers/itemRatingController');

	//itemRating routes
	app.route('/items/')
		.get(itemRating.list_all_items)

	app.route('/items/:itemId/vote/:grade/:voterId/')
		.post(itemRating.vote_item)

	/*app.route('/items/:itemId')
		.get(itemRating.read_an_item)
		.put(itemRating.update_an_item)

	app.route('/items/:itemId/getVotes')
		.get(itemRating.get_votes)
		*/

	app.route('/items/:itemId/getRatings/')
		.get(itemRating.get_ratings)

	app.route('/items/createItem/')
		.post(itemRating.create_item)

};