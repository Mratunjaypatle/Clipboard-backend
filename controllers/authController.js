const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'cloudclip_dev_secret_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// Maps SMTP error codes to human-readable messages
const smtpErrMsg = (err) => {
  const map = {
    ETIMEDOUT:    'SMTP connection timed out (code: ETIMEDOUT). Verify SMTP_HOST/SMTP_PORT and that your machine allows outbound connections on that port.',
    ECONNREFUSED: 'SMTP connection refused (code: ECONNREFUSED). Check SMTP_HOST and SMTP_PORT in server .env.',
    EAUTH:        'SMTP authentication failed (code: EAUTH). For Gmail use an App Password, not your account password.',
    ENOTFOUND:    'SMTP host not found (code: ENOTFOUND). Check that SMTP_HOST is spelled correctly in server .env.',
  };
  if (err.code && map[err.code]) return map[err.code];
  if (err.responseCode) return `SMTP error ${err.responseCode}: ${err.response || 'check your .env SMTP settings'}`;
  return `Email sending failed: ${err.message}`;
};

// POST /api/auth/send-otp
const sendOtp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ error: 'Name is required.' });
    if (!email || !email.trim())
      return res.status(400).json({ error: 'Email is required.' });
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, name: name.trim(), hashedPassword, otp, attempts: 0, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendOtpEmail({ to: normalizedEmail, name: name.trim(), otp });
    } catch (emailErr) {
      console.error('SMTP error details:', emailErr);
      // Clean up the OTP record so user can try again
      await Otp.deleteOne({ email: normalizedEmail });
      return res.status(502).json({ error: smtpErrMsg(emailErr) });
    }

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ error: 'Email and OTP are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({ email: normalizedEmail });

    if (!record)
      return res.status(400).json({ error: 'No pending verification found. Please register again.' });

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ error: 'OTP has expired. Please register again.' });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ error: 'Too many incorrect attempts. Please register again.' });
    }

    if (record.otp !== otp.trim()) {
      record.attempts += 1;
      await record.save();
      const remaining = MAX_OTP_ATTEMPTS - record.attempts;
      return res.status(400).json({
        error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    const alreadyExists = await User.findOne({ email: normalizedEmail });
    if (alreadyExists) {
      await Otp.deleteOne({ email: normalizedEmail });
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = new User({
      name: record.name,
      email: record.email,
      password: record.hashedPassword,
    });
    user.$locals.skipHash = true;
    await user.save();

    await Otp.deleteOne({ email: normalizedEmail });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({ email: normalizedEmail });

    if (!record)
      return res.status(400).json({ error: 'No pending registration found. Please fill in the form again.' });

    const otp = generateOtp();
    record.otp = otp;
    record.attempts = 0;
    record.expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await record.save();

    try {
      await sendOtpEmail({ to: normalizedEmail, name: record.name, otp });
    } catch (emailErr) {
      console.error('SMTP error details:', emailErr);
      return res.status(502).json({ error: smtpErrMsg(emailErr) });
    }

    res.json({ success: true, message: `A new code has been sent to ${normalizedEmail}.` });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user._id);
    res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendOtp, verifyOtp, resendOtp, login, getMe };