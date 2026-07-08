// models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language:  { type: String, required: true },
  code:      { type: String, required: true },
  score:     { type: Number, required: true, min: 0, max: 100 },
  scoreLabel:{ type: String },
  summary:   { type: String },
  complexity: {
    time:        String,
    space:       String,
    explanation: String
  },
  mistakes: [{
    title: String,
    body:  String
  }],
  optimizedCode:     { type: String },
  optimizationNotes: { type: String },
  interviewQuestions:[String],
  roadmap: [{
    title: String,
    desc:  String
  }],
  createdAt: { type: Date, default: Date.now }
});

// Index for fast queries per user
ReviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);
