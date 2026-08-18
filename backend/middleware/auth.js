// middleware/auth.js
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const User     = require('../models/User');
const Storage  = require('../services/storage');

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'codesaathi_secret_key_2024_auth';
    const decoded = jwt.verify(token, secret);
    
    let user = null;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.userId).select('-password');
    } else {
      user = await Storage.findUserById(decoded.userId);
    }

    if (!user) return res.status(401).json({ error: 'User not found.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};
