// routes/review.js — Using FREE Google Gemini API
const express = require('express');
const authMW  = require('../middleware/auth');
const Review  = require('../models/Review');
const Streak  = require('../models/Streak');
const router  = express.Router();

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

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
- Keep optimized_code short.
- roadmap 2-3 steps only.
- interview_questions exactly 3.
- Do not include markdown.
- Escape all quotes inside code strings.`;

// ── Shared Gemini call function ──
async function callGemini(code, language) {
 const prompt =
    `${SYSTEM_PROMPT}\n\nLanguage: ${language}\n\nCode:\n${code}`;

  const apiRes = await fetch(
    `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
       generationConfig: {
  temperature: 0,
  maxOutputTokens: 4096
}
      })
    }
  );

  if (!apiRes.ok) {
    const err = await apiRes.json();
    throw new Error(
      err.error?.message || "Gemini API Error"
    );
  }

  const apiData = await apiRes.json();

  const text =
  apiData?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!text) {
  throw new Error(
    "Empty response received from Gemini."
  );
}

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("RAW GEMINI RESPONSE:");
    console.error(text);

    return {
      score: 0,
      score_label: "Analysis Error",
      summary:
        "Gemini returned invalid JSON.",
      complexity: {
        time: "Unknown",
        space: "Unknown",
        explanation:
          "AI response format issue."
      },
      mistakes: [],
      optimized_code: "",
      optimization_notes:
        "Retry analysis.",
      interview_questions: [],
      roadmap: []
    };
  }
}

// ── POST /api/review/guest  (no auth — guest mode) ──
router.post('/guest', async (req, res) => {
  const { code, language } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: 'Code and language are required.' });
  if (!process.env.GEMINI_API_KEY)
    return res.status(500).json({ error: 'API key not configured.' });
  try {
    const result = await callGemini(code, language);
    res.json({ result });
  } catch (err) {
    console.error('Guest analyze error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// ── POST /api/review/analyze  (protected — saves to DB) ──
router.post('/analyze', authMW, async (req, res) => {
  const { code, language } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: 'Code and language are required.' });
  if (!process.env.GEMINI_API_KEY)
    return res.status(500).json({ error: 'Gemini API key not configured on server.' });

  try {
const result =
  await callGemini(code, language);

if (!result.score_label) {
  throw new Error(
    "Invalid AI response received."
  );
}
    const review = await Review.create({
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
      interviewQuestions:
  result.interview_questions?.slice(0, 3) || [],

roadmap:
  result.roadmap?.slice(0, 3) || []
    });

    await _updateStreak(req.user._id);
    res.json({ result, reviewId: review._id });

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
    const skip  = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ userId: req.user._id })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .select('-code -optimizedCode'),
      Review.countDocuments({ userId: req.user._id })
    ]);
    res.json({ reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch history.' });
  }
});

// ── GET /api/review/:id ──
router.get('/:id', authMW, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    res.json({ review });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch review.' });
  }
});

// ── DELETE /api/review/:id ──
router.delete('/:id', authMW, async (req, res) => {
  try {
    await Review.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
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
