# Complete File Index — Every File Explained

This document lists **EVERY file** in the project with its purpose, size, and which other files it connects to.

---

## Root Files

| File | Size | Purpose | Connects To |
|------|------|---------|-------------|
| `package.json` | 1KB | Defines project metadata, dependencies, and npm scripts | npm, all modules |
| `package-lock.json` | ~500KB | Locks exact dependency versions for reproducible installs | npm |
| `vercel.json` | 2KB | Vercel deployment: routing, builds, caching headers | Vercel platform |
| `.env` | ~500B | **SECRET** credentials (never committed) | Every file via `process.env` |
| `.env.example` | ~400B | Template for `.env` — shows required variables | None (reference only) |
| `.gitignore` | ~50B | Tells git to ignore `node_modules/`, `.env`, `.vercel/` | Git |
| `README.md` | ~1KB | Basic project description | None |

---

## `api/` Directory

| File | Lines | Purpose | Imports From | Exports To |
|------|-------|---------|-------------|-----------|
| `index.js` | 79 | **Main server entry point.** Creates Express app, applies security middleware (Helmet, CORS, rate limiter, mongo-sanitize), connects to MongoDB, mounts all 11 route files, serves frontend HTML, handles errors. Starts on port 5000 locally; exported as serverless function for Vercel. | `src/config/db.js`, `src/middleware/index.js`, all 11 route files in `src/routes/` | Vercel (as module.exports) |

---

## `src/config/` Directory

| File | Lines | Purpose | Imports From | Used By |
|------|-------|---------|-------------|---------|
| `db.js` | 28 | MongoDB connection with **serverless caching**. Uses `global.mongooseCache` to reuse connections across requests on the same Vercel instance. Configures 15-second server selection timeout. | `mongoose` | `api/index.js`, all 3 scripts in `scripts/` |

---

## `src/data/` Directory

| File | Lines | Purpose | Imports From | Used By |
|------|-------|---------|-------------|---------|
| `seedData.js` | ~2000+ | Contains ALL static reference data: 50+ tips, 30+ articles, 20+ recipes, 100+ food items, 10+ activity guides, 30+ glossary terms, 10+ evidence sources, and 20+ recommendation rules with triggers/resolve conditions. | None (pure data) | `scripts/seed.js`, `scripts/import_rules.js`, `src/services/compute/pipeline.js` (indirectly via DB) |

---

## `src/middleware/` Directory

| File | Lines | Purpose | Imports From | Used By |
|------|-------|---------|-------------|---------|
| `index.js` | 77 | Three middleware functions: **authMiddleware** (JWT verification — extracts userId from Bearer token), **validate** (Zod schema validation — returns 400 with detailed errors), and **4 rate limiters** (authLimiter: 1000/15min, mainLimiter: 2000/min, simulateLimiter: 60/min, pdfLimiter: 3/hr). | `jsonwebtoken`, `zod`, `express-rate-limit` | `api/index.js`, `src/routes/auth.js`, `src/routes/logs.js`, `src/routes/insights.js` |

---

## `src/models/` Directory

| File | Lines | Purpose | Imports From | Used By |
|------|-------|---------|-------------|---------|
| `index.js` | 370 | Defines ALL 15 Mongoose schemas and models: User, Profile, Settings, DailyLog, WeeklyMeasure, RiskScore, Recommendation, Goal, StreakRecord, CorrelationSnapshot, RiskTrajectory, UserProgram, EvidenceSource, Tip, ActivityGuide. Uses `model()` helper to prevent duplicate registration in serverless. | `mongoose` | ALL route files, `pipeline.js`, all scripts |

---

## `src/routes/` Directory (11 files)

| File | Lines | Key Endpoints | Purpose |
|------|-------|--------------|---------|
| `auth.js` | ~120 | `POST /register`, `POST /login`, `POST /verify-dob`, `POST /forgot-password`, `GET /me`, `PATCH /password` | User registration (bcrypt hash, create profile+settings, sign JWT), login (verify hash, sign JWT), secure password reset flow, session check, password change |
| `profile.js` | ~85 | `GET /`, `PUT /`, `POST /consent`, `POST /estimate-risk` | Profile CRUD with family history locking after consent, pipeline estimation for onboarding |
| `settings.js` | ~50 | `GET /`, `PUT /` | App settings CRUD |
| `logs.js` | ~140 | `POST /daily`, `GET /daily/:date`, `POST /weekly` | Daily log save (with lock mechanism + pipeline trigger), daily log retrieval, weekly weight/waist measures CRUD |
| `dashboard.js` | ~200 | `GET /` | READ-ONLY data aggregation. Loads 14+ data sources in `Promise.all`: goals, risk score, trajectory, correlations, recommendations, streak, program, logs, measures, tips. Builds week dots, auto-advances 30-day program |
| `insights.js` | ~180 | `GET /analytics`, `GET /correlations`, `POST /simulate` | Weekly aggregates for charts, Pearson-R correlation cache, What-If simulator (reuses pipeline functions without DB writes) |
| `recommendations.js` | ~55 | `GET /`, `PATCH /:id/snooze`, `PATCH /:id/resolve` | List recommendations sorted by priority, snooze for N days, mark as resolved |
| `engagement.js` | ~40 | `GET /program`, `POST /program/enroll` | 30-day challenge program status and enrollment |
| `export.js` | ~200 | `GET /csv`, `GET /pdf` | CSV download (all logs + scores as columnar data), PDF report (HTML clinical summary with print stylesheet) |
| `content.js` | ~40 | `GET /activity-guides`, `GET /content/evidence` | Serves seeded educational content (activity guides, evidence). |
| `account.js` | ~20 | `DELETE /account` | **PERMANENT account deletion** (removes from all collections via Promise.all) |

---

## `src/services/compute/` Directory

| File | Lines | Purpose | Imports From | Used By |
|------|-------|---------|-------------|---------|
| `pipeline.js` | 734 | **THE CORE ENGINE.** 11-step risk computation pipeline: normalizeInputs → computeMetrics (7d/14d averages) → computeFamilyHistoryWeight (+15 T2D) → computeRiskIndex (12+ factors → 0-100) → mapToMeter (thresholds) → buildRecommendations (rule engine) → checkSafetyOverride (lab values) → computeCorrelations (Pearson-R) → computeTrajectory (trend) → evaluateEngagement (streaks) → persist all → return. | `src/models/index.js`, `src/utils/index.js` | `src/routes/logs.js` (POST /daily), `src/routes/profile.js` (POST /estimate-risk), `src/routes/insights.js` (POST /simulate — partial reuse) |

---

## `src/utils/` Directory

| File | Lines | Purpose | Imports From | Used By |
|------|-------|---------|-------------|---------|
| `index.js` | ~150 | Pure utility functions: `getTodayString`, `addDays`, `daysDiff`, `getWeekStart` (date utils), `avg`, `sum`, `stdDev` (math), `computeBMI`, `computeAge` (health), `pearsonR` (statistics), `scoreToGrade`, `getGreeting`, `getDayOfYear`, `escapeHTML` (helpers) | None | `pipeline.js`, `dashboard.js` route, `insights.js` route, `export.js` route |

---

## `public/` Directory — Frontend

### HTML Pages

| File | Lines | Purpose |
|------|-------|---------|
| `app.html` | ~350 | Main SPA shell. Contains: sidebar (desktop), mobile bottom nav, 4 tab content containers (`#tab-dashboard`, `#tab-log`, `#tab-insights`, `#tab-settings`), onboarding overlay, drawer overlay. Loads: Chart.js CDN, Google Fonts (Inter), Material Symbols, all JS files |
| `login.html` | ~250 | Login page. Gradient hero left panel + login form right panel. Contains Forgot Password modal. Saves JWT to localStorage, redirects to /app |
| `register.html` | ~500 | Registration page. Same layout as login. Includes Terms of Service and Privacy Policy modals. Form validation. Auto-login after registration |

### JavaScript Files

| File | Lines | Purpose | API Calls |
|------|-------|---------|-----------|
| `js/state.js` | 21 | Global `window.state` object: currentTab, user, dashboardData, todayLog, goals, recs, settings, lastFetched | None |
| `js/api.js` | 95 | `apiFetch()` wrapper: JWT auth header injection, 401 auto-logout, JSON parsing, cache-buster. `api.get/post/put/patch/delete`. `showToast()`. `updateSidebarRisk()` | All endpoints (via wrapper) |
| `js/router.js` | 84 | `switchTab()`: hide/show tab content, update nav active states. `initApp()`: verify session, load user, start onboarding or dashboard. `preloadTabs()`: background-load other tabs. `forceTabRefresh()` | `GET /api/auth/me` |
| `js/onboarding.js` | 395 | 4-step wizard with slide transitions. Step 1: personal profile. Step 2: health baseline + family history. Step 3: lifestyle sliders. Step 4: roadmap timeline. Shows "Analysing" animation while pipeline runs | `PUT /api/profile`, `POST /api/profile/estimate-risk`, `POST /api/profile/consent` |
| `js/dashboard.js` | 526 | `loadDashboard()`: skeleton → API → `buildDashboardHTML()`. Bento grid layout. Canvas risk gauge. 4 Chart.js line charts. Goal progress bars. Streak dots. Trajectory. Focus areas. Tips. Deep analysis correlations | `GET /api/dashboard` |
| `js/log.js` | 466 | `loadLogForm()`: fetch today's log + activity guides. `buildLogHTML()`: movement card (steps, activities, weight), nutrition (water drops, counters), rest (sleep slider, stress buttons), sitting/labs. `saveLog()`: collect, POST, lock. `showLockedState()`. `showLogSummary()` | `GET /api/logs/daily/:date`, `POST /api/logs/daily`, `POST /api/logs/weekly`, `GET /api/activity-guides` |
| `js/insights.js` | 342 | `loadInsights()`: analytics + correlations + recs. Chart.js trend chart with category/period switching. Correlation display. What-If simulator with 6 debounced sliders. Recommendation tabs (active/snoozed/done) with snooze/resolve actions | `GET /api/insights/analytics`, `GET /api/insights/correlations`, `GET /api/recommendations`, `POST /api/insights/simulate`, `PATCH /api/recommendations/:id/snooze`, `PATCH /api/recommendations/:id/resolve` |
| `js/settings.js` | 281 | `loadSettings()`: profile + settings + program. Profile edit (name editable, DOB/sex/height/weight locked). Family history display (locked). 30-day challenge enroll/progress. CSV/PDF export. Password change. Account deletion (double confirm) | `GET /api/profile`, `GET /api/settings`, `GET /api/engagement/program`, `PUT /api/profile`, `PUT /api/settings`, `PATCH /api/auth/password`, `POST /api/engagement/program/enroll`, `GET /api/export/csv`, `GET /api/export/pdf`, `DELETE /api/account` |
| `js/popups.js` | ~180 | `showRiskBreakdown()`: modal with factor-by-factor score breakdown. `showEvidencePanel()`: sliding drawer with research citations. `showVeryHighRiskWarning()`: modal for scores ≥ 75. Generic modal/drawer open/close utilities | `GET /api/content/evidence` |

### CSS Files

| File | Lines | Purpose |
|------|-------|---------|
| `css/main.css` | ~1100 | Complete design system. CSS custom properties (colors, spacing, fonts). Base resets. Card, button, input, select, slider, toast, modal, sidebar, skeleton component styles. Dark mode via `prefers-color-scheme`. Animations (shimmer, spin, fadeIn). Layout grid. Scrollbar styling |
| `css/mobile.css` | ~300 | `@media (max-width: 768px)`: single-column layouts, mobile bottom nav, hidden sidebar, adjusted font sizes, full-width cards, mobile-specific log form layouts, touch-friendly tap targets |

### Other Frontend Files

| File | Lines | Purpose |
|------|-------|---------|
| `sw.js` | 45 | Service Worker. Network-First caching strategy. Caches: `/app`, all CSS, all JS. NEVER caches `/api/*`. On offline → serves from cache. Cache version: `p2p-v5` |
| `manifest.json` | 14 | PWA manifest. App name, icons (192px + 512px), start URL `/app`, standalone display, green theme color |
| `images/icon-192.png` | — | PWA app icon (192×192 pixels) |
| `images/icon-512.png` | — | PWA app icon (512×512 pixels) |
| `images/logo!.jpeg` | — | Application logo image |

---

## `scripts/` Directory

| File | Lines | Purpose | Command |
|------|-------|---------|---------|
| `seed.js` | 42 | Seeds MongoDB with all reference data (Tips, ActivityGuides, EvidenceSources). Uses upsert pattern — safe to run repeatedly | `node scripts/seed.js` |
| `clearUsers.js` | 39 | Deletes ALL user data from all 12 user-related collections (User, Profile, Settings, DailyLog, WeeklyMeasure, RiskScore, Recommendation, Goal, StreakRecord, CorrelationSnapshot, RiskTrajectory, UserProgram). Keeps seed data | `npm run clear` |
| `seedTestData.js` | ~100 | Creates a test user with realistic profile + 30+ days of pre-filled daily logs for development/demo purposes | `node scripts/seedTestData.js` |

---

## File Dependency Graph

```
                                    .env
                                     │
              ┌──────────────────────┤
              │                      │
         api/index.js ────────→ src/config/db.js ────→ MongoDB Atlas
              │
     ┌────────┼─────────┐
     │        │         │
src/middleware  src/routes/*  express.static → public/*
     │        │
     │   Each route file imports:
     │   ├── src/models/index.js
     │   ├── src/utils/index.js
     │   └── (logs.js also imports pipeline.js)
     │
     └── src/services/compute/pipeline.js
              │
              ├── src/models/index.js
              └── src/utils/index.js

scripts/*
  ├── src/config/db.js
  ├── src/models/index.js
  └── src/data/seedData.js

public/js/* (frontend)
  ├── api.js → fetch(/api/*) → api/index.js
  └── CDN: Chart.js, Google Fonts, Material Symbols
```
