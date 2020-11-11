const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const session = require('express-session');
const mongodbstore = require('connect-mongodb-session')(session);
const path = require('path');
const config = require('./config/config.json');
const User = require('./models/user');
const app =  express();

//load configs
const environment = process.env.NODE_ENV || 'development';
const environmentConfig = config[environment];
global.gConfig = environmentConfig;

//set up passport 
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.validPassword(password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
	  done(err, user);
	});
});

//connect to MongoDB. If collection doesn't exist, it is created
console.log(`mongodb://${global.gConfig.database.host}:${global.gConfig.database.port}/${global.gConfig.database.name}`);
mongoose.connect(`mongodb://${global.gConfig.database.host}:${global.gConfig.database.port}/${global.gConfig.database.name}`,{ useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

//create a new collection to store session information
const store = new mongodbstore({
  uri: `mongodb://${global.gConfig.database.host}:${global.gConfig.database.port}/${global.gConfig.session.database}`,
  collection: global.gConfig.session.collection
});

app.use(expressLayouts);
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// tell the express app to use express session and use our MongoDB collection from above
app.use(
  session({
    secret: global.gConfig.session.secretkey,
    resave: true,
    saveUninitialized: true,
	cookie: { maxAge:global.gConfig.session.maxAge},
	store:store,
	unset:'destroy'
  })
);

// tell express app to use passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use(function(req, res, next) {
  res.locals.user = req.user || null;
  next();
});


const server = app.listen(global.gConfig.port, function(){
	console.log(`listening on ${global.gConfig.port}`);
});

const io = require('socket.io').listen(server);

io.on('connection', function(socket){
  socket.on('chat message', function(payload){
    if(payload && payload.msg){
      console.log("sending msg");
      io.emit('chat message', payload);
    }
  });
});

app.use('/', require('./routes/index'));
app.use('/rooms',require('./routes/rooms'))

