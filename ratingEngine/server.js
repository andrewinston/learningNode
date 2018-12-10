var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  //mongoose = require('mongoose')
  Item = require('./api/models/itemRatingModel'),
  bodyParser = require('body-parser');

//mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://awinston:w1ea2dq3s@ds227674/ratingengine');

const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore({});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var routes = require('./api/routes/itemRatingRoutes');

routes(app);

app.listen(port);

console.log('rating engine RESTful API server started on: ' + port);