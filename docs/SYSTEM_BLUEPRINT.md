# Path2Prevention — Complete System Blueprint

> **Version 3.0.0** | Last Updated: March 2026
> If you want to rebuild this entire system from scratch, this single document tells you **what** to build, **how** it works, **why** each piece exists, and **which file** does what.

---

## Table of Contents

1. [What Is Path2Prevention?](#1-what-is-path2prevention)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [Tech Stack & Tools](#3-tech-stack--tools)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Database Schema (All 22 Collections)](#5-database-schema-all-22-collections)
6. [Backend Architecture](#6-backend-architecture)
7. [The Risk Pipeline Engine (Core Algorithm)](#7-the-risk-pipeline-engine-core-algorithm)
8. [Rule Engine & Recommendation System](#8-rule-engine--recommendation-system)
9. [API Endpoints (Complete Map)](#9-api-endpoints-complete-map)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Authentication & Security](#11-authentication--security)
12. [Deployment & DevOps](#12-deployment--devops)
13. [Seed Data & Testing](#13-seed-data--testing)
14. [Data Flow Diagrams](#14-data-flow-diagrams)

---

## 1. What Is Path2Prevention?

Path2Prevention is a **full-stack web application** designed to help individuals **track lifestyle habits** and receive a personalised **diabetes risk score**. It uses a custom-built risk calculation engine that analyses daily health signals (steps, sleep, diet, stress, activity, lab values) and converts them into an actionable risk score out of 100.

### Core Objective
> **Prevent Type 2 Diabetes** through daily habit tracking, evidence-based recommendations, and continuous risk monitoring — empowering users to see how their daily decisions directly impact their long-term health.

### What Makes It Unique
- **Not a calorie counter** — it focuses on *diabetes-specific* risk factors (BMI, HbA1c, fasting glucose, family history, sedentary behaviour).
- **Rule-based recommendation engine** with evidence citations.
- **South Asian population thresholds** — uses IDF/WHO adjusted BMI cutoffs (23 instead of 25).
- **Pattern correlation engine** — uses Pearson R to find connections between user habits (e.g., "On days you sleep less, you eat more fast food").
- **Dynamic goals** — goals automatically adjust based on the user's BMI, lab values, and family history.

---

## 2. The Problem We Solve

### The Real-World Problem
Type 2 Diabetes (T2D) is one of the most preventable chronic diseases. Research (particularly the Diabetes Prevention Program / DPP study) shows that **lifestyle changes alone can reduce diabetes risk by 58%**. However, most people:
- Don't know their risk level
- Don't track the habits that matter
- Don't get personalised, actionable advice
- Don't see how their daily choices connect to long-term outcomes

### Our Solution
Path2Prevention bridges this gap by:
1. **Tracking** — Users log 7–8 daily health signals
2. **Computing** — A multi-step pipeline calculates a 0–100 risk score
3. **Recommending** — A rule engine generates personalised, evidence-backed tips
4. **Correlating** — A statistical engine reveals hidden patterns in user data
5. **Projecting** — A trajectory calculator shows where the user's risk is heading

---

## 3. Tech Stack & Tools

### Backend
| Tool | Purpose | Version |
|------|---------|---------|
| **Node.js** | Runtime environment | ≥ 18.0.0 |
| **Express.js** | HTTP server & routing framework | 4.18.2 |
| **MongoDB** | NoSQL document database | Cloud (Atlas) |
| **Mongoose** | ODM (Object Document Modelling) for MongoDB | 8.0.3 |
| **JWT (jsonwebtoken)** | Stateless authentication tokens | 9.0.2 |
| **bcryptjs** | Password hashing (12 salt rounds) | 2.4.3 |
| **Zod** | Request body validation schemas | 3.22.4 |
| **Helmet** | HTTP security headers | 7.1.0 |
| **express-rate-limit** | API rate limiting | 7.1.5 |
| **express-mongo-sanitize** | NoSQL injection prevention | 2.2.0 |
| **Puppeteer** | Headless Chrome for PDF generation | 24.40.0 |
| **Morgan** | HTTP request logging (dev mode) | 1.10.0 |
| **dotenv** | Environment variable management | 16.3.1 |

### Frontend
| Tool | Purpose |
|------|---------|
| **Vanilla HTML/CSS/JS** | No framework — pure client-side rendering |
| **Chart.js v4** | Line/bar charts for Insights tab |
| **Google Fonts (Inter)** | Typography |
| **Material Symbols Outlined** | Icon system |
| **Service Worker (sw.js)** | Offline caching / PWA support |

### DevOps
| Tool | Purpose |
|------|---------|
| **Vercel** | Serverless deployment platform |
| **Nodemon** | Auto-restart during development |
| **Git** | Version control |

---

## 4. Project Folder Structure

```
path2prevention/
├── api/
│   └── index.js                    ← Express server entry point (Vercel serverless function)
│
├── public/                         ← Static frontend assets
│   ├── app.html                    ← Main SPA shell (sidebar, tabs, modals)
│   ├── login.html                  ← Login page (standalone)
│   ├── register.html               ← Registration page (standalone)
│   ├── manifest.json               ← PWA manifest
│   ├── sw.js                       ← Service worker for offline caching
│   ├── css/
│   │   └── main.css                ← Global design system (all styles)
│   ├── images/                     ← Static image assets
│   └── js/
│       ├── state.js                ← Global state object + escapeHTML helper
│       ├── api.js                  ← HTTP client wrapper (apiFetch) + toast + sidebar updates
│       ├── router.js               ← Tab switching + app initialization (initApp)
│       ├── dashboard.js            ← Dashboard tab renderer (risk gauge, goals, charts)
│       ├── log.js                  ← Daily log form builder + submission logic
│       ├── insights.js             ← Insights tab (charts, correlations, what-if simulator)
│       ├── settings.js             ← Settings tab (profile editor, theme, data export)
│       ├── onboarding.js           ← Multi-step onboarding wizard (5 steps)
│       └── popups.js               ← Modal & drawer renderers (risk breakdown, evidence panel)
│
├── src/                            ← Backend application source
│   ├── config/
│   │   └── db.js                   ← MongoDB connection (cached for serverless)
│   │
│   ├── middleware/
│   │   └── index.js                ← Auth middleware, Zod validation, rate limiters
│   │
│   ├── models/
│   │   └── index.js                ← ALL 22 Mongoose schemas in one file
│   │
│   ├── routes/
│   │   ├── auth.js                 ← Register, Login, /me, Password change
│   │   ├── profile.js              ← GET/PUT user profile (Zod-protected)
│   │   ├── settings.js             ← GET/PUT user settings (Zod-protected)
│   │   ├── logs.js                 ← POST daily log + GET by date/range
│   │   ├── dashboard.js            ← GET /api/dashboard (read-only data aggregation)
│   │   ├── insights.js             ← GET /api/insights (charts, periods, categories)
│   │   ├── recommendations.js      ← GET + PATCH (snooze/resolve) recommendations
│   │   ├── engagement.js           ← GET/POST 30-day challenge program
│   │   ├── export.js               ← CSV + PDF report generation
│   │   ├── content.js              ← Articles, recipes, glossary, tips, food search
│   │   └── account.js              ← Feedback, push-subscribe, account deletion
│   │
│   ├── services/
│   │   └── compute/
│   │       └── pipeline.js         ← THE CORE ENGINE (721 lines, 11 steps)
│   │
│   ├── utils/
│   │   └── index.js                ← Helper functions (date math, stats, BMI, Pearson R)
│   │
│   └── data/
│       └── seedData.js             ← All seed content (tips, articles, recipes, rules, etc.)
│
├── scripts/
│   ├── seed.js                     ← Seeds the database with content from seedData.js
│   ├── seedTestData.js             ← Generates 40+ days of realistic test user data
│   ├── findUsers.js                ← Utility to find users in DB
│   ├── checkCorrelations.js        ← Debug script for correlation data
│   └── test.js                     ← End-to-end API test runner
│
├── .env                            ← Environment variables (MONGODB_URI, JWT_SECRET, etc.)
├── .env.example                    ← Template for environment variables
├── package.json                    ← Dependencies and scripts
├── vercel.json                     ← Vercel deployment configuration
└── .gitignore                      ← Git ignore rules
```

---

## 5. Database Schema (All 22 Collections)

All schemas are defined in **`src/models/index.js`**. Here is every collection:

### Core User Data
| # | Collection | Purpose | Key Fields |
|---|-----------|---------|------------|
| 1 | `users` | Login credentials | `email`, `passwordHash` |
| 2 | `profiles` | User identity & health baseline | `firstName`, `lastName`, `dob`, `sex`, `heightCm`, `baselineWeightKg`, `familyHistory`, `optionalLabs`, `lifestyleSnapshot`, `onboardingComplete`, `consentAccepted` |
| 3 | `settings` | App preferences | `theme` (light/dark/system), `reminderTime` |

### Daily Tracking
| # | Collection | Purpose | Key Fields |
|---|-----------|---------|------------|
| 4 | `daily_logs` | One entry per user per day | `date`, `steps`, `sleepHours`, `waterGlasses`, `sedentaryHours`, `stressScore`, `dietSignals` (sugaryDrinks, fastFood), `physicalActivities[]`, `fastingGlucoseMmol`, `lockedAt` |
| 5 | `weekly_measures` | Weekly body measurements | `weekStartDate`, `weightKg`, `waistCm` |

### Computed Results
| # | Collection | Purpose | Key Fields |
|---|-----------|---------|------------|
| 6 | `risk_scores` | Every pipeline run result | `internalScore`, `meterLevel`, `breakdown[]`, `metricsSnapshot`, `safetyOverride`, `isOnboardingEstimate` |
| 7 | `recommendations` | Generated personalised tips | `ruleId`, `title`, `why`, `actions[]`, `status` (active/snoozed/resolved), `evidenceRefs[]`, `isSafetyAlert` |
| 8 | `goals` | Dynamic user targets | `stepsGoalDaily`, `activityGoalWeeklyMin`, `sleepGoalHours`, `waterGoalGlasses`, `weightGoalPct` |
| 9 | `streak_records` | Logging streak tracker | `currentStreak`, `personalBestStreak`, `lastLoggedDate`, `protectionUsedThisWindow` |
| 10 | `correlation_snapshots` | Pearson R analysis results | `pairs[]` (signalA, signalB, r, insight, actionSuggestion), `hasEnoughData` |
| 11 | `risk_trajectories` | Trend projection | `currentScore`, `direction` (improving/stable/worsening), `projectedLevel`, `weeksAhead`, `message` |
| 12 | `user_programs` | 30-day challenge state | `programId`, `startedAt`, `status`, `currentWeek`, `completedWeeks[]` |

### Content (Seeded)
| # | Collection | Purpose |
|---|-----------|---------|
| 13 | `evidence_sources` | Research paper citations |
| 14 | `tips` | Daily health tips (rotated) |
| 15 | `glossary_terms` | Medical term definitions |
| 16 | `articles` | Educational health articles |
| 17 | `recipes` | Diabetes-friendly recipes |
| 18 | `activity_guides` | Exercise guides with intensity levels |
| 19 | `food_items` | Food database for diet search |
| 20 | `rule_versions` | Recommendation rule definitions |

### System
| # | Collection | Purpose |
|---|-----------|---------|
| 21 | `push_subscriptions` | Web push notification subscriptions |
| 22 | `feedback` | User feedback submissions |
| 23 | `personal_records` | Personal best records by category |

### Database Indexes (Performance)
```
daily_logs:           { userId: 1, date: 1 }  UNIQUE
                      { userId: 1, date: -1 }
weekly_measures:      { userId: 1, weekStartDate: 1 }  UNIQUE
                      { userId: 1, weekStartDate: -1 }
risk_scores:          { userId: 1, computedAt: -1 }
recommendations:      { userId: 1, status: 1, selectionScoreFinal: -1 }
                      { userId: 1, ruleId: 1 }
correlation_snapshots:{ userId: 1, computedAt: -1 }
risk_trajectories:    { userId: 1, computedAt: -1 }
rule_versions:        { active: 1 }
personal_records:     { userId: 1, category: 1 }
```

---

## 6. Backend Architecture

### Server Entry Point (`api/index.js`)
This is the Express application. It:
1. Loads environment variables (`.env`)
2. Applies security middleware (Helmet, CORS, mongo-sanitize, JSON limit)
3. Connects to MongoDB (cached connection for serverless)
4. Serves static files from `/public`
5. Mounts auth routes **without** JWT gate
6. Mounts all other API routes **behind** JWT authentication
7. Serves HTML pages for `/login`, `/register`, `/app`
8. Has a global error handler (sanitised in production)

### Middleware Stack (`src/middleware/index.js`)
| Middleware | Purpose |
|-----------|---------|
| `authMiddleware` | Extracts JWT from `Authorization: Bearer <token>`, verifies it, sets `req.userId` |
| `validate(schema)` | Takes a Zod schema, parses `req.body`, returns 400 with field-level errors on failure |
| `authLimiter` | 1000 requests per 15 min on auth endpoints |
| `mainLimiter` | 2000 requests per 60 sec on all API endpoints |
| `simulateLimiter` | 60 requests per 60 sec for what-if simulator |
| `pdfLimiter` | 3 requests per hour for PDF generation |

### Utility Functions (`src/utils/index.js`)
| Function | Purpose |
|----------|---------|
| `getTodayString()` | Returns today as `YYYY-MM-DD` |
| `addDays(dateStr, n)` | Date arithmetic |
| `daysDiff(a, b)` | Days between two date strings |
| `getWeekStart(dateStr)` | Returns Monday of that week |
| `avg(arr)` | Arithmetic mean |
| `sum(arr)` | Array sum |
| `stdDev(arr)` | Standard deviation |
| `computeBMI(kg, cm)` | BMI calculator |
| `computeAge(dob)` | Age from date of birth |
| `pearsonR(xs, ys)` | Pearson correlation coefficient |
| `scoreToGrade(score)` | Maps score to letter grade (A/B/C/D) |
| `getGreeting(name)` | Time-of-day greeting ("Good morning, Rohan!") |
| `getDayOfYear()` | Day number in current year (for tip rotation) |
| `escapeHTML(str)` | HTML entity encoding for XSS prevention |

---

## 7. The Risk Pipeline Engine (Core Algorithm)

**File:** `src/services/compute/pipeline.js` (721 lines)

This is the brain of the system. It runs every time a user saves a daily log. It has **11 sequential steps**:

### Step 1: `normalizeInputs(userId)`
- Fetches from DB: Profile, last 30 days of DailyLogs, WeeklyMeasures, active Recommendations
- Returns a `facts` object

### Step 2: `computeMetrics(facts)`
Calculates ~25 health metrics from raw logs:

| Metric | How Calculated |
|--------|---------------|
| `avgSteps7d` | Mean of last 7 days' steps (falls back to `lifestyleSnapshot.typicalSteps` for new users) |
| `moderateEqMin7d` | Sum of all physical activity minutes converted to moderate-equivalent |
| `activityDays7d` | Count of days with any physical activity |
| `avgSleepHours7d` | Mean of sleep (only counts days where sleep > 0) |
| `sleepStdDev7d` | Standard deviation of sleep (measures consistency) |
| `sugaryDrinks7d` | Total sugary drinks in 7 days |
| `fastFood7d` | Total fast food instances in 7 days |
| `avgWaterGlasses7d` | Mean water intake |
| `avgStressScore7d` | Mean stress (1–5 scale) |
| `avgSedentaryHours7d` | Mean sitting hours |
| `bmi` | Calculated from latest weight + profile height |
| `weightTrend28dPct` | % weight change over 28 days |
| `latestFastingGlucose` | Most recent glucose reading from logs |
| `latestHbA1c` | From profile's optional labs |
| `waistCm` | Latest waist circumference |
| `isOnboardingEstimate` | `true` if no logs exist yet |

### Step 3: `computeFamilyHistoryWeight(familyHistory)`
Returns a 0–20 point weight:
- First-degree T2D (both parent & sibling): **+20 pts**
- First-degree T2D (one): **+15 pts**
- First-degree T1D: **+10 pts**
- Second-degree only: **+7 pts**
- Capped at 20 maximum

### Step 4: `computeRiskIndex(metrics, fhWeight, profile)` — The Scoring Algorithm

This is the actual risk score calculation. It sums penalty points across 12 risk factors:

| Factor | Max Points | Thresholds |
|--------|-----------|------------|
| Family History | 20 | From step 3 |
| Physical Activity | 25 | Deficit vs 150 min/week target |
| BMI | 25 | ≥30: 25pts, ≥28: 20pts, ≥25: 15pts, ≥23: 10pts (South Asian thresholds) |
| Steps | 20 | Deficit vs 8,000/day target |
| Sugary Drinks | 20 | ≥10/wk: 20pts, ≥5: 15pts, ≥2: 8pts |
| Sleep | 15 | <5h: 15pts, <6.5h: 10pts, <7h: 5pts |
| Fast Food | 15 | ≥4/wk: 15pts, ≥2: 8pts, ≥1: 4pts |
| Sedentary Hours | 15 | >10h: 15pts, >8h: 10pts, >6h: 5pts |
| Waist Circumference | 15 | IDF South Asian thresholds (M: 90cm, F: 80cm) |
| Lab Values (HbA1c) | 50 | ≥6.5%: **+50pts** (diabetes range), ≥5.7%: +25pts |
| Lab Values (Glucose) | 50 | ≥7.0 mmol/L: **+50pts**, ≥5.6: +25pts |
| **Pattern Penalties** | 45 (3×15) | See below |

#### Pattern Detection (Co-Occurrence Rules)
The engine detects when multiple bad habits combine:
1. **Stress + Poor Sleep** (stress >3.5 AND sleep <6.5h): +15pts — "Cortisol overload causes insulin resistance"
2. **Extreme Sedentary + No Activity** (sitting >9h AND activity <30min): +15pts — "Complete metabolic slowdown"
3. **Toxic Diet** (sugary drinks >5 AND fast food >3): +15pts — "Severely impacts liver function"

#### Final Score Formula
```
rawSum = sum of all penalty points (max theoretical ~210)
internalScore = min(round((rawSum / 160) * 100), 100)
```
The score is scaled against 160 (not the theoretical max) so that a user doesn't need *every* risk factor to reach 100.

### Step 5: `mapToMeter(score)` — Risk Level Mapping
| Score Range | Level | Color |
|------------|-------|-------|
| 0–24 | Low | Green |
| 25–49 | Medium | Amber |
| 50–74 | High | Orange |
| 75–100 | Very High | Red |

Thresholds are configurable via environment variables (`RISK_THRESHOLD_MEDIUM`, etc.).

### Step 6: `buildRecommendations()` — Rule Engine
- Loads the active `RuleVersion` document from the database
- Iterates through each rule, checking `trigger` conditions against computed metrics
- Checks `resolve` conditions (if the user has already met the target, skip)
- Applies family history priority boosters
- Deduplicates by category (max 1 recommendation per category)
- Returns top 5 recommendations sorted by priority score
- Auto-resolves previously active recommendations that no longer trigger

### Step 6b: `checkSafetyOverride(metrics)`
If fasting glucose ≥ 7.0 mmol/L OR HbA1c ≥ 6.5%, the system **overrides all recommendations** with a single urgent safety alert: "Please consult a healthcare professional."

### Step 7: `computeCorrelations(userId, logs)` — Pearson R Analysis
- Takes last 28 days of logs
- Requires ≥14 data points per pair
- Tests 10 signal pairs (e.g., Sleep↔Steps, Stress↔Sugary Drinks)
- Filters results where |r| ≥ 0.3 (statistically meaningful)
- Saves top 3 correlations to `correlation_snapshots`
- Generates human-readable insight text

### Step 8: `computeTrajectory(userId, currentScore)`
- Compares current score to a score from ~7 days ago
- Calculates the slope (daily score change rate)
- If slope < -0.3/day → "improving"
- If slope > +0.3/day → "worsening"
- Projects forward up to 16 weeks to predict when the user might cross a risk level boundary
- Generates messages like: "At your current trend, your risk could improve from High to Medium in about 3 weeks."

### Step 9: `evaluateEngagement(userId, metrics, logs)` — Streak System
- Tracks consecutive days logged
- Allows **one missed day per week** without breaking the streak ("streak protection")
- Tracks personal best streak
- Builds week dot visualisation data (Mon–Sun)

### Step 10: Persist
- Saves the new `RiskScore` to the database with a full `metricsSnapshot`
- Dynamically generates/updates `Goals` based on BMI, family history, and lab values:
  - BMI ≥ 30 → steps goal = 8000, weight loss goal = 7%
  - Family history → activity goal = 200 min/week
  - Elevated labs → activity = 200 min, steps = 8000

### Step 11: Return
Returns the complete computed result to the calling route handler.

---

## 8. Rule Engine & Recommendation System

### How Rules Work
Rules are stored in the `rule_versions` MongoDB collection. Each rule has:
```json
{
  "ruleId": "R_STEPS_LOW",
  "category": "Steps",
  "title": "Increase your daily steps",
  "why": "Research shows that...",
  "actions": ["Take a 10-min walk after meals", "..."],
  "basePriority": 80,
  "trigger": {
    "field": "avgSteps7d",
    "operator": "lt",
    "value": 6000
  },
  "resolve": {
    "field": "avgSteps7d",
    "operator": "gte",
    "value": 6000
  },
  "evidenceRefs": ["DPP_2002", "WHO_PA_2020"]
}
```

### Rule Evaluation Flow
1. Load active rule version from DB
2. For each rule: check `trigger` conditions against metrics
3. If triggered AND not resolved → candidate
4. Apply family history priority boost if applicable
5. Sort by `selectionScoreFinal` (descending)
6. Deduplicate by category
7. Take top 5
8. Upsert into `recommendations` collection
9. Auto-resolve any previously active recommendations that no longer fire

### User Interactions with Recommendations
- **Snooze**: `PATCH /api/recommendations/:id/snooze` — hides for N days
- **Resolve**: `PATCH /api/recommendations/:id/resolve` — marks as done

---

## 9. API Endpoints (Complete Map)

### Authentication (`/api/auth`) — No JWT required
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account (email, password, firstName) |
| POST | `/api/auth/login` | Login → returns JWT token |
| GET | `/api/auth/me` | Get current user info (requires JWT) |
| PATCH | `/api/auth/password` | Change password (requires JWT) |

### Profile & Settings (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile (Zod-validated) |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update settings (Zod-validated) |

### Daily Logging (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/logs/daily` | Save today's log (runs pipeline) |
| GET | `/api/logs/daily/:date` | Get log for specific date |
| GET | `/api/logs/range?start=&end=` | Get logs in date range |

### Dashboard (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dashboard` | Returns complete dashboard payload |

The dashboard endpoint returns a massive JSON object containing:
- `greeting` — time-based personalised greeting
- `riskScore` — latest risk score + breakdown
- `metrics` — 7-day metrics snapshot
- `goals` — user's current goals
- `recommendations` — top 15 active recommendations
- `engagement` — streak data + week dots + 30-day program state
- `trajectory` — risk trend projection
- `correlations` — pattern analysis results
- `tips` — 3 rotating daily health tips
- `chartData` — 7-day chart data points
- `weights` — weight history for trend chart

### Insights (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/insights?period=7d&category=steps` | Returns chart data for insights tab |

### Recommendations (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/recommendations` | Get all recommendations |
| PATCH | `/api/recommendations/:id/snooze` | Snooze a recommendation |
| PATCH | `/api/recommendations/:id/resolve` | Mark as resolved |

### Engagement (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/engagement/program` | Get 30-day challenge status |
| POST | `/api/engagement/program/enroll` | Enroll in 30-day challenge |

### Export (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/export/csv` | Download 90-day data as CSV |
| GET | `/api/export/pdf` | Generate and download PDF health report |

### Content (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/articles` | List all educational articles |
| GET | `/api/articles/:idOrSlug` | Get single article |
| GET | `/api/recipes` | List diabetes-friendly recipes |
| GET | `/api/recipes/:recipeId` | Get single recipe |
| GET | `/api/glossary` | Get medical term glossary |
| GET | `/api/activity-guides` | Get exercise guides |
| GET | `/api/tips/random` | Get random health tip |
| GET | `/api/diet-search?q=` | Search food database |
| GET | `/api/content/evidence?ids=` | Get evidence source citations |

### Account (JWT required)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/feedback` | Submit user feedback |
| POST | `/api/push-subscribe` | Save push notification subscription |
| DELETE | `/api/account` | Permanently delete account + all data |

---

## 10. Frontend Architecture

The frontend is a **Single-Page Application (SPA)** built with vanilla JavaScript. There is no React, Vue, or Angular.

### Page Flow
```
login.html → (register.html) → app.html
                                  ├── Onboarding Wizard (if new user)
                                  └── Main App
                                       ├── Dashboard Tab
                                       ├── Log Tab
                                       ├── Insights Tab
                                       └── Settings Tab
```

### File-by-File Breakdown

#### `state.js` — Global State
- Defines `window.state` object shared across all modules
- Contains: `currentTab`, `user`, `dashboardData`, `todayLog`, `goals`, `recs`, `settings`, `lastFetched`
- Also exports `window.escapeHTML()` for XSS prevention

#### `api.js` — HTTP Client
- `apiFetch(path, options)` — wrapper around native `fetch()`
- Automatically adds `Bearer` token from `localStorage`
- Intercepts `401` responses → calls `logout()` (redirects to login page)
- Handles CSV/PDF/HTML content types differently (returns raw response)
- Exports `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()`
- Also contains: `showToast()` (notification popups), `updateSidebarRisk()` (risk badge updates)

#### `router.js` — Tab Router
- `switchTab(tab)` — hides all tabs, shows target tab, loads its data
- `initApp()` — checks for JWT, calls `/auth/me`, populates sidebar, starts dashboard or onboarding
- Binds sidebar links and bottom nav clicks

#### `dashboard.js` — Dashboard Tab (528 lines)
Renders:
- Welcome card (new users only)
- Risk score gauge (canvas-drawn arc)
- Goals progress cards with circular progress bars
- 7-day step/sleep/activity chart (Chart.js)
- Active recommendations with snooze/done buttons
- 30-day challenge progress card
- Trajectory projection message
- Streak badge
- Daily tips carousel
- Risk breakdown popup trigger

#### `log.js` — Daily Log Tab (22,688 bytes)
A complex form with:
- Steps counter (increment/decrement)
- Sleep hours slider
- Water glasses counter
- Sedentary hours slider
- Stress level selector (1–5 faces)
- Sugary drinks counter
- Fast food counter
- Physical activity picker (type, intensity, duration — supports multiple)
- Weekly weight input
- Waist circumference input
- Optional fasting glucose input
- Date selector (blocks future dates)
- Lock mechanism (prevents re-editing after save)
- After save: runs the pipeline server-side, shows risk score change animation

#### `insights.js` — Insights Tab (17,403 bytes)
Contains:
- Category buttons: Steps, Sleep, Activity, Water, Stress, Sugary Drinks, Fast Food
- Period buttons: 7d, 14d, 30d, 60d, 90d (7d/14d = daily, others = weekly aggregation)
- Chart.js line chart with proper null/zero handling
- Pattern Correlations section (Pearson R insights)
- What-If Simulator: sliders for steps, sleep, activity, sugary drinks, fast food → projects risk change

#### `onboarding.js` — Onboarding Wizard (20,558 bytes)
5-step wizard:
1. **Name & DOB** — First name, last name, date of birth, sex
2. **Body Measurements** — Height (cm), weight (kg)
3. **Family History** — First-degree T2D, T1D, second-degree
4. **Lifestyle Snapshot** — Typical steps, sleep hours, sugary drinks per day, activity level
5. **Optional Labs** — Fasting glucose, HbA1c (can skip)

After completion: saves profile, marks `onboardingComplete: true`, runs pipeline, redirects to dashboard.

#### `settings.js` — Settings Tab (14,039 bytes)
- Profile editor (name, DOB, sex, height, weight, family history, labs)
- Theme selector (light/dark/system)
- Reminder time picker
- Data export buttons (CSV, PDF)
- Account deletion with confirmation
- Feedback form

#### `popups.js` — Modals & Drawers (7,548 bytes)
- Risk Breakdown Modal — shows factor-by-factor contribution to risk score
- Evidence Panel Drawer — shows research paper citations
- Very High Risk Warning Modal — urgent alert for scores ≥ 75

---

## 11. Authentication & Security

### Authentication Flow
```
[Register] → bcrypt.hash(password, 12) → save User → create Profile → create Settings → issue JWT
[Login] → find User → bcrypt.compare() → issue JWT
[Any API call] → authMiddleware extracts JWT → verifies → sets req.userId
```

### JWT Configuration
- **Algorithm**: HS256 (HMAC-SHA256)
- **Secret**: `process.env.JWT_SECRET`
- **Expiry**: `process.env.JWT_EXPIRES_IN` (default: 7 days)
- **Payload**: `{ userId, email }`

### Security Layers
| Layer | Implementation |
|-------|---------------|
| **Password Hashing** | bcrypt with 12 salt rounds |
| **HTTPS** | Enforced by Vercel in production |
| **Helmet** | Sets security HTTP headers (X-Frame-Options, X-Content-Type-Options, etc.) |
| **CORS** | Configurable via `ALLOWED_ORIGIN` env var |
| **NoSQL Injection** | `express-mongo-sanitize` strips `$` operators from request body/query |
| **Rate Limiting** | 4 separate rate limiters (auth, main, simulator, PDF) |
| **Zod Validation** | Schema validation on Profile and Settings PUT endpoints |
| **Mass Assignment Prevention** | Zod schemas strip unknown fields from `req.body` |
| **XSS Prevention (Frontend)** | `escapeHTML()` wraps all user-controlled strings in templates |
| **XSS Prevention (Backend)** | `escapeHTML()` in PDF generator sanitises profile names |
| **Error Sanitisation** | Global error handler hides stack traces in production (500s return generic message) |
| **Log Locking** | Daily logs are locked after save (prevent tampering via `lockedAt` timestamp) |

---

## 12. Deployment & DevOps

### Environment Variables (`.env`)
```
MONGODB_URI=mongodb+srv://...        # MongoDB Atlas connection string
JWT_SECRET=your-secret-key           # JWT signing secret
JWT_EXPIRES_IN=7d                    # Token expiry
NODE_ENV=production                  # Environment mode
ALLOWED_ORIGIN=*                     # CORS origin
PORT=5000                           # Local dev port
RISK_THRESHOLD_MEDIUM=25            # Risk level thresholds
RISK_THRESHOLD_HIGH=50
RISK_THRESHOLD_VERY_HIGH=75
```

### Vercel Configuration (`vercel.json`)
- Routes all `/api/*` to the Express serverless function
- Rewrites `/login`, `/register`, `/app` to their HTML files
- Sets `Cache-Control: no-store` on API responses
- Sets `Cache-Control: no-cache` on service worker

### NPM Scripts
| Command | Purpose |
|---------|---------|
| `npm start` | Production start |
| `npm run dev` | Development with nodemon auto-restart |
| `npm run seed` | Seed database with content (tips, articles, rules, etc.) |
| `npm run seed:test` | Generate realistic test data for a user |

---

## 13. Seed Data & Testing

### Seed Script (`scripts/seed.js`)
Seeds the database with content from `src/data/seedData.js`:
- ~30 health tips
- ~10 educational articles
- ~10 diabetes-friendly recipes
- ~8 activity guides
- ~20 glossary terms
- ~15 evidence sources
- ~50 food items
- 1 active rule version (containing ~10–15 recommendation rules)

### Test Data Script (`scripts/seedTestData.js`)
Generates 40+ days of realistic, randomised daily logs for testing:
- Realistic step counts (4000–12000)
- Sleep hours (5–9)
- Water intake (3–10)
- Stress levels (1–5)
- Physical activities with varying types and intensities
- Diet signals (sugary drinks, fast food)
- Weekly weight measurements

---

## 14. Data Flow Diagrams

### User Logs a Day → Pipeline Runs
```
User fills log form (log.js)
    ↓
POST /api/logs/daily (routes/logs.js)
    ↓
Validates via Zod schema
    ↓
Saves to daily_logs collection (with lockedAt)
    ↓
Calls pipeline.run(userId)
    ↓
Step 1: normalizeInputs() — fetches Profile, Logs, Measures, ActiveRecs
Step 2: computeMetrics() — calculates 25+ health metrics
Step 3: computeFamilyHistoryWeight() — 0-20 genetic risk points
Step 4: computeRiskIndex() — sums 12 penalty factors → 0-100 score
Step 5: mapToMeter() — converts to Low/Medium/High/Very High
Step 6: buildRecommendations() — evaluates rules, upserts recs
Step 6b: checkSafetyOverride() — checks for diabetes-range labs
Step 7: computeCorrelations() — Pearson R on habit pairs
Step 8: computeTrajectory() — projects future risk direction
Step 9: evaluateEngagement() — updates streak
Step 10: persist() — saves RiskScore + updates Goals
Step 11: return result
    ↓
Response includes: { log, riskScore, engagement }
    ↓
Frontend shows risk score change animation + toast
```

### User Opens Dashboard
```
app.html loads → router.js → initApp()
    ↓
GET /api/auth/me → verify JWT → get user info
    ↓
If onboardingComplete = false → startOnboarding()
If onboardingComplete = true → loadDashboard()
    ↓
GET /api/dashboard (routes/dashboard.js)
    ↓
13 parallel DB queries via Promise.all:
  Goals, RiskScore, Trajectory, Correlations,
  Recommendations, Streak, UserProgram, Logs,
  Weights, TodayLog, FirstScore, RecentlyResolved, Tips
    ↓
Auto-advances 30-day challenge week if needed
    ↓
Returns massive JSON payload
    ↓
dashboard.js renders:
  Risk gauge, Goals, Chart, Recommendations,
  Challenge card, Trajectory, Streak, Tips
```

---

## Summary

Path2Prevention is a complete, production-ready health tracking platform. To rebuild it:

1. **Set up MongoDB Atlas** and create a connection string
2. **Create the Express server** with security middleware
3. **Define all 22 Mongoose schemas** in a single models file
4. **Build the 11-step risk pipeline** — this is the core intelligence
5. **Create the rule engine** with JSON-defined rules and condition evaluators
6. **Build 11 API route files** for auth, profile, settings, logs, dashboard, insights, recommendations, engagement, export, content, account
7. **Build the vanilla JS frontend** with tab-based SPA architecture
8. **Seed the database** with health tips, articles, recipes, and recommendation rules
9. **Deploy to Vercel** with the provided configuration

The system's value lies in its **pipeline engine** — the multi-factor risk scoring algorithm with pattern detection, family history weighting, lab value integration, and South Asian population thresholds is what makes it clinically meaningful rather than just another fitness tracker.
