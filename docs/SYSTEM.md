# Path2Prevention — Complete System Documentation

> **Lifestyle Recommendation System for Diabetes Prevention**  
> A full-stack web application that collects daily health data, computes personalised T2D risk scores, and generates evidence-based behaviour-change recommendations.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database — All 26 Collections](#4-database--all-26-collections)
5. [Authentication & Security](#5-authentication--security)
6. [The Core Computation Pipeline](#6-the-core-computation-pipeline)
7. [Risk Score — How It Is Calculated](#7-risk-score--how-it-is-calculated)
8. [Rules Engine — How Recommendations Are Generated](#8-rules-engine--how-recommendations-are-generated)
9. [Correlation Engine](#9-correlation-engine)
10. [Trajectory Engine](#10-trajectory-engine)
11. [Engagement Engine — Streaks & Badges](#11-engagement-engine--streaks--badges)
12. [API Routes Reference](#12-api-routes-reference)
13. [Frontend Tabs & Features](#13-frontend-tabs--features)
14. [Data Flow Diagrams](#14-data-flow-diagrams)
15. [Content & Seeded Data](#15-content--seeded-data)
16. [Export System](#16-export-system)
17. [Goals System](#17-goals-system)
18. [Activity Intensity Conversion](#18-activity-intensity-conversion)
19. [Scalability & Future Expansion](#19-scalability--future-expansion)
20. [Key Constants & Thresholds](#20-key-constants--thresholds)

---

## 1. System Overview

**Path2Prevention** is a web-based, evidence-rooted health companion designed to help users understand and reduce their risk of developing Type 2 Diabetes (T2D). It is inspired by the **Diabetes Prevention Programme (DPP)** — the gold-standard clinical intervention.

### Core Thesis
> "Small, sustainable lifestyle changes — tracked consistently — measurably reduce T2D risk. We make that visible."

### What the System Does
| Capability | Description |
|---|---|
| **Daily Health Logging** | Captures 10+ health signals per day |
| **Risk Scoring** | Computes a 0–100 T2D risk index on every log save |
| **Evidence-based Recommendations** | Rules engine produces up to 5 personalised interventions |
| **Trend Analytics** | Weekly aggregates and 90-day heatmaps |
| **Correlation Analysis** | Pearson-r analysis between 9 pairs of health signals |
| **Risk Trajectory** | Projects when risk level might change (improving/stable/worsening) |
| **What-If Simulator** | User changes sliders → sees projected score change |
| **Educational Content** | Articles, recipes, glossary, activity guides |
| **Gamification** | Streak tracking, 12 badge types, 30-Day Challenge program |
| **Data Export** | CSV (90-day logs) and HTML health report |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                                 │
│  app.html + css/main.css + js/{api, dashboard, log, insights,        │
│              learn, settings, popups}.js                              │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ HTTPS / JSON (JWT in Authorization header)
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Node.js / Express Server                           │
│  api/index.js                                                        │
│  ├── /api/auth          → src/routes/auth.js                         │
│  ├── /api/profile       → src/routes/profile.js                      │
│  ├── /api/settings      → src/routes/settings.js                     │
│  ├── /api/logs          → src/routes/logs.js          [PIPELINE]     │
│  ├── /api/dashboard     → src/routes/dashboard.js     [PIPELINE]     │
│  ├── /api/insights      → src/routes/insights.js                     │
│  ├── /api/recommendations→ src/routes/recommendations.js             │
│  ├── /api/engagement    → src/routes/engagement.js                   │
│  ├── /api/export        → src/routes/export.js                       │
│  └── /api/*             → src/routes/content.js + account.js        │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ Mongoose ODM
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                                  │
│  26 collections (see §4)                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions
- **SPA (Single-Page Application):** `app.html` loads once; tabs are rendered via JavaScript DOM injection — no page reloads.
- **Pipeline on every save:** Each `POST /api/logs/daily` triggers the full 9-step computation pipeline and returns the new risk score and engagement state.
- **Stateless JWT auth:** No sessions, no cookies. Token stored in `localStorage`.
- **Rule versioning:** Recommendation rules are stored documents in MongoDB, not hardcoded. A `RuleVersion` document (version `2.0.0`) contains all `baseRules` and `familyHistoryModifiers`.
- **Serverless-ready:** `connectDB()` uses a cached connection for Lambda/Vercel compatibility.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **Web Framework** | Express 4 |
| **Database** | MongoDB Atlas (Mongoose 8 ODM) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs (cost factor 12) |
| **Input Validation** | Zod schemas on all mutation routes |
| **Rate Limiting** | express-rate-limit (auth: strict, API: generous) |
| **Security** | helmet, express-mongo-sanitize, CORS |
| **Dev Server** | nodemon |
| **Frontend** | Vanilla HTML5 + CSS3 + JavaScript (ES2022) |
| **Charts** | Chart.js (CDN) |
| **Icons** | Material Symbols Outlined (Google Fonts CDN) |
| **Statistical Math** | Custom `pearsonR()`, `avg()`, `stdDev()`, `computeBMI()` in `src/utils/` |
| **Seeding** | `scripts/seed.js` (static content) + `scripts/seedTestData.js` (user test data) |

---

## 4. Database — All 26 Collections

### User Data Collections (15)

#### `users`
| Field | Type | Notes |
|---|---|---|
| `email` | String | Unique, lowercase |
| `passwordHash` | String | bcrypt cost 12 |
| `createdAt` | Date | Auto-timestamp |

#### `profiles`
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: users |
| `firstName`, `lastName` | String | |
| `dob`, `ageYears` | Date/Number | |
| `sex` | Enum | male / female / prefer_not_to_say |
| `heightCm`, `baselineWeightKg` | Number | Used for BMI |
| `familyHistory.firstDegreeT2D` | Enum | yes/no/unknown — **core risk modifier** |
| `familyHistory.firstDegreeT2DRelatives` | Enum | parent/sibling/both/other |
| `familyHistory.firstDegreeT1D` | Enum | yes/no/unknown |
| `familyHistory.secondDegree` | Enum | yes/no/unknown |
| `optionalLabs.fastingGlucoseMmol` | Number | Optional clinical bloods |
| `optionalLabs.hba1cPct` | Number | Optional HbA1c |
| `preferences.dietType` | Enum | veg/eggetarian/non_veg |
| `preferences.scheduleType` | Enum | regular/rotating/night_shift |
| `lifestyleSnapshot` | Object | Baseline habits from onboarding |
| `onboardingComplete` | Boolean | Gate for dashboard access |
| `consentAccepted` | Boolean | GDPR/data use consent |

#### `daily_logs`
The **primary data collection**. One document per user per calendar day.
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | |
| `date` | String | `YYYY-MM-DD` |
| `steps` | Number | 0–50,000 |
| `sleepHours` | Number | 0–24 |
| `waterGlasses` | Number | 0–20 |
| `sedentaryHours` | Number | 0–24 |
| `moodScore` | Number | 1–5 |
| `stressScore` | Number | 1–5 |
| `dietSignals.sugaryDrinks` | Number | Per day |
| `dietSignals.fastFood` | Number | Per day |
| `dietSignals.dietScore` | Number | 1–10 (emoji scale) |
| `physicalActivities` | Array | [{type, intensity, minutes, moderateEqMin}] |
| `fastingGlucoseMmol` | Number | Optional — converted from mg/dL on input |

#### `weekly_measures`
| Field | Type | Notes |
|---|---|---|
| `weekStartDate` | String | Monday of week |
| `weightKg` | Number | 20–300 |
| `waistCm` | Number | Optional |

#### `risk_scores`
Every pipeline run creates a new document (append-only history).
| Field | Type | Notes |
|---|---|---|
| `internalScore` | Number | 0–100 |
| `meterLevel` | Enum | Low/Medium/High/Very High |
| `familyHistoryWeight` | Number | Points from FH alone |
| `breakdown` | Array | [{factor, contribution, note}] |
| `metricsSnapshot` | Object | Steps/activity/sleep/bmi at time of computation |
| `computedAt` | Date | |

#### `recommendations`
| Field | Type | Notes |
|---|---|---|
| `ruleId` | String | Matches rule in RuleVersion |
| `category` | String | Steps/Activity/Sleep/Diet/Hydration/Stress/Weight |
| `title` | String | Human-readable headline |
| `why` | String | Evidence-based rationale |
| `actions` | [String] | Step-by-step instructions |
| `familyHistoryContext` | String | Extra context if FH detected |
| `selectionScoreFinal` | Number | basePriority + FH boost |
| `status` | Enum | active/snoozed/resolved |
| `evidenceRefs` | [String] | Links to EvidenceSources |
| `snoozedUntil`, `resolvedAt`, `cooldownUntil` | Date | Lifecycle management |

#### `goals` (one per user)
| Field | Type | Default |
|---|---|---|
| `stepsGoalDaily` | Number | 6000 (7000 if FH+) |
| `activityGoalWeeklyMin` | Number | 150 |
| `sleepGoalHours` | Number | 7.5 |
| `waterGoalGlasses` | Number | 8 |
| `weightGoalPct` | Number | null (5% if FH+) |
| `familyHistoryAdjusted` | Boolean | true if FH boosted goals |

#### `streak_records`
| Field | Type | Notes |
|---|---|---|
| `currentStreak` | Number | Consecutive logging days |
| `personalBestStreak` | Number | All-time best |
| `lastLoggedDate` | String | For streak continuity checks |
| `protectionUsedThisWindow` | Boolean | One free missed day per week |
| `weekWindowStart` | String | Reset weekly |
| `missedDatesThisWindow` | [String] | Missed days in current week |

#### `badge_definitions` (seeded, 12 badges)
| Field | Notes |
|---|---|
| `badgeId` | Unique identifier, eg `BADGE_STREAK_7` |
| `trigger.type`, `.metric`, `.operator`, `.value` | What earns this badge |

#### `badge_earned`
One document per user per earned badge. `displayedAt: null` = pending celebration popup.

#### `weekly_reports`
| Field | Notes |
|---|---|
| `grade` | A–F |
| `overallScore` | 0–100 |
| `categoryScores` | Per-category breakdown with trend |
| `topWin`, `biggestOpportunity` | Human-readable highlights |
| `motivationalCopy` | Coach-style message |
| `streakAtTime`, `newBadgesThisWeek` | Context |

#### `correlation_snapshots`
| Field | Notes |
|---|---|
| `windowDays` | 28 |
| `pairs` | [{signalA, signalB, r, n, insight, actionSuggestion}] |
| `hasEnoughData` | true when n ≥ 14 |

#### `risk_trajectories`
| Field | Notes |
|---|---|
| `direction` | improving / stable / worsening |
| `message` | Human-readable projection |
| `projectedLevel` | Next risk level |
| `weeksAhead` | Estimated weeks to level change |
| `insufficientData` | true when <3 days temporal spread |

#### `user_programs`
| Field | Notes |
|---|---|
| `programId` | `P2P_30_DAY_CHALLENGE` |
| `status` | active / paused / completed |
| `currentWeek` | 1–4 |
| `completedWeeks` | [Number] |

### Content Collections (11) — Seeded, Read-Only
| Collection | Count | Purpose |
|---|---|---|
| `tips` | 30 | Daily rotating health tips |
| `articles` | 5+ | Long-form educational content |
| `recipes` | 5+ | Diabetes-friendly recipes with nutrition |
| `activity_guides` | 11 | Exercise guides with MET values |
| `glossary_terms` | 10+ | Medical term definitions |
| `food_items` | 20 | Nutrition lookup for diet search |
| `evidence_sources` | 10 | Peer-reviewed paper references |
| `badge_definitions` | 12 | Badge catalog (see §11) |
| `rule_versions` | 1 | Recommendation rules document |
| `push_subscriptions` | — | Web push subscriptions |
| `personal_records` | — | User PRs (steps, etc.) |

---

## 5. Authentication & Security

### Registration Flow
```
POST /api/auth/register
 Body: { email, password (min 8 chars), firstName }
 
 → Zod validates input
 → Check email uniqueness
 → bcrypt.hash(password, 12)
 → Create User document
 → Create empty Profile (firstName set)
 → Create default Settings document
 → Issue JWT (7d expiry)
 → Return { token, user: { userId, email, firstName, onboardingComplete: false } }
```

### Login Flow
```
POST /api/auth/login
 Body: { email, password }
 
 → Find user by email
 → bcrypt.compare(password, hash)
 → Load profile for firstName + onboardingComplete
 → Issue JWT
 → Return { token, user }
```

### JWT Details
- **Secret:** `process.env.JWT_SECRET`
- **Payload:** `{ userId, email }`
- **Expiry:** `process.env.JWT_EXPIRES_IN` (default `7d`)
- **Transmission:** `Authorization: Bearer <token>` header on every API call
- **Storage:** `localStorage` — `p2p_token` and `p2p_user`

### Security Layers
| Layer | Implementation |
|---|---|
| Password hashing | bcrypt cost factor 12 |
| Input sanitisation | express-mongo-sanitize (prevents $injection) |
| XSS protection | helmet middleware |
| Rate limiting | Auth routes: strict limiter; API routes: main limiter |
| CORS | Configurable `ALLOWED_ORIGIN` env var |
| Route protection | `authMiddleware` gates all `/api/*` except `/api/auth` |

---

## 6. The Core Computation Pipeline

The pipeline is the **heart of the system**. It runs completely every time:
1. A daily log is saved (`POST /api/logs/daily`)
2. The dashboard is loaded (`GET /api/dashboard`)

**Location:** `src/services/compute/pipeline.js`

### Pipeline Execution Order

```
run(userId)
 │
 ├── Step 1: normalizeInputs()
 │     Load: Profile, last-30-day DailyLogs, WeeklyMeasures (12 weeks), active Recommendations
 │
 ├── Step 2: computeMetrics()
 │     Compute all health metric aggregates for 7d / 14d / 28d windows
 │
 ├── Step 3: computeFamilyHistoryWeight()
 │     Determine family history risk points (0–20)
 │
 ├── Step 4: computeRiskIndex()
 │     Score 8 risk factors → raw sum → normalise to 0–100
 │
 ├── Step 5: mapToMeter()
 │     Map score to Low / Medium / High / Very High
 │
 ├── Step 6: buildRecommendations()
 │     Evaluate rules → deduplicate → top 5 → upsert to DB
 │
 ├── Step 7: computeCorrelations()
 │     Pearson-r on 9 signal pairs from last 28 logs → persist CorrelationSnapshot
 │
 ├── Step 8: computeTrajectory()
 │     Compare oldest vs newest RiskScore → determine slope → project
 │
 ├── Step 9: evaluateEngagement()
 │     Update streak → evaluate 12 badge conditions → detect pending celebration
 │
 └── Step 10: Persist
       Save new RiskScore (append-only)
       Update/create Goals (FH-adjusted)
       Return full result object
```

### Step 2: computeMetrics — All Computed Values

```javascript
{
  // Activity
  avgSteps7d:          avg daily steps, last 7 days
  avgSteps14d:         avg daily steps, last 14 days
  moderateEqMin7d:     TOTAL moderate-equivalent activity minutes, last 7 days
  activityDays7d:      days with any logged activity
  
  // Body
  bmi:                 computed from latest WeeklyMeasure or baseline weight
  currentWeightKg:     latest weight
  weightTrend28dPct:   % weight change over 28 days
  weightFromBaselinePct: % change from onboarding baseline weight
  noWeightLogDays:     days since last weight entry
  
  // Sleep
  avgSleepHours7d:     avg sleep (excluding 0-value days)
  sleepStdDev7d:       sleep consistency standard deviation
  
  // Diet
  sugaryDrinks7d:      total sugary drinks logged in 7 days
  fastFood7d:          total fast food meals in 7 days
  
  // Hydration
  avgWaterGlasses7d:   avg glasses per day
  
  // Wellbeing
  avgMoodScore7d:      avg mood (1–5)
  avgStressScore7d:    avg stress (1–5)
  avgSedentaryHours7d: avg sedentary hours
  
  // Logging behaviour
  daysLogged7d:        how many of last 7 days have entries
  daysLogged14d:       how many of last 14 days have entries
}
```

---

## 7. Risk Score — How It Is Calculated

### Step 3: Family History Weight (0–20 pts)

| Condition | Points |
|---|---|
| First-degree T2D — both parent and sibling | **20** |
| First-degree T2D — one relative | **15** |
| First-degree T1D (only) | **10** |
| Second-degree relative only | **7** |
| No family history / unknown | **0** |

Cap: Maximum family history contribution = **20 pts**.

### Step 4: Risk Index Factors

Total possible raw points = **118** before normalisation.

| Factor | Max Pts | Calculation |
|---|---|---|
| **Family History** | 20 | See §Step 3 above |
| **Physical Activity deficit** | 20 | `(1 - min(moderateEqMin7d, 150) / 150) × 20` — linear deficit vs 150 min/week DPP target |
| **BMI** | 20 | BMI ≥28 → 20 pts; ≥25 → 14 pts; ≥23 → 8 pts; <23 → 0 pts |
| **Steps deficit** | 15 | `(1 - min(avgSteps7d, 7000) / 7000) × 15` — linear deficit vs 7,000/day |
| **Sugary drinks** | 15 | ≥14/week → 15; ≥7 → 10; ≥4 → 5; <4 → 0 |
| **Sleep deprivation** | 10 | <5h avg → 10; <6h → 7; <7h → 4; ≥7h → 0 |
| **Fast food frequency** | 10 | ≥5/week → 10; ≥3 → 6; ≥2 → 3; <2 → 0 |
| **Sedentary hours** | 8 | >10h avg → 8; >8h → 5; >6h → 2; ≤6h → 0 |

### Normalisation Formula
```
internalScore = min( round( rawSum / 118 × 100 ), 100 )
```

### Step 5: Risk Level Thresholds
| Score Range | Level | Color |
|---|---|---|
| 0 – 24 | **Low** | Green |
| 25 – 49 | **Medium** | Amber |
| 50 – 74 | **High** | Orange |
| 75 – 100 | **Very High** | Red |

Thresholds are configurable via environment variables:
- `RISK_THRESHOLD_MEDIUM` (default: 25)
- `RISK_THRESHOLD_HIGH` (default: 50)
- `RISK_THRESHOLD_VERY_HIGH` (default: 75)

### Score Breakdown (shown in Risk Analysis popup)
Each contributing factor appears in the `breakdown` array with its exact point contribution and a note explaining the value, e.g. `"7,234 avg/day vs 7,000 target"`.

---

## 8. Rules Engine — How Recommendations Are Generated

### Rule Structure (stored in `rule_versions` collection)

```json
{
  "ruleId": "REC_STEPS_DEFICIT",
  "category": "Steps",
  "title": "Increase Your Daily Steps",
  "why": "Each 2,000-step increase reduces T2D risk by ~10%...",
  "actions": ["Park further away", "Take stairs", "10-min walk after meals"],
  "basePriority": 80,
  "evidenceRefs": ["WHO_2020", "DPP_2002"],
  "trigger": { "field": "avgSteps7d", "operator": "lt", "value": 7000 },
  "resolve": { "field": "avgSteps7d", "operator": "gte", "value": 7000 },
  "requires": null
}
```

### Rule Evaluation Logic

```
For each rule in RuleVersion.baseRules:
  1. CHECK "requires" — if the user's metric doesn't meet prerequisite, skip
  2. CHECK "trigger" — evaluate trigger condition(s) against live metrics
     • Single condition: { field, operator, value }
     • Multi-condition: { conditions: [...] } — all must be true (AND)
  3. CHECK "resolve" — if resolve condition is met, skip (already succeeded)
  4. APPLY Family History boost:
     • If user has FH (firstDegreeT2D = "yes"):
       - Categories in fhMods.affectedCategories get +boost to selectionScoreFinal
       - "both relatives" → bigger boost
       - DPP evidence references added
       - familyHistoryContext string set (shown in UI)
  5. ADD to candidates list
```

### Selection & Deduplication
```
candidates.sort(selectionScoreFinal DESC)
→ Category deduplication (only 1 recommendation per category)
→ Slice top 5
→ Upsert to recommendations collection (status: 'active')
→ Auto-resolve any previously active recs no longer in top 5
```

### Supported Operators
`gte`, `gt`, `lte`, `lt`, `eq`

### Available Categories
| Category | Triggered by metric |
|---|---|
| Steps | `avgSteps7d` |
| Activity | `moderateEqMin7d` |
| Sleep | `avgSleepHours7d` |
| Diet | `sugaryDrinks7d`, `fastFood7d` |
| Hydration | `avgWaterGlasses7d` |
| Stress | `avgStressScore7d` |
| Weight | `bmi`, `weightFromBaselinePct` |

### Recommendation Lifecycle
```
triggered → active → [user action] → snoozed (7 days) or resolved
                    → [metric improves] → auto-resolved by pipeline
                    → [metric worsens again] → re-triggered (new session)
```

---

## 9. Correlation Engine

**Location:** `pipeline.js → computeCorrelations()`  
**Trigger:** Every pipeline run (computed from last 28 daily logs)  
**Minimum data:** 14 paired observations per signal pair

### Signal Pairs Analysed (9 pairs)
| Signal A | Signal B | Question Asked |
|---|---|---|
| Sleep hours | Steps | Does better sleep → more steps? |
| Sleep hours | Activity (moderateEqMin) | Does sleep affect activity? |
| Stress score | Steps | Does lower stress → more movement? |
| Stress score | Activity | Does stress reduce activity? |
| Mood score | Steps | Does better mood → more activity? |
| Mood score | Activity | Mood-exercise relationship |
| Water intake | Mood | Hydration and wellbeing |
| Sedentary hours | Steps | Inverse relationship |
| Sedentary hours | Sleep | Sitting and sleep quality |

### Pearson-r Calculation
```javascript
pearsonR(xs, ys):
  // Standard Pearson correlation coefficient
  // Returns { r, n }
  // |r| ≥ 0.3 is the threshold for including a pair
```

### Output
- Top 3 strongest correlations (by |r|) saved to `CorrelationSnapshot`
- Each pair includes:
  - `r` value (e.g. −0.97)
  - `n` sample size  
  - `insight` — e.g. "When your sleep is better, your steps tend to be higher."
  - `actionSuggestion` — e.g. "Improving your sleep may also help your steps."

---

## 10. Trajectory Engine

**Location:** `pipeline.js → computeTrajectory()`

### Algorithm
```
1. Load ALL RiskScore documents for user, sorted oldest → newest
2. If <2 scores: return { insufficientData: true }
3. Compute daysApart = newestDate - oldestDate
4. If daysApart < 3 days:
    → Use stored RiskTrajectory if it has a useful direction
    → Else return insufficientData
5. slope = (currentScore - oldest.internalScore) / daysApart  (pts/day)
6. direction:
    slope < -0.3 → "improving"
    slope > +0.3 → "worsening"
    else           → "stable"
7. If improving and not already at Low:
    → Project days to next threshold using slope
    → weeksAhead = ceil(daysToNext / 7)
    → message = "...could improve from High to Medium in ~X weeks"
8. Persist to risk_trajectories (upsert)
```

### Threshold Levels for Projection
```
Low:       score 0–24
Medium:    score 25–49
High:      score 50–74
Very High: score 75–100
```

---

## 11. Engagement Engine — Streaks & Badges

### Streak Logic
```
On each pipeline run (triggered by log save):
  todayLogged = logs.some(l => l.date === today)
  
  If todayLogged AND not already counted today:
    daysDiff = today - lastLoggedDate
    
    diff === 1 → streak++ (consecutive)
    diff === 2 AND protection not used this week → streak++, mark protection used
    diff > 1   → streak = 1, reset protection
    
    if streak > personalBest → update personalBest
    
  Weekly window: resets protectionUsedThisWindow on new Monday
```

### Badge Catalog (12 Badges)

| Badge ID | Name | How to Earn |
|---|---|---|
| `BADGE_LOG_FIRST` | First Log | Log any day |
| `BADGE_STEPS_FIRST7K` | Step Starter | Any day with 7,000+ steps |
| `BADGE_STEPS_FIRST10K` | 10K Club | Any day with 10,000+ steps |
| `BADGE_ACTIVITY_FIRST150` | DPP Active | 150+ mod-eq minutes in 7 days |
| `BADGE_SLEEP_FIRST7H` | Sleep Star | Any night with 7+ hours |
| `BADGE_DIET_SSB_ZERO` | Sugar Free Week | 0 sugary drinks in 7 days, 5+ days logged |
| `BADGE_WATER_GOAL` | Hydration Hero | Avg 8+ glasses/day, 5+ days logged |
| `BADGE_STREAK_7` | Week Warrior | 7-day logging streak |
| `BADGE_STREAK_30` | Monthly Master | 30-day logging streak |
| `BADGE_DPP_COMBO` | DPP Champion | 150+ min/week AND ≤2 sugary drinks/week |
| `BADGE_ALL_SIGNALS` | Data Complete | Log ALL 8 signals in one day |
| `BADGE_MOOD_POSITIVE` | Mood Lifted | Avg mood ≥4/5, 5+ days logged |

### Celebration Popup
- Only **one badge** awarded per pipeline run (to avoid overwhelming)
- Newly earned badge has `displayedAt: null`
- Frontend checks `engagement.pendingCelebration` and shows the popup
- After display: `POST /api/engagement/badges/:badgeId/displayed` marks it shown

---

## 12. API Routes Reference

### Auth (`/api/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Sign in |
| GET | `/me` | Get current user |
| PATCH | `/password` | Change password |

### Logs (`/api/logs`)
| Method | Path | Description |
|---|---|---|
| POST | `/daily` | Save/update today's log → **triggers pipeline** |
| GET | `/daily/:date` | Fetch log for a specific date |
| GET | `/range?start=&end=` | Fetch logs for date range |
| POST | `/weekly` | Save weekly weight & waist measurement |
| GET | `/weekly` | Get last 24 weekly measures |

### Dashboard (`/api/dashboard`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | Full dashboard data → **triggers pipeline** |

Returns: `{ greeting, riskScore, metrics, goals, recommendations, engagement, trajectory, correlations, tip, chartData, familyHistoryPersonalised }`

### Insights (`/api/insights`)
| Method | Path | Description |
|---|---|---|
| GET | `/analytics?period=30` | Weekly aggregates + risk history + daily points + heatmap |
| GET | `/correlations` | Latest CorrelationSnapshot |
| POST | `/simulate` | What-If score simulation (rate limited) |

**Simulate body:**
```json
{
  "moderateEqMin7d": 210,
  "avgSteps7d": 8000,
  "avgSleepHours7d": 7.5,
  "sugaryDrinks7d": 2,
  "avgSedentaryHours7d": 5
}
```

### Recommendations (`/api/recommendations`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | Top 5 active recommendations |
| PATCH | `/:id/snooze` | Snooze for N days (default 7) |
| PATCH | `/:id/resolve` | Mark as resolved |

### Engagement (`/api/engagement`)
| Method | Path | Description |
|---|---|---|
| GET | `/streaks` | Streak data |
| GET | `/badges` | All badges with earned status |
| POST | `/badges/:id/displayed` | Mark badge celebration as shown |
| GET | `/program` | 30-Day Challenge program data |
| POST | `/program/enroll` | Enroll in 30-Day Challenge |

### Content (`/api`)
| Method | Path | Description |
|---|---|---|
| GET | `/articles` | All articles |
| GET | `/articles/:idOrSlug` | Article by ObjectId or slug |
| GET | `/recipes` | All recipes |
| GET | `/recipes/:recipeId` | Recipe detail |
| GET | `/glossary` | All glossary terms |
| GET | `/activity-guides` | All activity guides |
| GET | `/tips/random` | Random tip |
| GET | `/diet-search?q=` | Food item search |
| GET | `/content/evidence?ids=` | Evidence sources by IDs |

### Export (`/api/export`)
| Method | Path | Description |
|---|---|---|
| GET | `/csv` | 90-day health data as CSV download |
| GET | `/pdf` | Styled HTML health report (print to PDF) |

### Profile & Settings (`/api/profile`, `/api/settings`)
| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| GET | `/settings` | Get settings |
| PATCH | `/settings` | Update settings |
| DELETE | `/account` | Delete account |

---

## 13. Frontend Tabs & Features

The app is a Single-Page Application at `/app`. Navigation state is managed in `localStorage` as `p2p_lastTab`.

### Tab 1 — Dashboard (`dashboard.js`)

**Loaded on:** App open, tab switch, after log save

**API call:** `GET /api/dashboard` → runs the full pipeline

**Sections rendered:**

| Section | Data Source | Description |
|---|---|---|
| **Greeting** | `data.greeting` | `getGreeting(firstName)` — time-aware ("Good morning, Test") |
| **Risk Gauge** | `data.riskScore` | Animated arc showing score 0–100, level badge |
| **Goals Progress** | `data.goals + data.metrics` | Steps, activity, sleep, water — progress bars |
| **7-Day Week Dots** | `data.engagement.weekDots` | Mon–Sun dots showing logged / not-logged |
| **Logging Streak** | `data.engagement.streak` | Current streak + personal best |
| **Risk Trajectory** | `data.trajectory` | Direction arrow + message + projected level |
| **Today's Tip** | `data.tip` | Daily rotating health tip from `tips` collection |
| **Recommendations** | `data.recommendations` | Up to 5 cards with snooze/resolve actions |
| **7-Day Activity Chart** | `data.chartData` | Chart.js line chart: steps, sleep, activity |
| **Evidence popup** | On rec tap | Fetches evidence sources and shows popup |

**Real-time sidebar update:** After log save, `updateSidebarRisk()` updates the sidebar risk badge without a full page reload.

---

### Tab 2 — Log Today (`log.js`)

**API calls:**
- `GET /api/logs/daily/:today` — pre-fill today's data
- `GET /api/activity-guides` — populate activity type dropdown
- `POST /api/logs/daily` — save log and run pipeline
- `POST /api/logs/weekly` — save weight/waist if entered

**Input fields:**

| Card | Fields |
|---|---|
| **Movement** | Steps (counter ±500), Physical activities (type + intensity + minutes), Weight (kg), Waist (cm) |
| **Nutrition** | Water (8-drop visual toggle), Sugary drinks (counter ±1), Fast food meals (counter ±1), Diet quality (5-button emoji scale) |
| **Rest & Wellbeing** | Sleep hours (3–12h slider), Mood (5 emoji buttons), Stress (1–5 number buttons) |
| **Sitting & Labs** | Sedentary hours (0–16h slider), Fasting glucose (mg/dL — converted to mmol on save), HbA1c (%) |

**Same-as-yesterday button:** Pre-fills today's form with yesterday's logged values.

**Activity intensity → moderateEqMin conversion:**
```
vigorous → × 2
moderate → × 1
light    → × 0.5
```

---

### Tab 3 — Insights (`insights.js`)

**API calls:**
- `GET /api/insights/analytics?period=30` — weekly aggregates
- `GET /api/insights/correlations` — pattern analysis
- `GET /api/recommendations` — active recommendations
- `POST /api/insights/simulate` — What-If simulator

**Sections:**

| Section | Description |
|---|---|
| **Trend Chart** | Bar chart. Category tabs: All (steps), Activity, Sleep, Diet, Hydration, Stress, Mood. Period buttons: 7d / 14d / 30d / 90d |
| **Pattern Correlations** | Up to 4 correlation cards showing signalA ↔ signalB, r-value, insight, action suggestion. Locked until 14 days of data |
| **Recommendations Panel** | Active / Snoozed / Resolved tabs |
| **What-If Simulator** | 5 sliders: Activity (min/day), Steps/day, Sugary drinks/day, Sleep hours, Sitting hours → `POST /simulate` → shows Δ points and projected meter level |

**Analytics response fields used by chart:**
```
analytics.weeks[].weekNum
analytics.weeks[].avgSteps         → "all" tab
analytics.weeks[].totalActivityMin → "activity" tab
analytics.weeks[].avgSleepHours    → "sleep" tab
analytics.weeks[].avgDietScore     → "diet" tab
analytics.weeks[].avgWaterGlasses  → "hydration" tab
analytics.weeks[].avgStressScore   → "stress" tab
analytics.weeks[].avgMoodScore     → "mood" tab
```

---

### Tab 4 — Learn (`learn.js`)

**API calls:** `/articles`, `/recipes`, `/glossary`, `/activity-guides`, `/diet-search?q=`

**Sections:**

| Section | Content |
|---|---|
| **Articles** | Cards with title, summary, reading time, category. Click → full article |
| **Healthy Recipes** | Cards with name, description, nutrition summary (calories, protein, fiber, GI category), diabetes-friendly reasons |
| **Health Glossary** | Term definitions with related terms |
| **Activity Guides** | Exercise type, MET value, recommended duration, beginner tips, intensity guide, why it helps |
| **Food Search** | Live search against `food_items` collection (≥2 chars) → shows nutrient breakdown, GI category |

---

### Tab 5 — Settings (`settings.js`)

**API calls:** `/profile`, `/settings`, `/engagement/badges`, `/engagement/program`, `/export/csv`, `/export/pdf`, `/auth/password`, `/account`

**Sections:**

| Section | Description |
|---|---|
| **Profile** | Edit name, DOB, sex, height, weight, diet type, schedule type, family history |
| **Notifications** | Toggle notifications on/off, set reminder time |
| **Achievements** | Badge gallery — earned vs locked |
| **30-Day Challenge** | Shows Week X/4 progress bar if enrolled (`status === 'active'`); else "Start Challenge" button |
| **Export My Data** | Download CSV (90-day logs) or HTML health report |
| **Change Password** | Current + new password with confirmation |
| **Delete Account** | Requires typing "DELETE" to confirm |

---

## 14. Data Flow Diagrams

### Flow A — Daily Log Save
```
User fills form → clicks "Save today's log"
        │
        ▼
POST /api/logs/daily (payload: steps, sleep, water, activities, diet, mood, stress, sedentary, glucose)
        │
        ▼
Middleware: JWT verify → userId extracted
        │
        ▼
Zod validation (range checks on all numeric fields)
        │
        ▼
Compute moderateEqMin for each activity
(vigorous × 2, moderate × 1, light × 0.5)
        │
        ▼
DailyLog.findOneAndUpdate({userId, date}, data, {upsert:true})
        │
        ▼
pipeline.run(userId)  ← THE PIPELINE
        │
        ├── computeMetrics        → 18 metric aggregates
        ├── familyHistoryWeight   → 0–20 pts
        ├── computeRiskIndex      → 0–100 score
        ├── mapToMeter            → Low/Medium/High/Very High
        ├── buildRecommendations  → up to 5 active recs
        ├── computeCorrelations   → Pearson-r on 9 pairs
        ├── computeTrajectory     → direction + projection
        ├── evaluateEngagement    → streak update + badge check
        └── Persist: new RiskScore, update Goals
        │
        ▼
Response: { log, riskScore, engagement }
        │
        ▼
Frontend: updateSidebarRisk() + show badge popup (if earned)
          showToast("Today's log saved! Your risk score has been updated.")
```

### Flow B — Dashboard Load
```
User opens Dashboard tab
        │
        ▼
GET /api/dashboard
        │
        ▼
pipeline.run(userId)  (same pipeline — always fresh)
        │
        ▼
Also fetch: Goals, Recommendations, Tip (skip based on day), 7-day chart data
        │
        ▼
Render: Risk gauge, goals, streak, trajectory, tip, recs, chart
```

### Flow C — What-If Simulation
```
User moves slider
        │
        ▼
POST /api/insights/simulate
Body: { moderateEqMin7d, avgSteps7d, avgSleepHours7d, sugaryDrinks7d, avgSedentaryHours7d }
        │
        ▼
computeMetrics(realData) → realMetrics
Override selected fields → simMetrics
computeRiskIndex(simMetrics, fhWeight)
computeRiskIndex(realMetrics, fhWeight)
        │
        ▼
Response: {
  currentScore, currentLevel,
  simulatedScore, simulatedLevel,
  delta (simulatedScore - currentScore),
  currentBreakdown, simulatedBreakdown
}
        │
        ▼
Frontend: Show Δ pts + progress bar + projected level
```

---

## 15. Content & Seeded Data

### Static Seed (`scripts/seed.js`)
Run once to populate content collections.

| Content | Count | Detail |
|---|---|---|
| `EvidenceSource` | 10 | Peer-reviewed papers (WHO, DPP, Lancet etc.) |
| `BadgeDefinition` | 12 | Full badge catalog |
| `Tip` | 30 | Daily health tips |
| `GlossaryTerm` | 10 | BMI, T2D, DPP, Insulin Resistance etc. |
| `Article` | 5 | Long-form evidence-based articles |
| `Recipe` | 5 | Indian diabetes-friendly recipes |
| `ActivityGuide` | 11 | Walking, yoga, cycling, swimming, etc. |
| `FoodItem` | 20 | Common foods with GI and nutrients |
| `RuleVersion` | 1 | v2.0.0 recommendation rule set |

### Test Data Seed (`scripts/seedTestData.js`)
Run to create realistic 25-day data for a user. Usage:
```bash
# Seed for most recently registered user
node scripts/seedTestData.js

# Seed for specific user
node scripts/seedTestData.js --email jbhv@gmail.com
```

**What it creates:**
- 25 daily logs (improving arc: Very High risk → Low risk)
- 25 risk scores (74 pts down to 22 pts, with daily spread of `computedAt` dates)
- 5 active recommendations
- 4 weeks of weight measurements (86 kg → 81.9 kg)
- 3 weekly reports (Grade D → C → B)
- 1 streak record (18 current / 22 personal best)
- 6 earned badges (First Log, Steps, Activity, DPP Champion, Week Warrior, Mood)
- 3 locked badges
- `CorrelationSnapshot` with 3 pairs (n=24)
- `RiskTrajectory` (direction: improving, ~3 weeks to Low)
- `UserProgram` (30-Day Challenge, Week 4, all 3 prior weeks completed)
- Goals (FH-adjusted: 7,000 steps/day, 5% weight target)

---

## 16. Export System

### CSV Export (`GET /api/export/csv`)
- 90 days of daily logs
- Columns: Date, Steps, Sleep (hrs), Water (glasses), Sedentary (hrs), Mood, Stress, Diet Score, Sugary Drinks, Fast Food Days, Activity (min), Risk Score, Risk Level
- Risk score joined from `risk_scores` by date
- Includes metadata comment lines with user name and export date

### HTML Report (`GET /api/export/pdf`)
Returns a self-contained printable HTML file. Content:
- User name and date
- Current risk score and level badge
- 30-day summary stats (days logged, avg steps, avg sleep)
- Active recommendations list
- Print-to-PDF via browser (Ctrl+P)

---

## 17. Goals System

Goals are computed and stored on every pipeline run. They adjust based on family history.

| Goal | Without FH | With FH |
|---|---|---|
| Steps / day | 6,000 | 7,000 |
| Activity / week | 150 min | 150 min |
| Sleep / night | 7.5 h | 7.5 h |
| Water / day | 8 glasses | 8 glasses |
| Weight loss target | — | −5% from baseline |

The dashboard shows a progress ring/bar for each goal comparing `metrics.avg*7d` against the goal value.

---

## 18. Activity Intensity Conversion

When a user logs a physical activity, the backend converts raw minutes into **moderate-equivalent minutes (moderateEqMin)** using MET-based multipliers:

```
Light intensity   → moderateEqMin = minutes × 0.5
Moderate intensity → moderateEqMin = minutes × 1.0
Vigorous intensity → moderateEqMin = minutes × 2.0
```

The **DPP target is 150 moderate-equivalent minutes per week**. This is the gold standard from the Diabetes Prevention Programme clinical trial.

**Example calculations:**
- 60 min of walking (light) = 30 moderateEqMin
- 30 min of brisk walking (moderate) = 30 moderateEqMin
- 20 min of running (vigorous) = 40 moderateEqMin

---

## 19. Scalability & Future Expansion

### Current Scalable Design
- **Stateless API** — horizontal scaling ready (no session state)
- **Rule versioning** — new recommendation logic without code changes: update `RuleVersion` document
- **Threshold env vars** — risk levels tunable without deployment
- **Pipeline modularity** — each step is an isolated pure/async function
- **Separate collections** — content and user data cleanly separated
- **Mongoose model caching** — `if (mongoose.models[name]) return mongoose.models[name]` prevents duplicate model registration in serverless

### Potential Future Features
| Feature | Implementation Path |
|---|---|
| Push notifications | `push_subscriptions` collection already exists; add web-push worker |
| HbA1c / lab tracking | `profile.optionalLabs` already has fields; build Lab History tab |
| Weekly Report email | Add nodemailer; weekly_reports collection already seeded |
| Wearable sync | POST to `/api/logs/daily` from integration service |
| Multi-language | i18n layer in frontend; tip/rec content localisation |
| Doctor report mode | Export to PDF via puppeteer for clinical use |
| Food diary detail | `food_items` + `diet-search` API already active |
| Weight trend chart | `weekly_measures` already stored; add chart to insights |
| AI coach | Extend rules engine with LLM-generated `why` field |
| PWA offline | `public/sw.js` already present (service worker stub) |

---

## 20. Key Constants & Thresholds

| Constant | Value | Where Used |
|---|---|---|
| DPP activity target | 150 min/week | Activity risk factor, BADGE_ACTIVITY_FIRST150 |
| Steps target | 7,000/day | Steps risk factor, goals |
| Sleep minimum | 7h/night | Sleep risk factor |
| BMI overweight | 25 | BMI factor |
| BMI obese Asia | 28 | Max BMI factor |
| Sugary drink threshold (high) | ≥14/week | Diet risk factor |
| Risk Low max | 24 | mapToMeter() |
| Risk Medium max | 49 | mapToMeter() |
| Risk High max | 74 | mapToMeter() |
| Correlation minimum |r| | 0.3 | correlationEngine |
| Correlation minimum n | 14 samples | correlationEngine |
| Trajectory minimum spread | 3 days | trajectoryEngine |
| Trajectory direction threshold | ±0.3 pts/day | slope calculation |
| Streak protection | 1 miss/week | streak engine |
| Max recommendations | 5 | rules engine |
| Max family history weight | 20 pts | FH computation |
| Raw score denominator | 118 pts | normalisation formula |
| JWT expiry | 7 days | auth |
| bcrypt cost | 12 | password hashing |

---

*Generated: March 2026 | Path2Prevention v3.0.0*
