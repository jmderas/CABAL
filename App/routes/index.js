const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const path = require('path');

// transport object for mailing. does this use ssl?
const transporter = nodemailer.createTransport({
  service: global.gConfig.email.service,
  auth: {
    user: global.gConfig.email.username,
    pass: global.gConfig.email.password
  },
  tls: {
  	rejectUnauthorized: false
  }
});

// Welcome Page
router.get('/', ensureAuthenticated, (req, res) => res.sendFile(path.join(__dirname, '../views', 'dashboard.html')));

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.sendFile(path.join(__dirname, '../views', 'login.html')));

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: false
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

//register
router.get('/register', forwardAuthenticated, (req, res) => res.sendFile(path.join(__dirname, '../views', 'register.html')));

router.post('/register', (req, res, next) => {
		User.findOne({
			email: req.body.email
		}).then(function(user){
			if(!user){
				//create a new user
				const newUser = new User({
					username: req.body.username,
					email: req.body.email,
					firstName: req.body.first, 
					lastName: req.body.last,
					password: User.generateHash(req.body.password)
				});
				//commit new user to db
				console.log(newUser);
				//email new user
				const mailOptions = {
					from: global.gConfig.email.username,
					to: req.body.email,
					subject: 'Sending Email using Node.js',
					text: "You ain't got the answers Sway!"
				};
				console.log(mailOptions);
				transporter.sendMail(mailOptions, function(error, info){
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					}
				});
				newUser.save()
              	.then(newUser => {
	                //log them in and send to dashboard
	                res.redirect('/login')
	              })
	           	.catch(err => res.redirect('/login'));
			}else{
				console.log("User already exists")
				//user already exists
				res.redirect('/login');
			}
		})
});

module.exports = router;