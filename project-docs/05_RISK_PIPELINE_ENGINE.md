# The Risk Score Pipeline — Heart of the System (`src/services/compute/pipeline.js`)

## What Is This File?

This is the **most critical file** in the entire project. It is the **diabetes risk computation engine** — a multi-step pipeline that:

1. Loads all user data from the database
2. Computes 7-day/14-day/28-day averages of health signals
3. Calculates a 0-100 diabetes risk score from 12+ risk factors
4. Generates personalised health recommendations
5. Finds statistical correlations between lifestyle patterns
6. Computes risk trajectory (improving/worsening)
7. Tracks engagement (streaks, goals)
8. Saves everything back to the database

**This file has 734 lines and is the CORE intellectual property of the project.**

---

## Pipeline Architecture (11 Steps)

```
run(userId)
  │
  ├── Step 1:  normalizeInputs()     → Load profile, logs, measures from DB
  ├── Step 2:  computeMetrics()      → Calculate 7d/14d averages of all signals
  ├── Step 3:  computeFamilyHistoryWeight() → +15 if first-degree T2D
  ├── Step 4:  computeRiskIndex()    → Score 0-100 from 12+ factors
  ├── Step 5:  mapToMeter()          → Low/Medium/High/Very High
  ├── Step 6:  buildRecommendations() → Rule engine → top 5 recommendations
  │            checkSafetyOverride()  → Override if diabetes-range labs
  ├── Step 7:  computeCorrelations() → Pearson-R between signal pairs
  ├── Step 8:  computeTrajectory()   → Trend analysis vs 7 days ago
  ├── Step 9:  evaluateEngagement()  → Streak tracking
  ├── Step 10: Persist to DB         → Save RiskScore + Goals to MongoDB
  └── Step 11: Return results        → Send back to caller
```

---

## Step 1: normalizeInputs (Lines 6-15)

```javascript
async function normalizeInputs(userId) {
  const profile = await Profile.findOne({ userId });          // User's profile
  const today = getTodayString();                              // "2026-04-06"
  const thirtyDaysAgo = addDays(today, -30);                  // "2026-03-07"
  const logs = await DailyLog.find({                          // Last 30 days of daily logs
    userId, date: { $gte: thirtyDaysAgo, $lte: today }
  }).sort({ date: -1 });
  const measures = await WeeklyMeasure.find({ userId })       // Last 12 weekly weight measures
    .sort({ weekStartDate: -1 }).limit(12);
  const activeRecs = await Recommendation.find({              // Currently active recommendations
    userId, status: 'active'
  });
  return { profile, logs, measures, activeRecs, today };
}
```

**This loads ALL the raw data needed for the rest of the pipeline.**

---

## Step 2: computeMetrics (Lines 18-87)

This is the **data aggregation step**. It takes raw logs and computes averages.

### Key Metrics Computed:

| Metric | Calculation | Used For |
|--------|------------|----------|
| `avgSteps7d` | Average steps over last 7 logs | Steps risk factor |
| `moderateEqMin7d` | Total moderate-equivalent activity minutes (7d) | Activity risk factor |
| `activityDays7d` | Number of days with any activity logged | Activity frequency |
| `avgSleepHours7d` | Average sleep (only logs with sleep > 0) | Sleep risk factor |
| `sleepStdDev7d` | Standard deviation of sleep | Sleep consistency |
| `sugaryDrinks7d` | Total sugary drinks in 7 days | Diet risk factor |
| `fastFood7d` | Total fast food in 7 days | Diet risk factor |
| `avgWaterGlasses7d` | Average water intake | Hydration tracking |
| `avgStressScore7d` | Average stress (1-5) | Pattern correlations |
| `avgSedentaryHours7d` | Average sitting hours | Sedentary risk factor |
| `bmi` | Weight / (height in meters)² | BMI risk factor |
| `weightFromBaselinePct` | % weight change from starting weight | Weight goal tracking |
| `latestFastingGlucose` | Most recent glucose reading | Lab value risk factor |
| `latestHbA1c` | HbA1c from profile | Lab value risk factor |
| `waistCm` | Latest waist circumference | Waist risk factor |
| `isOnboardingEstimate` | `true` if no daily logs exist | New user detection |

### Lifestyle Snapshot Fallback (Lines 60-66):
```javascript
const snap = facts.profile?.lifestyleSnapshot;
const hasAnyLogs = logs.length > 0;

// If user hasn't logged any data yet, use their onboarding answers:
avgSteps7d: hasAnyLogs ? Math.round(avg(stepsArr7)) : (snap?.typicalSteps || 3000),
```

**This is how new users get an initial risk estimate without any daily logs.**

---

## Step 3: computeFamilyHistoryWeight (Lines 90-95)

```javascript
function computeFamilyHistoryWeight(familyHistory) {
  if (!familyHistory) return 0;
  if (familyHistory.firstDegreeT2D === 'yes') return 15;  // +15 points
  return 0;
}
```

**Simple:** If user has a parent/sibling with Type 2 Diabetes → +15 risk points.
Based on the Diabetes Prevention Program (DPP) research showing 2-3× increased risk.

---

## Step 4: computeRiskIndex (Lines 98-222) — THE CORE ALGORITHM

This is the **risk score calculation**. It evaluates 12+ health factors and sums their contributions.

### Risk Factor Breakdown:

| Factor | Max Points | How It Works |
|--------|-----------|--------------|
| **Age** | 1 | Age > 60 → +1 point (marginal increase) |
| **Family History** | 15 | First-degree T2D → +15 points |
| **Physical Activity** | 25 | Deficit from 150 min/week target. 0 min → +25 pts |
| **BMI** | 25 | BMI ≥ 30 → +25, ≥ 28 → +20, ≥ 25 → +15, ≥ 23 → +10 |
| **Steps** | 20 | Deficit from 8,000/day target |
| **Sugary Drinks** | 20 | ≥ 10/week → +20, ≥ 5 → +15, ≥ 2 → +8 |
| **Sleep** | 15 | < 5h → +15, < 6.5h → +10, < 7h → +5 |
| **Fast Food** | 15 | ≥ 4/week → +15, ≥ 2 → +8, ≥ 1 → +4 |
| **Sedentary Hours** | 15 | > 10h → +15, > 8h → +10, > 6h → +5 |
| **Waist Circumference** | 15 | Based on IDF South Asian thresholds (♂ 90cm, ♀ 80cm) |
| **Lab Values (HbA1c + Glucose)** | 100 | HbA1c ≥ 6.5% → +50, ≥ 5.7% → +25. Glucose ≥ 7.0 → +50, ≥ 5.6 → +25 |
| **Pattern: Stress + Sleep** | 15 | High stress (> 3.5) + poor sleep (< 6.5h) together |
| **Pattern: Extreme Sedentary** | 15 | Sitting > 9h + activity < 30 min together |
| **Pattern: Toxic Diet** | 15 | Sugar > 5/wk + fast food > 3/wk together |

### Final Score Calculation (Line 220):

```javascript
const internalScore = Math.min(Math.round((rawSum / 160) * 100), 100);
```

- Raw sum is divided by 160 (approximate max) and scaled to 0-100
- Capped at 100 maximum

### South Asian Considerations:
- BMI action point is **23** (not 25 as in Western guidelines) — line 216
- Waist circumference thresholds: **90cm for males, 80cm for females** (IDF South Asian)
- These are WHO/IDF recommendations for South/East Asian populations

---

## Step 5: mapToMeter (Lines 225-234)

```javascript
function mapToMeter(score) {
  const med = parseInt(process.env.RISK_THRESHOLD_MEDIUM) || 25;   // Default: 25
  const high = parseInt(process.env.RISK_THRESHOLD_HIGH) || 50;    // Default: 50
  const vhigh = parseInt(process.env.RISK_THRESHOLD_VERY_HIGH) || 75; // Default: 75

  if (score >= vhigh) return { meterLevel: 'Very High', meterColorKey: 'red' };
  if (score >= high)  return { meterLevel: 'High', meterColorKey: 'orange' };
  if (score >= med)   return { meterLevel: 'Medium', meterColorKey: 'amber' };
  return { meterLevel: 'Low', meterColorKey: 'green' };
}
```

| Score Range | Level | Color |
|------------|-------|-------|
| 0-24 | Low | Green |
| 25-49 | Medium | Amber |
| 50-74 | High | Orange |
| 75-100 | Very High | Red |

**Thresholds are configurable via `.env` — no code change needed.**

---

## Step 6: buildRecommendations (Lines 237-348)

### How the Rule Engine Works:

1. **Load rules:** Reads static rules directly from `src/data/seedData.js` (`RULES` object)
2. **For each rule:** Check if `trigger` conditions are met (e.g., `avgSteps7d < 5000`)
3. **Check `requires`:** Some rules only apply if certain conditions exist
4. **Check `resolve`:** If user already meets the target, skip this rule
5. **Family history boost:** If user has T2D family history, boost priority of affected categories
6. **Category dedup:** Only keep ONE recommendation per category (highest priority)
7. **Top 5:** Return maximum 5 recommendations
8. **Auto-resolve:** Any previously active recommendation no longer triggered gets auto-resolved

### Rule Condition Evaluator (Lines 401-411):

```javascript
function evalOp(val, op, target) {
  switch (op) {
    case 'gte': return val >= target;   // Greater than or equal
    case 'gt':  return val > target;    // Greater than
    case 'lte': return val <= target;   // Less than or equal
    case 'lt':  return val < target;    // Less than
    case 'eq':  return val === target;  // Equal
  }
}
```

### Safety Override (Lines 366-399):

If lab values are in **diabetes range** (HbA1c ≥ 6.5% OR fasting glucose ≥ 7.0 mmol/L):
- ALL regular recommendations are replaced with a single **SAFETY ALERT**
- Message: "Please consult a healthcare professional"
- Score becomes 999 (highest priority)

---

## Step 7: computeCorrelations (Lines 414-480)

Uses **Pearson-R correlation** to find relationships between 10 signal pairs:

```
Sleep ↔ Steps           Sleep ↔ Activity
Stress ↔ Steps          Stress ↔ Activity
Sitting ↔ Steps         Sitting ↔ Sleep
Sugary drinks ↔ Fast food
Stress ↔ Sugary drinks  Stress ↔ Fast food
Sleep ↔ Sugary drinks
```

- Requires minimum **14 days** of data
- Only reports correlations with |r| ≥ 0.3 (meaningful strength)
- Keeps top 3 strongest correlations
- Example: "On days you sleep more, you also tend to have more steps" (r = 0.45)

---

## Step 8: computeTrajectory (Lines 483-560)

Compares current score to score from ~7 days ago:

```javascript
const slope = (currentScore - comparisonScore.internalScore) / daysApart;
if (slope < -0.3) direction = 'improving';     // Score going DOWN = good
else if (slope > 0.3) direction = 'worsening'; // Score going UP = bad
else direction = 'stable';
```

Also projects: "At current trend, your risk could change from Medium to Low in about 3 weeks."

---

## Step 9: evaluateEngagement (Lines 563-613)

### Streak Logic:
```
Day 1: User logs → streak = 1
Day 2: User logs → streak = 2 (consecutive day)
Day 3: User misses → streak protection! (1 miss allowed per week)
Day 4: User logs → streak = 3 (protection used)
Day 5: User misses → streak RESETS to 1 (no more protection this week)
```

- Personal best streak is tracked
- Protection resets every Monday

---

## Step 10-11: Persist and Return (Lines 616-733)

### Dynamic Goals (Lines 681-720):

Goals are set AUTOMATICALLY based on health conditions:

| Condition | Steps Goal | Activity Goal | Weight Goal |
|-----------|-----------|--------------|-------------|
| BMI ≥ 30 | 8,000/day | 150 min/wk | 7% loss |
| BMI 25-29 | 7,000/day | 150 min/wk | 5% loss |
| Family history T2D | 7,000/day | 200 min/wk | — |
| HbA1c ≥ 6.0 or Glucose ≥ 6.0 | 8,000/day | 200 min/wk | 5% if BMI ≥ 25 |

---

## How to Change Things

| Want to... | Where to change |
|-----------|----------------|
| Change BMI thresholds | Lines 131-135 in `computeRiskIndex` |
| Add a new risk factor | Add a new block in `computeRiskIndex` (line 98-222), add points to `rawSum` |
| Change risk level thresholds | `.env` file: `RISK_THRESHOLD_MEDIUM`, `RISK_THRESHOLD_HIGH`, `RISK_THRESHOLD_VERY_HIGH` |
| Add a new correlation pair | Add an entry to `signalPairs` array on line 425 |
| Change streak protection | Modify lines 578-584 in `evaluateEngagement` |
| Change default goals | Modify lines 684-720 |
| Change family history points | Line 93: change `return 15` to any number |
| Disable a risk factor | Comment out or remove the relevant block in `computeRiskIndex` |
| Scale the score differently | Line 220: change `160` to a different maximum divisor |

---

## Exported Functions

```javascript
module.exports = {
  run,                              // Main pipeline entry point
  computeFamilyHistoryWeight,       // Used by insights/simulate
  computeRiskIndex,                 // Used by insights/simulate
  mapToMeter,                       // Used by insights/simulate
  computeMetrics,                   // Used by insights/simulate
  normalizeInputs                   // Available for external use
};
```

The simulate endpoint (`/api/insights/simulate`) reuses `computeMetrics`, `computeRiskIndex`, and `mapToMeter` to show "what-if" projections without saving to DB.
