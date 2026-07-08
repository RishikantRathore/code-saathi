// ═══════════════════════════════════════════
//   CODE SAATHI — Express Server
//   Run: node server.js  (or npm run dev)
// ═══════════════════════════════════════════
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const path       = require('path');

const authRoutes    = require('./routes/auth');
const reviewRoutes  = require('./routes/review');
const progressRoutes= require('./routes/progress');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// ── Serve frontend statically ──
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ──
app.use('/api/auth',     authRoutes);
app.use('/api/review',   reviewRoutes);
app.use('/api/progress', progressRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Code Saathi backend is running 🚀' });
});

// ── Catch-all: serve frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Connect MongoDB & Start ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Code Saathi running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('💡 Make sure MongoDB is running or set MONGO_URI in .env');
    // Start server anyway (auth won't work but AI review will)
    app.listen(PORT, () => {
      console.log(`⚠️  Server running on http://localhost:${PORT} (DB offline)`);
    });
  });
