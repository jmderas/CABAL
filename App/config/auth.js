const path = require('path');
/*
  Utility functions to for checking authentication
*/
module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  },
  ensureAuthenticatedAndVerified: function(req, res, next) {
    if (req.isAuthenticated()) {
      if(req.user.verified){
        return next();
      }else{
        res.redirect('/verify');
        return;
      }
    }
    res.redirect('/login');
  },
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');      
  }
};
