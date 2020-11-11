const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAuthenticatedAndVerified, forwardAuthenticated } = require('../config/auth');
const Room = require('../models/room');
const User = require('../models/user');
const path = require('path');

router.get('/', ensureAuthenticatedAndVerified, (req, res) => res.render('rooms'));

router.get('/search',ensureAuthenticatedAndVerified,(req,res) => {
	
	let searchString = {};
	if(req.query.search && req.query.search.value){
		searchString = {$text: {$search: req.query.search.value}}
	}
    let perPage = Number(req.query.perPage) || 10;
    let page = Number(req.query.page) || 1;
    Room.find(searchString)
    .skip((perPage*page)-perPage)
    .limit(perPage)
    .exec(function(err,projects){
    	if(err){
    		console.log(err);
    		return res.json(err);
    	}
    	Room.countDocuments(searchString).exec(function(err,count){
	    	if(err){
	    		console.log(err);
	    		return res.json(err);
	    	}
			var data = JSON.stringify({
				pages: Math.ceil(count / perPage),
				data: projects,
				page: page
			});
			res.send(data);
    	})
    })
});

router.post('/add', ensureAuthenticatedAndVerified, (req, res, next) => {
	if(req.body.room){
		console.log(req.user)
		User.findOne({
			email :  req.user.email
		}).then(user =>{
			let newRoom = new Room({
				name : req.body.room,
				owner : user._id,
				members : [],
				public: true
			})
			newRoom.save().then(room => {
				res.redirect('/rooms');
			}).catch(err => {console.log(err); res.redirect('/rooms')});
		}).catch(err => {console.log(err); res.redirect('/rooms')});
	}
});

module.exports = router;