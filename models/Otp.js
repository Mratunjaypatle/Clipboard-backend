const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  // store hashed password so we don't re-hash on verify
  hashedPassword: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Auto-delete documents after they expire (MongoDB TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// One OTP record per email at a time
otpSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Otp', otpSchema);
