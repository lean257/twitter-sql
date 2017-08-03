'use strict';

var express = require('express');
var router = express.Router();
// var tweetBank = require('../tweetBank');
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT * from tweets INNER JOIN users ON users.id=tweets.user_id', function(err, result){
      if (err) return next(err);
      let tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true
      });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    const query = 'SELECT * FROM users u INNER JOIN tweets t ON u.id=t.user_id WHERE u.name=$1'
    client.query(query,[req.params.username], function(err, result){
      if (err) return next(err);
      let tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true,
        username: req.params.username
      });
    })
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    const query = 'SELECT u.name, t.id, t.content FROM users u JOIN tweets t ON u.id=t.user_id WHERE t.id=$1';
    client.query(query,[req.params.id], function(err, result){
      if (err) return next(err);
      // let tweets = result.rows;
      // console.log(req.params.id)
      // console.log(req.params)
      res.render('index', {
        title: 'Twitter.js',
        tweets: result.rows, // an array of only one element ;-)
        showForm: false
        // id: req.params.id
      });
    })
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var newTweet = tweetBank.add(req.body.name, req.body.content);
    io.sockets.emit('new_tweet', newTweet);
    res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
