# Code Saathi 🚀
### AI-Powered Learning Code Reviewer — BTech Final Year Project

---

## 📁 Project Structure
```
code-saathi/
├── backend/
│   ├── server.js              ← Express server (entry point)
│   ├── package.json
│   ├── .env.example           ← Copy to .env and fill values
│   ├── middleware/
│   │   └── auth.js            ← JWT verification middleware
│   ├── models/
│   │   ├── User.js            ← User schema (bcrypt passwords)
│   │   ├── Review.js          ← Review schema (full AI result)
│   │   └── Streak.js          ← Streak tracking schema
│   └── routes/
│       ├── auth.js            ← POST /api/auth/register, /login, GET /api/auth/me
│       ├── review.js          ← POST /api/review/analyze, GET /history, DELETE /:id
│       └── progress.js        ← GET /api/progress/stats
└── frontend/
    ├── index.html
    ├── css/main.css
    └── js/
        ├── api.js             ← All fetch calls to backend
        ├── auth.js            ← Login/Register/Session
        ├── editor.js          ← Code editor logic
        ├── results.js         ← Render AI results
        ├── progress.js        ← Stats, calendar, chart
        ├── export.js          ← PDF / Copy / Share
        └── app.js             ← Bootstrap + tab switching
```

---

## 🛠️ Prerequisites

- **Node.js** v18+ → https://nodejs.org
- **MongoDB** (one of):
  - Local: Install from https://www.mongodb.com/try/download/community
  - Free cloud: https://www.mongodb.com/atlas (M0 free tier)
- **Anthropic API Key** → https://console.anthropic.com

---

## 🚀 Setup & Run (Step by Step)

### Step 1 — Clone / extract the project
```bash
cd code-saathi/backend
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Create your .env file
```bash
cp .env.example .env
```
Open `.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/codesaathi
JWT_SECRET=any_long_random_string_here
ANTHROPIC_API_KEY=sk-ant-your-key-here
FRONTEND_URL=http://localhost:5000
```

### Step 4 — Start MongoDB (if local)
```bash
# macOS/Linux
mongod

# Windows
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
```

### Step 5 — Start the server
```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

### Step 6 — Open the app
```
http://localhost:5000
```
The backend serves the frontend automatically. ✅

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | ❌ |
| POST | /api/auth/login | Login, returns JWT | ❌ |
| GET | /api/auth/me | Get current user | ✅ |

### Review
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/review/analyze | Analyze code via Claude AI | ✅ |
| GET | /api/review/history | Get paginated review history | ✅ |
| GET | /api/review/:id | Get single full review | ✅ |
| DELETE | /api/review/:id | Delete a review | ✅ |

### Progress
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/progress/stats | Stats, streak, history for charts | ✅ |

---

## ✨ Features

| Feature | Status |
|---------|--------|
| Register / Login (JWT + bcrypt) | ✅ |
| Guest mode (no login required) | ✅ |
| Code Review via Claude AI | ✅ |
| Mistake explanations (simple language) | ✅ |
| Time & Space complexity | ✅ |
| Optimized code generation | ✅ |
| 5 Interview questions from code | ✅ |
| Personalized learning roadmap | ✅ |
| Review history saved in MongoDB | ✅ |
| Progress tracking (scores, streak) | ✅ |
| 28-day streak calendar | ✅ |
| Score trend chart (Chart.js) | ✅ |
| Language breakdown bar chart | ✅ |
| Syntax highlighting (Highlight.js) | ✅ |
| Export PDF report | ✅ |
| Copy / Share report | ✅ |
| Responsive (mobile + desktop) | ✅ |

---

## 🧪 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI Engine | Claude API (Anthropic) |
| Charts | Chart.js |
| Syntax Highlight | Highlight.js |
| Icons | Tabler Icons |
| Fonts | Sora + JetBrains Mono |

---

## 🐛 Troubleshooting

**MongoDB not connecting?**
- Make sure `mongod` is running
- Or use MongoDB Atlas free cloud: replace `MONGO_URI` with your Atlas connection string

**API key error?**
- Make sure `ANTHROPIC_API_KEY` is set in `.env`
- Check https://console.anthropic.com for your key

**Port already in use?**
- Change `PORT=5000` to another port like `5001` in `.env`

**CORS error?**
- Make sure `FRONTEND_URL` in `.env` matches where you're opening the app

---

*Built with ❤️ for BTech Final Year Project using Claude AI*
