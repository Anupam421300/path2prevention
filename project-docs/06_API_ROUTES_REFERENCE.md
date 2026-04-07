# All API Routes — Complete Endpoint Reference

## Route Files Overview

| File | Base URL | Purpose | Auth Required? |
|------|---------|---------|----------------|
| `auth.js` | `/api/auth` | Registration, Login, Session, Password | ❌ register/login, ✅ me/password |
| `profile.js` | `/api/profile` | User profile CRUD, consent, risk estimate | ✅ |
| `settings.js` | `/api/settings` | App settings CRUD, export stats | ✅ |
| `logs.js` | `/api/logs` | Daily log + weekly measures CRUD | ✅ |
| `dashboard.js` | `/api/dashboard` | Dashboard data aggregation | ✅ |
| `insights.js` | `/api/insights` | Analytics, correlations, simulator | ✅ |
| `recommendations.js` | `/api/recommendations` | Manage recommendations | ✅ |
| `engagement.js` | `/api/engagement` | 30-day challenge program | ✅ |
| `export.js` | `/api/export` | CSV and PDF data export | ✅ |
| `content.js` | `/api` | Activity guides and evidence sources | ✅ |
| `account.js` | `/api` | Account deletion | ✅ |

---

## 1. Auth Routes — `src/routes/auth.js`

### POST `/api/auth/register`
**Purpose:** Create a new user account

**Request Body (validated with Zod):**
```json
{
  "email": "user@example.com",    // Must be valid email
  "password": "MyPass123",        // Min 8 characters
  "firstName": "Priya"            // Min 1 character
}
```

**What happens internally (lines 36-55):**
1. Check if email already exists → 409 if duplicate
2. Hash password with bcrypt (12 salt rounds) — NEVER stores plain text
3. Create `User` document in `users` collection
4. Create empty `Profile` document with `firstName`
5. Create empty `Settings` document
6. Generate JWT token (signed with `JWT_SECRET`)
7. Return token + user info

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "userId": "abc123", "email": "user@example.com", "firstName": "Priya", "onboardingComplete": false }
}
```

### POST `/api/auth/login`
**Purpose:** Authenticate existing user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "MyPass123"
}
```

**What happens (lines 58-79):**
1. Find user by email (case-insensitive)
2. Compare password hash with bcrypt
3. Load profile to get `firstName` and `onboardingComplete`
4. Generate JWT token
5. Return token + user info

**Security:** Same error message `"Invalid email or password"` for both wrong email AND wrong password — prevents email enumeration.

### GET `/api/auth/me`
**Purpose:** Verify session, get current user info
**Auth:** ✅ Required (JWT)

### PATCH `/api/auth/password`
**Purpose:** Change password
**Auth:** ✅ Required

**Request Body:**
```json
{ "currentPassword": "OldPass123", "newPassword": "NewPass456" }
```

### POST `/api/auth/verify-dob`
**Purpose:** Verify user identity via Date of Birth for password reset
**Auth:** ❌ Public

**Request Body:**
```json
{ "email": "user@example.com", "dob": "1990-01-01" }
```

### POST `/api/auth/forgot-password`
**Purpose:** Allow user to reset forgotten password after DOB verification
**Auth:** ❌ Public

**Request Body:**
```json
{ "email": "user@example.com", "newPassword": "NewPass456" }
```

---

## 2. Profile Routes — `src/routes/profile.js`

### GET `/api/profile`
Returns user's complete profile + current weight + email.

### PUT `/api/profile`
Updates profile fields. **Critical security:** Once `consentAccepted = true`, `familyHistory` fields are silently stripped from the request (lines 54-56). This prevents manipulation of family history data.

### POST `/api/profile/consent`
Marks onboarding as complete. Sets `consentAccepted = true` and `onboardingComplete = true`.

### POST `/api/profile/estimate-risk`
Runs the full pipeline and returns the risk score. Used during onboarding to give an initial estimate BEFORE any daily logs exist.

---

## 3. Logs Routes — `src/routes/logs.js`

### POST `/api/logs/daily` — The Most Important Endpoint

**This is where users submit their daily health data.**

**Request Body:**
```json
{
  "date": "2026-04-06",
  "steps": 6842,
  "sleepHours": 7.5,
  "waterGlasses": 6,
  "sedentaryHours": 8,
  "stressScore": 3,
  "dietSignals": { "sugaryDrinks": 1, "fastFood": 0 },
  "physicalActivities": [
    { "type": "walking", "intensity": "moderate", "minutes": 30 }
  ],
  "fastingGlucoseMmol": 5.2
}
```

**What happens (lines 37-84):**
1. Validate with Zod schema
2. Calculate moderate-equivalent minutes for activities
3. Block future dates
4. Check if date is already locked → 409 if yes
5. Save log AND lock it in one atomic operation
6. **Run the full pipeline** (`pipeline.run(userId)`)
7. Return log + new risk score + engagement data

**The lock mechanism (line 68):** Once a day's log is saved, `lockedAt` is set. No further modifications are allowed. This ensures data integrity.

### GET `/api/logs/daily/:date`
Returns log for a specific date. Returns `{ empty: true }` if none.

### POST `/api/logs/weekly`
Save weight and waist measurement for a week.

---

## 4. Dashboard Route — `src/routes/dashboard.js`

### GET `/api/dashboard` — The Read-Only Dashboard

**This is the largest single endpoint.** It returns ALL data needed for the dashboard tab in one request.

**What it loads (in parallel with `Promise.all`):**
- Goals, latest risk score, trajectory, correlations
- Active recommendations (top 15)
- Streak record, user program (30-day challenge)
- Last 7 daily logs for charts
- Last 8 weekly weight measures
- Today's log (to check if already locked)
- First-ever risk score (for "started at" delta)
- Recently resolved recommendations
- Today's tips (deterministic rotation based on day-of-year)

**The `buildWeekDots` function (lines 41-60):**
Builds Mon-Sun dots showing log quality. Each dot shows:
- `hasLog`: Was data logged that day?
- `signalCount`: How many of 8 signals were filled in? (quality indicator)

**Auto-advance 30-day program (lines 142-168):**
Calculates which week the user should be on based on elapsed days since enrollment. Updates the database in a fire-and-forget manner.

**This endpoint does NOT run the pipeline — it only READS cached data from the last pipeline run.**

---

## 5. Insights Routes — `src/routes/insights.js`

### GET `/api/insights/analytics?period=30`
Returns weekly aggregates (steps avg, sleep avg, activity total, etc.), risk score history, heatmap data (90 days), and daily data points for charts.

### GET `/api/insights/correlations`
Returns cached Pearson-R correlation data. If insufficient data, returns `daysNeeded` count.

### POST `/api/insights/simulate`
**The What-If Simulator.** Takes hypothetical metric values and returns:
```json
{
  "currentScore": 42,
  "simulatedScore": 28,
  "delta": -14,
  "currentLevel": "Medium",
  "simulatedLevel": "Medium",
  "currentBreakdown": [...],
  "simulatedBreakdown": [...]
}
```

It reuses `computeMetrics`, `computeRiskIndex`, and `mapToMeter` from the pipeline WITHOUT saving anything.

---

## 6. Recommendations Routes — `src/routes/recommendations.js`

### GET `/api/recommendations`
Returns all recommendations (up to 15) sorted by priority.

### PATCH `/api/recommendations/:id/snooze`
Snoozes a recommendation for N days (default 7).

### PATCH `/api/recommendations/:id/resolve`
Marks a recommendation as "done/resolved" by the user.

---

## 7. Engagement Routes — `src/routes/engagement.js`

### GET `/api/engagement/program`
Returns current 30-day program status.

### POST `/api/engagement/program/enroll`
Enrolls user in the 30-day challenge. Creates a `UserProgram` document with `startedAt = now`.

---

## 8. Export Routes — `src/routes/export.js`

### GET `/api/export/csv`
Downloads ALL health data as a CSV file with columns: Date, Steps, Sleep, Water, Sedentary, Stress, Diet Score, Sugary Drinks, Fast Food, Activity, Fasting Glucose, Risk Score, Risk Level, Weight, Waist.

### GET `/api/export/pdf`
Returns a full HTML report styled for A4 printing. Auto-opens browser print dialog. Contains:
- Patient profile
- Risk assessment
- Clinical averages
- Risk score breakdown table
- Active prescriptive interventions
- Full daily telemetry log table

---

## 9. Content Routes — `src/routes/content.js`

| Endpoint | Returns |
|----------|---------|
| `GET /api/activity-guides` | Activity type guides |
| `GET /api/content/evidence?ids=id1,id2` | Evidence sources for recommendation citations |

---

## 10. Account Routes — `src/routes/account.js`

### DELETE `/api/account`
**PERMANENTLY deletes the user and ALL associated data** from all collections.

---

## Complete API Map

```
/api/auth
  ├── POST /register        (public)
  ├── POST /login           (public)
  ├── POST /verify-dob      (public)
  ├── POST /forgot-password (public)
  ├── GET  /me              (auth)
  └── PATCH /password        (auth)

/api/profile
  ├── GET  /                (auth)
  ├── PUT  /                (auth)
  ├── POST /consent         (auth)
  └── POST /estimate-risk   (auth)

/api/settings
  ├── GET  /                (auth)
  └── PUT  /                (auth)

/api/logs
  ├── POST /daily           (auth) ★ triggers pipeline
  ├── GET  /daily/:date     (auth)
  └── POST /weekly          (auth)

/api/dashboard
  └── GET  /                (auth) — read-only aggregation

/api/insights
  ├── GET  /analytics       (auth)
  ├── GET  /correlations    (auth)
  └── POST /simulate        (auth + rate limited)

/api/recommendations
  ├── GET  /                (auth)
  ├── PATCH /:id/snooze     (auth)
  └── PATCH /:id/resolve    (auth)

/api/engagement
  ├── GET  /program         (auth)
  └── POST /program/enroll  (auth)

/api/export
  ├── GET  /csv             (auth)
  └── GET  /pdf             (auth)

/api (content)
  ├── GET /activity-guides   (auth)
  └── GET /content/evidence  (auth)

/api (account)
  └── DELETE /account        (auth)
```
