# Database Models — Complete Schema Reference (`src/models/index.js`)

## What Is This File?

This single file defines **ALL 15 MongoDB collection schemas** (data structures) for the entire application. Every piece of data stored in the database has its structure defined here.

**Why one file?** Simplicity. Mongoose has a quirk on serverless: if you `require` a model that's already registered, it crashes. The helper function on line 5-8 prevents this.

---

## Model Registration Helper (Lines 5-8)

```javascript
const model = (name, schema, collection) => {
  if (mongoose.models[name]) return mongoose.models[name]; // If already registered, reuse
  return mongoose.model(name, schema, collection);          // Otherwise, register new
};
```

**Why needed?** On Vercel serverless, this file might be `require()`d multiple times in the same process. Without this check, Mongoose throws: `"Cannot overwrite model once compiled"`.

---

## All 15 Models — Detailed Breakdown

### 1. User (Lines 11-14)

**Collection name:** `users`
**Purpose:** Stores login credentials.

| Field | Type | Rules | Purpose |
|-------|------|-------|---------|
| `email` | String | required, unique, lowercase, trimmed | Login identifier — always stored lowercase |
| `passwordHash` | String | required | bcrypt hash of the password (NEVER plain text) |
| `createdAt` | Date | auto (timestamps) | When the account was created |
| `updatedAt` | Date | auto (timestamps) | When the account was last modified |

**Connected to:** Everything — `userId` in other collections references this.

### 2. Profile (Lines 17-51)

**Collection name:** `profiles`
**Purpose:** All personal + health + preference data for a user.

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `userId` | ObjectId | required, unique | Links to User — one profile per user |
| `firstName` | String | `''` | User's first name |
| `lastName` | String | `''` | User's last name |
| `dob` | Date | — | Date of birth — used for age calculation in risk score |
| `ageYears` | Number | — | Cached age in years |
| `sex` | Enum | `'prefer_not_to_say'` | `male`/`female`/`prefer_not_to_say` — affects waist thresholds |
| `heightCm` | Number | — | Height in centimeters — used for BMI calculation |
| `baselineWeightKg` | Number | — | Starting weight — used for weight change % calculation |
| `familyHistory.firstDegreeT2D` | Enum | `'unknown'` | `yes`/`no`/`unknown` — parent/sibling with Type 2 diabetes. **+15 risk points if yes** |
| `familyHistory.firstDegreeT2DRelatives` | Enum | `null` | `parent`/`sibling`/`both`/`other` |
| `familyHistory.firstDegreeT1D` | Enum | `'unknown'` | Type 1 diabetes in family |
| `familyHistory.secondDegree` | Enum | `'unknown'` | Grandparent/uncle/aunt with diabetes |
| `optionalLabs.fastingGlucoseMmol` | Number | — | Fasting blood glucose in mmol/L |
| `optionalLabs.hba1cPct` | Number | — | HbA1c percentage (3-month avg blood sugar) |
| `optionalLabs.loggedAt` | Date | — | When labs were entered |
| `preferences.scheduleType` | Enum | `'regular'` | Work schedule type |
| `preferences.preferredUnits` | Enum | `'metric'` | Measurement unit preference |
| `preferences.mainGoal` | String | `'risk_reduction'` | User's primary health goal |
| `lifestyleSnapshot.typicalSteps` | Number | — | Typical daily steps (from onboarding) |
| `lifestyleSnapshot.typicalSleepHours` | Number | — | Typical sleep hours (from onboarding) |
| `lifestyleSnapshot.typicalSugaryDrinks` | Number | — | Typical sugary drinks per day |
| `lifestyleSnapshot.activityLevel` | String | — | Activity level (sedentary/light/moderate/active) |
| `onboardingComplete` | Boolean | `false` | Has user finished the 4-step onboarding? |
| `consentAccepted` | Boolean | `false` | Has user accepted terms? **Locks family history** |
| `consentTimestamp` | Date | — | When consent was given |

**Key rule:** Once `consentAccepted = true`, family history fields CANNOT be changed (enforced in `profile.js` route).

### 3. Settings (Lines 54-58)

**Collection name:** `settings`

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `userId` | ObjectId | unique | Links to User |
| `theme` | Enum | `'system'` | `light`/`dark`/`system` — UI theme preference |
| `reminderTime` | String | `'20:00'` | Daily reminder notification time |

### 4. DailyLog (Lines 61-84)

**Collection name:** `daily_logs`
**Purpose:** One entry per user per day — the core health data input.

| Field | Type | Range | Purpose |
|-------|------|-------|---------|
| `userId` | ObjectId | required | Links to User |
| `date` | String | required, `YYYY-MM-DD` | The date this log is for |
| `lockedAt` | Date | — | Once saved, log is LOCKED (cannot edit). Prevents data manipulation |
| `steps` | Number | 0-50,000 | Daily step count |
| `sleepHours` | Number | 0-24 | Hours of sleep last night |
| `waterGlasses` | Number | 0-20 | Glasses of water consumed |
| `sedentaryHours` | Number | 0-24 | Hours spent sitting |
| `stressScore` | Number | 1-5 | Stress level (1=calm, 5=very stressed) |
| `dietSignals.sugaryDrinks` | Number | 0-20 | Sweet drinks consumed |
| `dietSignals.fastFood` | Number | 0-10 | Fast/fried food servings |
| `physicalActivities` | Array | — | List of activities with type, intensity, duration |
| `physicalActivities[].type` | String | required | e.g., "walking", "cycling", "yoga" |
| `physicalActivities[].intensity` | Enum | required | `light`/`moderate`/`vigorous` |
| `physicalActivities[].minutes` | Number | 1-300 | Duration in minutes |
| `physicalActivities[].moderateEqMin` | Number | — | Activity converted to moderate-equivalent minutes |
| `fastingGlucoseMmol` | Number | — | Optional daily glucose reading |

**Indexes:**
- `{ userId: 1, date: 1 }` — unique compound index (one log per user per day)
- `{ userId: 1, date: -1 }` — for sorting logs newest-first

**Moderate-equivalent minutes formula:**
- Light activity: `minutes × 0.5`
- Moderate activity: `minutes × 1.0`
- Vigorous activity: `minutes × 2.0`

### 5. WeeklyMeasure (Lines 87-94)

**Collection name:** `weekly_measures`

| Field | Type | Range | Purpose |
|-------|------|-------|---------|
| `userId` | ObjectId | required | |
| `weekStartDate` | String | required | Monday of the week: `"2026-03-31"` |
| `weightKg` | Number | 20-300 | Weight in kilograms |
| `waistCm` | Number | — | Waist circumference in cm |

### 6. RiskScore (Lines 97-132)

**Collection name:** `risk_scores`
**Purpose:** Stores EVERY risk score computation. Creates a historical record.

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | ObjectId | |
| `computedAt` | Date | When the pipeline ran |
| `internalScore` | Number | 0-100 risk score |
| `meterLevel` | Enum | `Low`/`Medium`/`High`/`Very High` |
| `meterColorKey` | String | `green`/`amber`/`orange`/`red` |
| `familyHistoryWeight` | Number | 0 or 15 |
| `breakdown` | Array | List of factors with `{factor, contribution, note}` |
| `metricsSnapshot` | Object | Snapshot of ALL computed metrics at time of scoring |
| `safetyOverride` | Boolean | `true` if lab values are in diabetes range |
| `isOnboardingEstimate` | Boolean | `true` if no daily logs exist (estimate from lifestyle snapshot) |

### 7. Recommendation (Lines 135-162)

**Collection name:** `recommendations`

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | ObjectId | |
| `ruleId` | String | Which rule triggered this (e.g., `"STEPS_LOW"`) |
| `ruleVersion` | String | `"2.0.0"` |
| `category` | String | `Steps`, `Activity`, `Sleep`, `Diet`, etc. |
| `title` | String | e.g., "Increase your daily steps" |
| `why` | String | Evidence-based explanation |
| `actions` | [String] | List of actionable steps |
| `familyHistoryContext` | String | Extra context if user has family history |
| `basePriority` | Number | Original priority score |
| `selectionScoreFinal` | Number | Priority after family history boost |
| `status` | Enum | `active`/`snoozed`/`resolved` |
| `evidenceRefs` | [String] | References to evidence sources |
| `isSafetyAlert` | Boolean | True for critical safety recommendations |

### 8-15. Other Models (Brief)

| # | Model | Collection | Purpose |
|---|-------|-----------|---------|
| 8 | Goal | `goals` | Dynamic health goals (steps, activity, sleep, water, weight %) |
| 9 | StreakRecord | `streak_records` | Consecutive logging days + personal best |
| 10 | CorrelationSnapshot | `correlation_snapshots` | Pearson-R correlation pairs between signals |
| 11 | RiskTrajectory | `risk_trajectories` | Trend direction (improving/stable/worsening) |
| 12 | UserProgram | `user_programs` | 30-day challenge enrollment + progress |
| 13 | EvidenceSource | `evidence_sources` | Research papers/studies database |
| 14 | Tip | `tips` | Daily health tips (seeded) |
| 15 | ActivityGuide | `activity_guides` | Exercise type guides |

---

## Database Relationships Diagram

```
User (users)
 │
 ├──→ Profile (profiles)          — 1:1 via userId
 ├──→ Settings (settings)         — 1:1 via userId
 ├──→ Goal (goals)                — 1:1 via userId
 ├──→ StreakRecord (streak_records) — 1:1 via userId
 ├──→ UserProgram (user_programs) — 1:1 via userId
 │
 ├──→ DailyLog (daily_logs)       — 1:Many via userId (one per day)
 ├──→ WeeklyMeasure (weekly_measures) — 1:Many via userId (one per week)
 ├──→ RiskScore (risk_scores)     — 1:Many via userId (one per pipeline run)
 ├──→ Recommendation (recommendations) — 1:Many via userId
 ├──→ CorrelationSnapshot (correlation_snapshots) — 1:1 via userId (latest only)
 └──→ RiskTrajectory (risk_trajectories) — 1:1 via userId (latest only)

Seeded data (no userId — shared across all users):
 ├── EvidenceSource (evidence_sources)
 ├── Tip (tips)
 └── ActivityGuide (activity_guides)
```
