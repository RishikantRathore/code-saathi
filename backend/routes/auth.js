// routes/auth.js
const express  = require('express');
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const Storage  = require('../services/storage');
const authMW   = require('../middleware/auth');
const router   = express.Router();

function makeToken(userId) {
  const secret = process.env.JWT_SECRET || 'codesaathi_secret_key_2024_auth';
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
}

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    let user;
    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing)
        return res.status(400).json({ error: 'An account with this email already exists.' });

      user = await User.create({ name, email, password });
    } else {
      user = await Storage.createUser({ name, email, password });
    }

    const token = makeToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000 || err.message.includes('already exists')) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = await Storage.findUserByEmail(email);
    }

    if (!user)
      return res.status(400).json({ error: 'No account found with this email.' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(400).json({ error: 'Incorrect password.' });

    if (mongoose.connection.readyState === 1) {
      user.lastLogin = new Date();
      await user.save();
    }

    const token = makeToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// ── GET /api/auth/me  (verify token, get profile) ──
router.get('/me', authMW, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u._id, name: u.name, email: u.email } });
});

module.exports = router;
