# 🩺 Path2Prevention

<div align="center">
  <img src="public/images/logo!.jpeg" alt="Path2Prevention Logo" width="200" />
</div>

> **Understand your diabetes risk. Build healthier habits. Take control.**

A full-stack web application that calculates personalised diabetes risk scores, tracks daily health logs, and delivers evidence-based recommendations — all without any medical registration required.

[![Node.js](https://img.shields.io/badge/Node.js-≥18-green?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://cloud.mongodb.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://vercel.com)

---

## ✨ Features

- **Risk Score Engine** — Dynamic 0–100 diabetes risk scoring based on WHO/NICE clinical guidelines
- **Daily Health Logging** — Track glucose, HbA1c, weight, blood pressure, diet, and activity
- **Personalised Insights** — AI-driven trend analysis and anomaly detection
- **Evidence-based Recommendations** — Ranked, actionable advice from a rule-based pipeline
- **Engagement Tracking** — Streaks, weekly goals, and progress milestones
- **PWA Support** — Installable on mobile, works offline for static assets
- **Data Export** — Download your health data as JSON or CSV

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Frontend** | Vanilla JS + CSS (no framework) |
| **Auth** | JWT (HS256) + bcrypt |
| **Security** | Helmet, express-mongo-sanitize, rate limiting |
| **Deployment** | Vercel (serverless) |
| **Push Notifications** | Web Push (VAPID) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/path2prevention.git
cd path2prevention
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)
```

### 3. Seed the Database

```bash
npm run seed:rules    # Import rule engine data
npm run seed          # (Optional) Add sample data
```

### 4. Run

```bash
npm run dev           # Development with hot-reload
# OR
npm start             # Production mode
```

App will be live at `http://localhost:5000`

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | 128-char random hex for signing JWTs | ✅ |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) | ✅ |
| `NODE_ENV` | `development` or `production` | ✅ |
| `ALLOWED_ORIGIN` | Your production domain for CORS | ✅ |
| `VAPID_PUBLIC_KEY` | Web Push public key | ⚠️ Optional |
| `VAPID_PRIVATE_KEY` | Web Push private key | ⚠️ Optional |
| `VAPID_EMAIL` | Contact email for VAPID | ⚠️ Optional |
| `RISK_THRESHOLD_MEDIUM` | Risk score threshold (default: 25) | Optional |
| `RISK_THRESHOLD_HIGH` | Risk score threshold (default: 50) | Optional |
| `RISK_THRESHOLD_VERY_HIGH` | Risk score threshold (default: 75) | Optional |

**Generate secrets:**
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# VAPID Keys
node -e "const {generateVAPIDKeys}=require('web-push'); console.log(JSON.stringify(generateVAPIDKeys(), null, 2))"
```

---

## 📁 Project Structure

```
path2prevention/
├── api/
│   └── index.js          # Express app entry point (Vercel serverless)
├── public/
│   ├── app.html          # Main SPA shell
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── css/main.css      # Global styles
│   ├── js/               # Frontend modules
│   ├── images/           # Static assets & PWA icons
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker
├── src/
│   ├── config/db.js      # MongoDB connection (serverless-cached)
│   ├── middleware/       # Auth, validation, rate limiting
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express route handlers
│   ├── services/         # Risk pipeline & computation
│   └── utils/            # Shared utilities
├── scripts/
│   ├── seed.js           # Rule engine seeder
│   └── seedTestData.js   # Test data seeder
├── .env.example          # Environment template
├── vercel.json           # Vercel deployment config
└── package.json
```

---

## 🌐 Deployment (Vercel + MongoDB Atlas)

### MongoDB Atlas
1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist all IPs: `0.0.0.0/0` (Vercel uses dynamic IPs)
4. Get connection string → paste as `MONGODB_URI`

### Vercel
1. Push this repo to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Deploy!

---

## 📄 License

This project is private and unlicensed. All rights reserved.
