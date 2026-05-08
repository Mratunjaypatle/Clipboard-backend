const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'cloudclip_dev_secret_change_in_production';

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid token. Please log in.' });
    }

    // Attach user id to request
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };
