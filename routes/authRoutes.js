const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, resendOtp, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp',   sendOtp);    // Step 1: send OTP to email
router.post('/verify-otp', verifyOtp);  // Step 2: verify OTP → create account
router.post('/resend-otp', resendOtp);  // Resend fresh OTP
router.post('/login',      login);
router.get('/me',          protect, getMe);

module.exports = router;
