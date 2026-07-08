// routes/progress.js
const express = require('express');
const authMW  = require('../middleware/auth');
const Review  = require('../models/Review');
const Streak  = require('../models/Streak');
const router  = express.Router();

// ── GET /api/progress/stats ──
router.get('/stats', authMW, async (req, res) => {
  try {
    const userId = req.user._id;

    const [reviews, streak] = await Promise.all([
      Review.find({ userId }).select('score language createdAt'),
      Streak.findOne({ userId })
    ]);

    if (!reviews.length) {
      return res.json({ totalReviews: 0, avgScore: 0, bestScore: 0, currentStreak: 0, longestStreak: 0, langBreakdown: [], scoreHistory: [], streakDays: [] });
    }

    const scores = reviews.map(r => r.score);
    const avgScore  = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);

    // Language breakdown
    const langMap = {};
    reviews.forEach(r => { langMap[r.language] = (langMap[r.language] || 0) + 1; });
    const langBreakdown = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => ({ lang, count }));

    // Score history (last 20)
    const scoreHistory = reviews
      .slice(-20)
      .map((r, i) => ({
        index: i + 1,
        score: r.score,
        date: r.createdAt
      }));

    res.json({
      totalReviews:  reviews.length,
      avgScore,
      bestScore,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      langBreakdown,
      scoreHistory,
      streakDays:    streak?.days || []
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Could not fetch stats.' });
  }
});

module.exports = router;
