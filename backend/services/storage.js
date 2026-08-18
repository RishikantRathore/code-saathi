// services/storage.js — Seamless local JSON fallback when MongoDB is offline
const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR  = path.join(__dirname, '../data');
const STORE_FILE= path.join(DATA_DIR, 'store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function _load() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading fallback store:', e);
  }
  return { users: [], reviews: [], streaks: [] };
}

function _save(data) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving fallback store:', e);
  }
}

const Storage = {
  // ── USER METHODS ──
  async createUser({ name, email, password }) {
    const data = _load();
    const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('An account with this email already exists.');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    data.users.push(user);
    _save(data);
    return { _id: user._id, name: user.name, email: user.email };
  },

  async findUserByEmail(email) {
    const data = _load();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return {
      ...user,
      comparePassword: (plain) => bcrypt.compare(plain, user.password)
    };
  },

  async findUserById(id) {
    const data = _load();
    const user = data.users.find(u => u._id === id);
    if (!user) return null;
    return { _id: user._id, name: user.name, email: user.email };
  },

  // ── REVIEW METHODS ──
  async createReview(reviewData) {
    const data = _load();
    const review = {
      _id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      ...reviewData,
      createdAt: new Date().toISOString()
    };
    data.reviews.unshift(review);
    _save(data);
    await this.updateStreak(reviewData.userId);
    return review;
  },

  async getReviewsByUser(userId, page = 1, limit = 30) {
    const data = _load();
    const userReviews = data.reviews.filter(r => r.userId === userId);
    const skip = (page - 1) * limit;
    const paginated = userReviews.slice(skip, skip + limit);
    return {
      reviews: paginated.map(({ code, optimizedCode, ...rest }) => rest),
      total: userReviews.length,
      page,
      pages: Math.ceil(userReviews.length / limit)
    };
  },

  async getReviewById(id, userId) {
    const data = _load();
    return data.reviews.find(r => r._id === id && r.userId === userId) || null;
  },

  async deleteReview(id, userId) {
    const data = _load();
    data.reviews = data.reviews.filter(r => !(r._id === id && r.userId === userId));
    _save(data);
    return true;
  },

  // ── STREAK & PROGRESS METHODS ──
  async updateStreak(userId) {
    const data = _load();
    const today = new Date().toISOString().split('T')[0];
    let streak = data.streaks.find(s => s.userId === userId);

    if (!streak) {
      streak = { userId, days: [today], currentStreak: 1, longestStreak: 1, updatedAt: new Date().toISOString() };
      data.streaks.push(streak);
    } else {
      if (!streak.days.includes(today)) streak.days.push(today);
      const days = [...new Set(streak.days)].sort().reverse();
      let cur = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const key = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
        if (days.includes(key)) cur++;
        else if (i > 0) break;
      }
      streak.currentStreak = cur;
      streak.longestStreak = Math.max(streak.longestStreak || 0, cur);
      streak.updatedAt = new Date().toISOString();
    }
    _save(data);
    return streak;
  },

  async getProgressStats(userId) {
    const data = _load();
    const userReviews = data.reviews.filter(r => r.userId === userId);
    const streak = data.streaks.find(s => s.userId === userId);

    if (!userReviews.length) {
      return { totalReviews: 0, avgScore: 0, bestScore: 0, currentStreak: 0, longestStreak: 0, langBreakdown: [], scoreHistory: [], streakDays: [] };
    }

    const scores = userReviews.map(r => r.score || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);

    const langMap = {};
    userReviews.forEach(r => { langMap[r.language] = (langMap[r.language] || 0) + 1; });
    const langBreakdown = Object.entries(langMap).sort((a, b) => b[1] - a[1]).map(([lang, count]) => ({ lang, count }));

    const scoreHistory = userReviews.slice(0, 20).reverse().map((r, i) => ({
      index: i + 1,
      score: r.score,
      date: r.createdAt
    }));

    return {
      totalReviews: userReviews.length,
      avgScore,
      bestScore,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      langBreakdown,
      scoreHistory,
      streakDays: streak?.days || []
    };
  }
};

module.exports = Storage;
