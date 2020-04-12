const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  code: {
  	type: String,
  	required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
})

const Verification = mongoose.model('Verification', VerificationSchema);

module.exports = Verification;