'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
	item:{
		name: {
			type: String,
			required: "You need to name your item"
		},
		description: String
	},
	ratingType:{
		type:String,
		enum: ["thumbs", "stars"],
		default: "stars"
	},
	ratings:[
		{
			grade: {
				type: Number,
				required: [function(){
					return (this.ratingType === "thumbs" && this.ratings.grade < 2 && this.ratings.grade >= 0)
						|| (this.ratingType === "stars" && this.ratings.grade <= 5 && this.ratings.grade >= 0)
				}, "Invalid vote"]
			},
			ratingStamp:{
				type: Date,
				default: Date.now
			}
		}
	]
})

module.exports = mongoose.model('Items', ItemSchema);