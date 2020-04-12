const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated, ensureAuthenticatedAndVerified, forwardAuthenticated } = require('../config/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/user');
const Verification = require('../models/verification');
const path = require('path');

// transport object for mailing. does this use ssl?
const transporter = nodemailer.createTransport({
  service: global.gConfig.email.service,
  auth: {
    user: global.gConfig.email.username,
    pass: global.gConfig.email.password
  },
  tls: {
  	rejectUnauthorized: false //temporary
  }
});

// Welcome Page
router.get('/', ensureAuthenticatedAndVerified, (req, res) => res.render('dashboard'));

//chatroom
router.get('/chat', ensureAuthenticatedAndVerified, (req, res) => res.render('chatroom'));

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login',{layout: 'layout-nonav'}));

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
router.get('/register', forwardAuthenticated, (req, res) => res.render('register',{layout: 'layout-nonav'}));

router.post('/register', (req, res, next) => {
		User.findOne({
			email: req.body.email
		}).then(function(user){
			if(!user){
				//create a new user
				let newUser = new User({
					username: req.body.username,
					email: req.body.email,
					firstName: req.body.first, 
					lastName: req.body.last,
					password: User.generateHash(req.body.password)
				});
				//commit new user to db
				console.log(newUser);
				//email new user
				let confirmationCode = crypto.randomBytes(8).toString("hex");
				let mailOptions = {
					from: global.gConfig.email.username,
					to: req.body.email,
					subject: 'Welcome to Cabal ',
					text: "<h2>Welcome " + req.body.username + "!</h2><br><p>You must verify your new account before you can use Cabal</p> <p>Please use the following verification code when prompted: " + confirmationCode + "</p>"
				};
				console.log(mailOptions);
				transporter.sendMail(mailOptions, function(error, info){
					if (error) {
						console.log(error);
						res.redirect('/login');
					} else {
						console.log('Email sent: ' + info.response);
						newUser.save()
						.then(newUser => {
							//log them in and send to verification page
							let newVerification = new Verification({
								email: req.body.email,
								code: confirmationCode
							})
							newVerification.save().then(code =>{
								res.redirect('/login')
							})
						})
						.catch(err => 
							res.redirect('/login'));
						}
				});
			}else{
				console.log("User already exists")
				//user already exists
				res.redirect('/login');
			}
		})
});

router.get('/verify', ensureAuthenticated ,(req, res, next) => {
	res.render('verify',{layout: 'layout-nonav'})
});

router.post('/verify', ensureAuthenticated ,(req, res, next) => {
	Verification.findOne({
		email : req.user.email
	}).then(verification =>{
		if(verification){
			if(verification.code == req.body.confirmation){
				User.updateOne( { email : req.user.email},{verified : true}).then( (object) => {
					console.log(object)
					console.log("Verified. Removing verification from db");
					Verification.deleteOne({
						_id : verification._id
					}).then( (object) => {
						console.log(object);
						res.redirect('/');
					});
				});
			}else{
				console.log("Failed to verify");
				res.redirect('/verify');
			}
		}else{
			console.log("Failed to verify. Already verified");
			res.redirect('/');
		}
	}).catch(err => console.log(err));
});

module.exports = router;