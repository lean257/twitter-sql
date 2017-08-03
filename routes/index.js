'use strict';

var express = require('express');
var router = express.Router();
// var tweetBank = require('../tweetBank');
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT t.id, u.name,t.content from tweets t INNER JOIN users u ON u.id=t.user_id', function(err, result){
      if (err) return next(err);
      let tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        id: tweets.id,
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
    let user_id;
    client.query('select * from users where name=$1', [req.body.name], function(err, result){
      if (err) return next(err);
      //if no user:
      if (result.rows.length===0) {
        //create new user
        client.query('insert into users (name) values($1) returning *', [req.body.name], function(err1, result1){
          if (err1) return next(err1);
          user_id = result1.rows[0].id;
          res.redirect('/');
        })
      } else {
        user_id = result.rows[0].id*1;
        client.query('insert into tweets (user_id, content ) values($1, $2) returning *', [user_id, req.body.content], function(err, result){
        if (err) return next(err);
        res.redirect('/');
        })
      }
    })
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
