// models/Streak.js
const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Store reviewed dates as YYYY-MM-DD strings
  days: [{ type: String }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Streak', StreakSchema);
