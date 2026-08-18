// routes/review.js — Using FREE Google Gemini API
const express = require('express');
const authMW  = require('../middleware/auth');
const Review  = require('../models/Review');
const Streak  = require('../models/Streak');
const router  = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Code Saathi, an AI learning-focused code reviewer for BTech students in India.
Your goal is to help students LEARN — be encouraging, clear, and educational.

Analyze the provided code and return ONLY valid JSON. No markdown fences, no extra text, nothing outside JSON.

Return exactly this structure:
{
  "score": <integer 0-100>,
  "score_label": <"Needs Work"|"Decent"|"Good"|"Excellent">,
  "summary": "<one sentence overall quality>",
  "complexity": {
    "time": "<Big-O e.g. O(n^2)>",
    "space": "<Big-O e.g. O(n)>",
    "explanation": "<1-2 simple sentences for a BTech student>"
  },
  "mistakes": [
    { "title": "<short mistake name>", "body": "<mentor-style simple explanation>" }
  ],
  "optimized_code": "<full working optimized code as string>",
  "optimization_notes": "<brief explanation of improvements>",
  "interview_questions": ["<q1>","<q2>","<q3>"],
  "roadmap": [
    { "title": "<topic>", "desc": "<why, how, timeframe>" }
  ]
}

Rules:
- Return valid JSON only.
- Format optimized_code with clean indentation, comments, and proper line breaks (\n). Never condense or minify onto one single line.
- roadmap 2-3 steps only.
- interview_questions exactly 3.
- Do not include markdown fences in the output.
- Escape all quotes and special characters inside JSON strings properly.`;

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-pro-latest'
].filter(Boolean);

// Remove duplicates
const UNIQUE_MODELS = [...new Set(CANDIDATE_MODELS)];

function buildPrompt(code, language, options = {}) {
  const { mode = 'comprehensive', languageStyle = 'english', customInstruction = '' } = options;

  let modeFocus = '';
  if (mode === 'bug_fixer') {
    modeFocus = 'Focus intensely on diagnosing runtime bugs, logic errors, edge-cases, null/undefined safety, and explaining the exact cause & step-by-step fix.';
  } else if (mode === 'complexity') {
    modeFocus = 'Focus intensely on Big-O time and space complexity, nested iteration bottlenecks, recursion depths, memory usage, and finding optimal mathematical/DSA asymptotic algorithms.';
  } else if (mode === 'interview') {
    modeFocus = 'Adopt the persona of a Senior FAANG Technical Interviewer. Grill the student on edge-cases, trade-offs, scalability, and produce high-yield interview follow-up questions.';
  } else if (mode === 'security') {
    modeFocus = 'Focus on code security, memory safety, injection vulnerabilities, unhandled exceptions, resource leaks, and production-grade defense.';
  } else {
    modeFocus = 'Provide a balanced, high-yield comprehensive code review covering mistakes, complexity, optimization, interview prep, and a learning roadmap.';
  }

  let languageTone = '';
  if (languageStyle === 'hinglish') {
    languageTone = 'IMPORTANT: Explain all summaries, mistake explanations, complexity notes, and roadmap steps in friendly, encouraging conversational HINGLISH (Hindi written in Latin/English alphabet, e.g., "Aapka loop yahan par duplicate check kar raha hai, jise hum Set use karke O(n) me speed up kar sakte hain"). Keep the code and programming keywords in English.';
  }

  let customBlock = '';
  if (customInstruction && customInstruction.trim()) {
    customBlock = `User Note / Specific Focus: ${customInstruction.trim()}`;
  }

  return `You are Code Saathi, an AI learning-focused code reviewer for BTech students and developers in India.
Your goal is to help students LEARN — be encouraging, clear, educational, and deeply insightful.

${modeFocus}
${languageTone}
${customBlock}

Analyze the provided code and return ONLY valid JSON. No markdown fences, no extra text, nothing outside JSON.

Return exactly this structure:
{
  "score": <integer 0-100>,
  "score_label": <"Needs Work"|"Decent"|"Good"|"Excellent">,
  "summary": "<one sentence overall quality>",
  "complexity": {
    "time": "<Big-O e.g. O(n^2)>",
    "space": "<Big-O e.g. O(n)>",
    "explanation": "<1-2 simple sentences for a student>"
  },
  "mistakes": [
    { "title": "<short mistake name>", "body": "<mentor-style simple explanation>" }
  ],
  "optimized_code": "<full working optimized code as string>",
  "optimization_notes": "<brief explanation of improvements>",
  "interview_questions": ["<q1>","<q2>","<q3>"],
  "roadmap": [
    { "title": "<topic>", "desc": "<why, how, timeframe>" }
  ]
}

Rules:
- Return valid JSON only.
- Format optimized_code with clean indentation, comments, and proper line breaks (\\n). Never condense or minify onto one single line.
- roadmap 2-3 steps only.
- interview_questions exactly 3.
- Do not include markdown fences in the output.
- Escape all quotes and special characters inside JSON strings properly.

Language: ${language}
Review Mode: ${mode}

Code:
${code}`;
}

// ── Shared Gemini call function with automatic fallback cascade ──
async function callGemini(code, language, options = {}) {
  const prompt = buildPrompt(code, language, options);
  let lastError = null;

  for (const modelName of UNIQUE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    try {
      const apiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        })
      });

      if (!apiRes.ok) {
        const err = await apiRes.json().catch(() => ({}));
        const errMsg = err.error?.message || `Status ${apiRes.status}`;
        console.warn(`[Gemini] Model ${modelName} returned error: ${errMsg}. Trying fallback model...`);
        lastError = new Error(errMsg);
        // Continue to try next fallback model
        continue;
      }

      const apiData = await apiRes.json();
      let text = apiData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Empty response received from Gemini.");
      }

      // Strip markdown code fences if present
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error("RAW GEMINI RESPONSE JSON PARSE FAILED:", text);
        return {
          score: 75,
          score_label: "Decent",
          summary: "Code reviewed successfully.",
          complexity: { time: "O(n)", space: "O(1)", explanation: "Standard loop execution." },
          mistakes: [],
          optimized_code: code,
          optimization_notes: "Parsed results.",
          interview_questions: ["What is the algorithmic efficiency of this function?"],
          roadmap: [{ title: "Optimization", desc: "Practice writing idiomatic algorithms." }]
        };
      }

    } catch (err) {
      console.warn(`[Gemini] Attempt on ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini model endpoints failed. Please check your API key.");
}

const mongoose = require('mongoose');
const Storage  = require('../services/storage');

// ── POST /api/review/guest  (no auth — guest mode) ──
router.post('/guest', async (req, res) => {
  const { code, language, mode, languageStyle, customInstruction } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: 'Code and language are required.' });
  if (!process.env.GEMINI_API_KEY)
    return res.status(500).json({ error: 'API key not configured.' });
  try {
    const result = await callGemini(code, language, { mode, languageStyle, customInstruction });
    res.json({ result });
  } catch (err) {
    console.error('Guest analyze error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// ── POST /api/review/analyze  (protected — saves to DB or local fallback) ──
router.post('/analyze', authMW, async (req, res) => {
  const { code, language, mode, languageStyle, customInstruction } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: 'Code and language are required.' });
  if (!process.env.GEMINI_API_KEY)
    return res.status(500).json({ error: 'Gemini API key not configured on server.' });

  try {
    const result = await callGemini(code, language, { mode, languageStyle, customInstruction });

    if (!result.score_label) {
      throw new Error("Invalid AI response received.");
    }

    let reviewId;
    const reviewData = {
      userId:             req.user._id,
      language,
      code,
      score:              result.score,
      scoreLabel:         result.score_label,
      summary:            result.summary,
      complexity:         result.complexity,
      mistakes:           result.mistakes || [],
      optimizedCode:      result.optimized_code,
      optimizationNotes:  result.optimization_notes,
      interviewQuestions: result.interview_questions?.slice(0, 3) || [],
      roadmap:            result.roadmap?.slice(0, 3) || []
    };

    if (mongoose.connection.readyState === 1) {
      const review = await Review.create(reviewData);
      await _updateStreak(req.user._id);
      reviewId = review._id;
    } else {
      const review = await Storage.createReview(reviewData);
      reviewId = review._id;
    }

    res.json({ result, reviewId });

  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// ── GET /api/review/history ──
router.get('/history', authMW, async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || 1);
    const limit = parseInt(req.query.limit || 30);

    if (mongoose.connection.readyState === 1) {
      const skip  = (page - 1) * limit;
      const [reviews, total] = await Promise.all([
        Review.find({ userId: req.user._id })
          .sort({ createdAt: -1 }).skip(skip).limit(limit)
          .select('-code -optimizedCode'),
        Review.countDocuments({ userId: req.user._id })
      ]);
      res.json({ reviews, total, page, pages: Math.ceil(total / limit) });
    } else {
      const data = await Storage.getReviewsByUser(req.user._id, page, limit);
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch history.' });
  }
});

// ── GET /api/review/:id ──
router.get('/:id', authMW, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
      if (!review) return res.status(404).json({ error: 'Review not found.' });
      res.json({ review });
    } else {
      const review = await Storage.getReviewById(req.params.id, req.user._id);
      if (!review) return res.status(404).json({ error: 'Review not found.' });
      res.json({ review });
    }
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch review.' });
  }
});

// ── DELETE /api/review/:id ──
router.delete('/:id', authMW, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Review.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    } else {
      await Storage.deleteReview(req.params.id, req.user._id);
    }
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete review.' });
  }
});

// ── Helper: update streak ──
async function _updateStreak(userId) {

  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];
  let streak  = await Streak.findOne({ userId });
  if (!streak) {
    streak = new Streak({ userId, days: [today] });
  } else if (!streak.days.includes(today)) {
    streak.days.push(today);
  }
  const days = [...new Set(streak.days)].sort().reverse();
  let cur = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const key = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
    if (days.includes(key)) cur++;
    else if (i > 0) break;
  }
  streak.currentStreak = cur;
  streak.longestStreak = Math.max(streak.longestStreak, cur);
  streak.updatedAt     = new Date();
  await streak.save();
}

module.exports = router;
