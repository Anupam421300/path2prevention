# Path2Prevention — Complete Project Overview

## What Is This Project?

**Path2Prevention** is a **diabetes risk prevention web application**. It helps users **understand their diabetes risk** and **build healthier habits** through daily health logging, personalised risk scoring, evidence-based recommendations, and data-driven insights.

It is **NOT** a medical device or diagnostic tool — it is an **educational self-management tool** that uses published clinical research (WHO, ADA, NEJM Diabetes Prevention Program) to calculate a risk score from 0-100.

---

## What Does It Do? (Feature Summary)

| Feature | Description |
|---------|-------------|
| **User Registration & Login** | Email + password authentication, JWT tokens, and secure forgot password flow via DOB verification |
| **Onboarding Wizard** | 4-step guided setup: Personal Profile → Health Baseline → Lifestyle Scan → Roadmap |
| **Daily Health Logging** | Steps, sleep, water, sugary drinks, fast food, activity, stress, sedentary hours, glucose |
| **Weekly Body Measures** | Weight (kg) and waist circumference (cm) |
| **Diabetes Risk Score** | 0–100 score computed from 12+ health factors with breakdown |
| **Personalised Recommendations** | Rule-engine-driven, evidence-backed action items |
| **30-Day Challenge** | 4-week structured program with daily tasks |
| **What-If Simulator** | Adjust lifestyle sliders to see projected risk score changes |
| **Pattern Correlations** | Pearson-R statistical analysis of lifestyle signal relationships |
| **Risk Trajectory** | Trend analysis showing improving/worsening/stable |
| **Data Export** | CSV download and PDF clinical report generation |
| **Push Notifications** | Browser push via VAPID/Web-Push |
| **PWA Support** | Service worker for offline caching, installable on mobile |
| **Account Management** | Password change, feedback, account deletion |

---

## Tech Stack — Every Tool & Why

### Backend (Server-Side)

| Package | Version | Why It's Used |
|---------|---------|---------------|
| **Node.js** | ≥18.0 | JavaScript runtime — runs the server. Chosen because the entire app is JavaScript (frontend + backend = same language) |
| **Express.js** | ^4.18.2 | Web framework — handles HTTP requests, routing, middleware. Industry standard for Node.js APIs |
| **Mongoose** | ^8.0.3 | MongoDB ODM (Object Document Mapper) — defines schemas, validates data, queries MongoDB |
| **MongoDB Atlas** | (cloud) | NoSQL database — stores all user data, logs, scores. Cloud-hosted, free tier available |
| **bcryptjs** | ^2.4.3 | Password hashing — encrypts passwords with salt rounds (12). Never stores plain-text passwords |
| **jsonwebtoken** | ^9.0.2 | JWT authentication — creates signed tokens for stateless auth. Token = proof of login |
| **dotenv** | ^16.3.1 | Environment variables — loads `.env` file so secrets aren't in code |
| **helmet** | ^7.1.0 | Security headers — sets HTTP headers to prevent XSS, clickjacking, etc. |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing — controls which domains can call the API |
| **express-mongo-sanitize** | ^2.2.0 | NoSQL injection prevention — strips `$` and `.` from user input |
| **express-rate-limit** | ^7.1.5 | Rate limiting — prevents brute-force attacks and API abuse |
| **morgan** | ^1.10.0 | HTTP request logger — logs every request in dev mode for debugging |
| **zod** | ^3.22.4 | Schema validation — validates request body data types and constraints |
| **web-push** | ^3.6.7 | Push notifications — sends browser push notifications via VAPID keys |
| **archiver** | ^6.0.1 | ZIP file creation — (available for future data export features) |

### Frontend (Client-Side)

| Technology | Why It's Used |
|------------|---------------|
| **Vanilla HTML/CSS/JS** | No framework (React, Vue, etc.) — simpler, faster, no build step needed |
| **Chart.js** | (CDN) — renders line charts on dashboard and insights tab |
| **Google Fonts (Inter)** | Modern, professional typography |
| **Material Symbols Outlined** | Google's icon library — all icons in the app |
| **Service Worker** | Offline caching, PWA install capability |

### Development Tools

| Tool | Why |
|------|-----|
| **nodemon** | ^3.0.2 — Auto-restarts server when files change during development |
| **npm** | Package manager — installs all dependencies |

### Deployment

| Tool | Why |
|------|-----|
| **Vercel** | Serverless deployment platform — hosts the app in production |
| **vercel.json** | Configuration for routes, headers, caching, regions |

---

## Complete Folder Structure

```
path2prevention/
│
├── api/                          # Server entry point (Vercel serverless function)
│   └── index.js                  # Express app setup, middleware, route mounting
│
├── src/                          # All backend source code
│   ├── config/
│   │   └── db.js                 # MongoDB connection (cached for serverless)
│   │
│   ├── data/
│   │   └── seedData.js           # All seed data (tips, articles, recipes, glossary, rules, etc.)
│   │
│   ├── middleware/
│   │   └── index.js              # Auth middleware, validation, rate limiters
│   │
│   ├── models/
│   │   └── index.js              # ALL Mongoose schemas and models (14 core models)
│   │
│   ├── routes/                   # API route handlers
│   │   ├── auth.js               # Register, Login, Me, Password change
│   │   ├── profile.js            # Get/Update profile, Consent, Estimate risk
│   │   ├── settings.js           # Get/Update settings, Export stats
│   │   ├── logs.js               # Daily log CRUD, Weekly measures
│   │   ├── dashboard.js          # Dashboard data aggregation (READ-ONLY)
│   │   ├── insights.js           # Analytics, Correlations, What-If Simulator
│   │   ├── recommendations.js    # Get/Snooze/Resolve recommendations
│   │   ├── engagement.js         # 30-day program endpoints
│   │   ├── export.js             # CSV and PDF export
│   │   ├── content.js            # Get Activity Guides and Evidence Sources
│   │   └── account.js            # Account deletion
│   │
│   ├── services/
│   │   └── compute/
│   │       └── pipeline.js       # ★ CORE — Risk score computation engine (11 steps)
│   │
│   └── utils/
│       └── index.js              # Utility functions (date, math, BMI, Pearson-R)
│
├── public/                       # All frontend files (served statically)
│   ├── app.html                  # Main SPA shell (sidebar + tab content areas)
│   ├── login.html                # Login page
│   ├── register.html             # Registration page with Terms/Privacy modals
│   │
│   ├── css/
│   │   ├── main.css              # Core stylesheet (design system, components, dark mode)
│   │   └── mobile.css            # Mobile-specific responsive overrides
│   │
│   ├── js/
│   │   ├── api.js                # API client helper (fetch wrapper, toast, sidebar risk)
│   │   ├── state.js              # Global app state object
│   │   ├── router.js             # Tab switching logic + app initialization
│   │   ├── onboarding.js         # 4-step onboarding wizard
│   │   ├── dashboard.js          # Dashboard tab UI builder + charts
│   │   ├── log.js                # Daily log form + save logic
│   │   ├── insights.js           # Insights tab (charts, correlations, simulator, recs)
│   │   ├── settings.js           # Settings tab (profile edit, export, security)
│   │   └── popups.js             # Modal/drawer helpers (risk breakdown, evidence panel)
│   │
│   ├── images/
│   │   ├── icon-192.png          # PWA icon (192×192)
│   │   ├── icon-512.png          # PWA icon (512×512)
│   │   └── logo!.jpeg            # App logo
│   │
│   ├── manifest.json             # PWA manifest (name, icons, theme color)
│   └── sw.js                     # Service worker (offline caching)
│
├── scripts/                      # Admin/dev scripts
│   ├── seed.js                   # Seeds database with core content data (Tips, Evidence, Guides)
│   ├── clearUsers.js             # Deletes all user data (keeps seed data)
│   └── seedTestData.js           # Creates test user with sample logs
│
├── .env                          # Environment variables (SECRET — never committed)
├── .env.example                  # Template showing required env vars
├── .gitignore                    # Files excluded from git
├── package.json                  # Dependencies, scripts, metadata
├── package-lock.json             # Locked dependency versions
├── vercel.json                   # Vercel deployment configuration
└── README.md                     # Project readme
```

---

## How the App Works (High-Level Flow)

```
User opens browser → /login (or /register)
       ↓
  Enters email + password (or uses forgot password via DOB)
       ↓
  Server validates → creates/validates JWT token
       ↓
  Redirected to /app (main SPA)
       ↓
  If first time → Onboarding Wizard (4 steps)
       ↓
  Profile saved → Pipeline runs → Initial risk score
       ↓
  Dashboard loads (cached data from DB)
       ↓
  User logs daily data → POST /api/logs/daily
       ↓
  Pipeline runs (11-step process):
    1. Normalize inputs (load profile, logs, measures)
    2. Compute metrics (7-day averages of all signals)
    3. Compute family history weight (+15 if first-degree T2D)
    4. Compute risk index (12+ factors → 0-100 score)
    5. Map to meter level (Low/Medium/High/Very High)
    6. Build recommendations (using static seedData rules + evidence)
    7. Compute correlations (Pearson-R between signals)
    8. Compute trajectory (improving/worsening/stable)
    9. Evaluate engagement (streak tracking)
   10. Persist all results to MongoDB
   11. Return results to frontend
       ↓
  Dashboard, Insights, Settings tabs update with new data
```

---

## Environment Variables Explained

| Variable | What It Does | Example |
|----------|-------------|---------|
| `MONGODB_URI` | Connection string to MongoDB Atlas database | `mongodb+srv://user:pass@cluster.mongodb.net/path2prevention` |
| `JWT_SECRET` | Secret key to sign JWT tokens — MUST be long and random | 128-char hex string |
| `JWT_EXPIRES_IN` | How long a login session lasts | `7d` (7 days) |
| `NODE_ENV` | Environment mode — affects error messages and logging | `production` or `development` |
| `ALLOWED_ORIGIN` | Which domain can call the API (CORS) | `https://your-app.vercel.app` |
| `VAPID_PUBLIC_KEY` | Public key for push notifications | Generated via web-push |
| `VAPID_PRIVATE_KEY` | Private key for push notifications | Generated via web-push |
| `VAPID_EMAIL` | Contact email for push service | `mailto:admin@domain.com` |
| `RISK_THRESHOLD_MEDIUM` | Score threshold for "Medium" risk level | `25` |
| `RISK_THRESHOLD_HIGH` | Score threshold for "High" risk level | `50` |
| `RISK_THRESHOLD_VERY_HIGH` | Score threshold for "Very High" risk level | `75` |

---

## NPM Scripts

| Command | What It Does |
|---------|-------------|
| `npm start` | Runs server in production mode (`node api/index.js`) |
| `npm run dev` | Runs server with auto-restart on changes (`nodemon`) |
| `npm run clear` | Deletes all user data from database (keeps seed data) |
