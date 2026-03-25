# Mini Project Review-2

---

## Project Title

**Path2Prevention — Lifestyle Recommendation System for Diabetes Prevention**

- **Student Names:** [Your Names Here]
- **Roll Numbers:** [Your Roll Numbers Here]
- **Guide Name:** [Your Guide's Name Here]
- **Institute Name:** [Your Institute Name Here]

---

## Project Introduction

### Problem Statement

Type 2 Diabetes (T2D) is among the most widespread and preventable chronic diseases worldwide. According to the International Diabetes Federation (IDF), over **537 million adults** globally are living with diabetes, and this number is projected to rise to **783 million by 2045**. The Indian subcontinent is especially vulnerable — India alone has over **101 million** diagnosed diabetic individuals, earning it the title of the "Diabetes Capital of the World."

Despite this crisis, research consistently demonstrates that **lifestyle modifications alone can reduce diabetes risk by up to 58%** (Diabetes Prevention Program Study, 2002). The key preventable risk factors include:

- Physical inactivity and sedentary behaviour
- Poor dietary habits (high sugar, high fast-food consumption)
- Insufficient or irregular sleep patterns
- Chronic stress
- Obesity (elevated BMI, particularly at lower thresholds for South Asian populations)

**The core problem:** Most individuals at risk of T2D are unaware of their risk level, do not track the specific habits that influence diabetes onset, and lack access to personalised, evidence-backed lifestyle recommendations. Existing fitness trackers and calorie counters do not focus on **diabetes-specific risk factors**, and clinical risk calculators fail to integrate daily lifestyle tracking with continuous risk monitoring.

**Path2Prevention solves this** by providing a personalised, evidence-based web platform that continuously calculates a user's diabetes risk score from daily lifestyle signals and delivers actionable, rule-engine-driven recommendations — essentially acting as a personal diabetes prevention assistant.

---

### Need of the Project

1. **Rising Diabetes Epidemic:** India and South Asia have disproportionately high T2D prevalence, yet most individuals have no visibility into their personal risk level until clinical symptoms appear.

2. **Prevention Gap:** The DPP study proved that structured lifestyle changes are more effective than medication (Metformin) for T2D prevention, yet no consumer-facing tool translates this evidence into daily actionable tracking.

3. **South Asian Population Thresholds:** Standard Western BMI thresholds (25 = overweight, 30 = obese) do not apply to South Asian populations. The IDF/WHO recommends **23 as the action point** for South/East Asian populations due to higher metabolic risk at lower BMI. Our system uses these adjusted thresholds.

4. **No Personalised Risk Monitoring:** Existing solutions either offer static risk calculators (fill once, get a score) or generic fitness tracking. Path2Prevention uniquely combines **continuous daily tracking** with a **dynamic risk score** that updates every time the user logs their day.

5. **Family History Integration:** Individuals with a first-degree relative with T2D have a **2–6x higher risk**. Our system integrates family history as a persistent genetic modifier in the risk algorithm.

6. **Lab Value Integration:** For users who have access to lab tests (fasting glucose, HbA1c), the system can integrate these clinical markers and trigger safety alerts when values enter diabetes diagnostic ranges.

---

### Objectives

1. **Build a full-stack web application** that enables users to track 7–8 daily health signals relevant to diabetes risk (steps, sleep, water, stress, sedentary hours, sugary drinks, fast food consumption, and physical activity).

2. **Develop a custom risk scoring algorithm** (0–100 scale) that computes a personalised diabetes risk score using a multi-factor penalty-based model incorporating 12 risk factors, 3 pattern detection rules, and South Asian population thresholds.

3. **Implement a rule-based recommendation engine** that evaluates the user's computed metrics against a library of evidence-backed rules and generates up to 5 personalised, category-deduplicated recommendations with research citations.

4. **Create a Pearson R-based correlation engine** that analyses 28 days of user data to discover hidden statistical patterns between lifestyle habits (e.g., "On days you sleep less, you tend to consume more sugary drinks").

5. **Build a trajectory projection system** that analyses the user's risk score trend over time and projects future risk level changes (e.g., "Your risk could improve from High to Medium in about 3 weeks").

6. **Design a dynamic goal system** that automatically adjusts the user's daily/weekly targets based on their BMI, family history, and lab values — providing harder targets for higher-risk individuals.

7. **Provide data export capabilities** through downloadable CSV data exports and professionally formatted PDF health reports generated via Puppeteer.

8. **Ensure application security** through JWT authentication, bcrypt password hashing, Zod schema validation, rate limiting, NoSQL injection prevention, XSS sanitisation, and production error handling.

---

## Planning of Project Work

### Project Timeline (Gantt Chart)

| Phase | Tasks | Duration | Timeline |
|-------|-------|----------|----------|
| **Phase 1: Research & Planning** | Study DPP research, define risk factors, design database schema, plan API structure | 2 weeks | Week 1–2 |
| **Phase 2: Backend Foundation** | Set up Express server, MongoDB connection, authentication system, middleware stack | 2 weeks | Week 3–4 |
| **Phase 3: Core Engine** | Build the 11-step risk pipeline, scoring algorithm, rule engine, correlation engine | 3 weeks | Week 5–7 |
| **Phase 4: API Development** | Build all 11 route files (30+ endpoints), Zod validation, rate limiting | 2 weeks | Week 8–9 |
| **Phase 5: Frontend Development** | Build SPA shell, dashboard, log form, insights charts, settings, onboarding wizard | 3 weeks | Week 10–12 |
| **Phase 6: Content & Seeding** | Write health tips, articles, recipes, evidence sources, recommendation rules | 1 week | Week 13 |
| **Phase 7: Testing & Security** | End-to-end testing, XSS patching, mass assignment prevention, error handling | 2 weeks | Week 14–15 |
| **Phase 8: Deployment & Documentation** | Deploy to Vercel, write system documentation, prepare review presentation | 1 week | Week 16 |

```
Week:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
       ████                                              Research & Planning
             ████                                        Backend Foundation
                   ██████                                Core Engine
                            ████                         API Development
                                  ██████                 Frontend Development
                                           ██            Content & Seeding
                                              ████       Testing & Security
                                                    ██   Deployment & Docs
```

---

## Team Structure

| Role | Responsibilities |
|------|-----------------|
| **Team Leader** | Project coordination, requirement analysis, architecture design, pipeline algorithm development, code reviews |
| **Backend Developer** | Express server setup, MongoDB schemas, API route development, middleware implementation, pipeline engine coding |
| **Frontend Developer / Designer** | HTML/CSS UI design, JavaScript SPA development, Chart.js integration, responsive design, onboarding wizard |
| **Tester / Security** | End-to-end API testing, security audit, XSS/CSRF/injection testing, performance verification, documentation |

---

## Design Methodology

### Development Model: Agile (Iterative)

We adopted the **Agile (Iterative) Development Model** for the following reasons:

1. **Evolving Requirements:** The risk scoring algorithm underwent multiple iterations as we refined thresholds, added pattern detection, and integrated lab values. Agile allowed us to continuously improve the core engine without disrupting other modules.

2. **Incremental Delivery:** We delivered working features in phases — authentication first, then logging, then risk computation, then recommendations, then charts — allowing us to test each module independently.

3. **Frequent Feedback Loops:** After each iteration, we tested the system with realistic data and adjusted scoring weights, UI layouts, and recommendation logic based on observed results.

4. **Parallel Development:** Backend API development and frontend UI development could proceed in parallel since the API contract was defined upfront.

5. **Risk Reduction:** The most complex component (the 721-line risk pipeline) was developed iteratively — starting with a basic score, then adding factors one by one, then adding pattern detection, then lab values.

**Why not Waterfall?** The risk algorithm required experimentation and tuning that would be impossible with a linear Waterfall approach. We needed the flexibility to backtrack and refine scoring thresholds based on real test data.

---

### Tools Used

| Category | Tool | Purpose |
|----------|------|---------|
| **Code Editor** | VS Code | Primary development environment |
| **Version Control** | Git + GitHub | Source code management and collaboration |
| **Database** | MongoDB Atlas | Cloud-hosted NoSQL database |
| **API Testing** | Custom test scripts (`scripts/test.js`) | Automated end-to-end API testing |
| **Deployment** | Vercel | Serverless deployment platform |
| **PDF Generation** | Puppeteer (Headless Chrome) | Converts HTML templates to downloadable PDFs |
| **Charting** | Chart.js v4 | Frontend data visualization |
| **Package Manager** | npm | Dependency management |
| **Auto-Reload** | Nodemon | Development server with auto-restart |

---

### Technologies Used

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | ≥18.0.0 | Server-side JavaScript runtime |
| **Framework** | Express.js | 4.18.2 | HTTP server and REST API routing |
| **Database** | MongoDB | Cloud (Atlas) | NoSQL document storage |
| **ODM** | Mongoose | 8.0.3 | Schema definition, validation, query building |
| **Auth** | JWT (jsonwebtoken) | 9.0.2 | Stateless token-based authentication |
| **Hashing** | bcryptjs | 2.4.3 | Password hashing (12 salt rounds) |
| **Validation** | Zod | 3.22.4 | Request body schema validation |
| **Security** | Helmet | 7.1.0 | HTTP security headers |
| **Security** | express-mongo-sanitize | 2.2.0 | NoSQL injection prevention |
| **Rate Limiting** | express-rate-limit | 7.1.5 | API abuse prevention |
| **PDF** | Puppeteer | 24.40.0 | Headless Chrome browser for PDF generation |
| **Frontend** | Vanilla HTML/CSS/JS | — | No framework, pure client-side rendering |
| **Charts** | Chart.js | v4 | Interactive line/bar charts |
| **Icons** | Material Symbols Outlined | — | Google icon system |
| **Fonts** | Inter (Google Fonts) | — | Modern sans-serif typography |

---

## System Architecture

### Block Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │Dashboard │ │  Log Tab │ │ Insights │ │    Settings      │   │
│  │  Tab     │ │          │ │   Tab    │ │    Tab           │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────────────┘  │
│       └─────────────┴────────────┴─────────────┘               │
│                          │                                      │
│              api.js (HTTP Client + JWT)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS (REST API)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER (api/index.js)               │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │   Helmet     │  │   CORS       │  │  mongo-sanitize      │    │
│  │  (Security)  │  │  (Origins)   │  │  (Injection Guard)   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘    │
│         └─────────────────┴──────────────────────┘               │
│                           │                                       │
│  ┌────────────────────────┴──────────────────────────────────┐   │
│  │              MIDDLEWARE LAYER                               │   │
│  │  authMiddleware (JWT) → validate (Zod) → rateLimiter       │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           │                                       │
│  ┌────────────────────────┴──────────────────────────────────┐   │
│  │                    ROUTE HANDLERS                          │   │
│  │  auth.js │ profile.js │ settings.js │ logs.js │ dashboard │   │
│  │  insights│ recommendations│ engagement│ export │ content   │   │
│  │  account │                                                 │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           │                                       │
│  ┌────────────────────────┴──────────────────────────────────┐   │
│  │              RISK PIPELINE ENGINE (pipeline.js)             │   │
│  │                                                             │   │
│  │  Step 1: normalizeInputs    → Fetch user data from DB      │   │
│  │  Step 2: computeMetrics     → Calculate 25+ health metrics  │   │
│  │  Step 3: familyHistoryWeight→ Genetic risk factor (0-20)    │   │
│  │  Step 4: computeRiskIndex   → 12-factor penalty scoring     │   │
│  │  Step 5: mapToMeter         → Low/Medium/High/Very High     │   │
│  │  Step 6: buildRecommendations→ Rule engine evaluation       │   │
│  │  Step 7: computeCorrelations → Pearson R pattern analysis   │   │
│  │  Step 8: computeTrajectory  → Future risk projection        │   │
│  │  Step 9: evaluateEngagement → Streak tracking               │   │
│  │  Step 10: persist           → Save results + update goals   │   │
│  │  Step 11: return            → Send results to route handler │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           │                                       │
└───────────────────────────┼───────────────────────────────────────┘
                            │  Mongoose ODM
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     MONGODB ATLAS (Cloud)                         │
│                                                                   │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │  users   │ │  profiles  │ │ daily_logs  │ │ risk_scores  │   │
│  └──────────┘ └────────────┘ └─────────────┘ └──────────────┘   │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ settings │ │   goals    │ │ weekly_     │ │ recommen-    │   │
│  │          │ │            │ │ measures    │ │ dations      │   │
│  └──────────┘ └────────────┘ └─────────────┘ └──────────────┘   │
│  ┌──────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ streak_  │ │correlation_│ │ risk_       │ │ user_        │   │
│  │ records  │ │ snapshots  │ │ trajectories│ │ programs     │   │
│  └──────────┘ └────────────┘ └─────────────┘ └──────────────┘   │
│  + tips, articles, recipes, glossary, evidence_sources,          │
│    activity_guides, food_items, rule_versions, feedback           │
│                     (22 Collections Total)                        │
└───────────────────────────────────────────────────────────────────┘
```

---

## Conceptual Demonstration

### How the System Works

Path2Prevention operates on a **Track → Compute → Recommend → Project** cycle:

1. **User Registration & Onboarding:** A new user registers with email/password. They complete a 5-step onboarding wizard that captures their name, body measurements (height, weight), family history of diabetes, lifestyle snapshot (typical steps, sleep, sugary drink consumption), and optional lab values (fasting glucose, HbA1c).

2. **Daily Logging:** Each day, the user logs their health signals — steps walked, hours slept, glasses of water, stress level (1–5), sedentary hours, sugary drinks consumed, fast food consumed, and any physical activities (with type, intensity, and duration). Optionally, they can log weekly weight/waist measurements and fasting glucose readings.

3. **Pipeline Execution:** Upon saving the log, the backend **Risk Pipeline Engine** executes its 11-step computation sequence. It fetches 30 days of history, computes 25+ metrics, applies the 12-factor scoring algorithm with pattern detection, evaluates recommendation rules, runs Pearson R correlation analysis, calculates the risk trajectory, and updates the engagement streak.

4. **Dashboard Refresh:** The frontend dashboard reloads, displaying the updated risk score (0–100 with gauge visualisation), weekly goal progress, active recommendations, risk trend projection, and 30-day challenge progress.

5. **Insights & Analysis:** The Insights tab provides interactive line charts across 7 categories (Steps, Sleep, Activity, Water, Stress, Sugary Drinks, Fast Food) over configurable time periods (7d, 14d, 30d, 60d, 90d). Pattern Correlations display discovered statistical relationships. The What-If Simulator allows users to project how changing specific habits would affect their risk score.

6. **Continuous Improvement:** As the user logs consistently, the system's recommendations evolve (auto-resolving met goals, surfacing new priorities), correlations become more statistically significant, and the trajectory projection becomes more accurate.

### Process Flowchart

```
                    ┌──────────────┐
                    │  User Opens  │
                    │   Website    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Has Account?│
                    └──────┬───────┘
                     No    │   Yes
              ┌────────────┴──────────┐
              ▼                       ▼
      ┌───────────────┐      ┌──────────────┐
      │   Register    │      │    Login      │
      │  (email/pass) │      │ (email/pass)  │
      └───────┬───────┘      └──────┬────────┘
              │                     │
              └─────────┬───────────┘
                        ▼
              ┌─────────────────┐
              │  Onboarding     │
              │  Complete?      │
              └────────┬────────┘
               No      │    Yes
         ┌─────────────┴──────────┐
         ▼                        ▼
  ┌──────────────┐       ┌──────────────┐
  │  5-Step      │       │  Dashboard   │
  │  Onboarding  │       │  (Main App)  │
  │  Wizard      │       └──────┬───────┘
  └──────┬───────┘              │
         │                      │
         └──────────┬───────────┘
                    ▼
         ┌──────────────────┐
         │  User Logs Day   │
         │  (Steps, Sleep,  │
         │   Diet, Stress,  │
         │   Activity...)   │
         └────────┬─────────┘
                  ▼
         ┌──────────────────┐
         │  Pipeline Runs   │
         │  (11 Steps)      │
         └────────┬─────────┘
                  ▼
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌────────┐ ┌──────────┐ ┌───────────┐
│ Risk   │ │ Recom-   │ │Correlation│
│ Score  │ │ mendations│ │ Analysis  │
│(0-100) │ │ (Top 5)  │ │(Pearson R)│
└───┬────┘ └────┬─────┘ └─────┬─────┘
    │           │              │
    └───────────┴──────────────┘
                │
                ▼
    ┌───────────────────────┐
    │   Dashboard Updates   │
    │  • Risk Gauge         │
    │  • Goal Progress      │
    │  • Recommendations    │
    │  • Trajectory         │
    │  • Streak Badge       │
    └───────────────────────┘
```

---

## Technical Demonstration

### Modules Implemented

| Module | File(s) | Description |
|--------|---------|-------------|
| **Authentication** | `routes/auth.js`, `middleware/index.js` | JWT-based register/login/password-change with bcrypt hashing and Zod validation |
| **User Profile** | `routes/profile.js`, `models/index.js` | CRUD for user health profile with family history, labs, lifestyle snapshot |
| **Daily Logging** | `routes/logs.js`, `public/js/log.js` | Complex form with 8 health signals, activity picker, weight tracking, log locking |
| **Risk Pipeline** | `services/compute/pipeline.js` | 721-line, 11-step computation engine — the core algorithm |
| **Risk Scoring** | `pipeline.js` → `computeRiskIndex()` | 12-factor penalty model with pattern detection and South Asian thresholds |
| **Recommendation Engine** | `pipeline.js` → `buildRecommendations()` | Rule-based system with trigger/resolve conditions, family history boosters, evidence citations |
| **Correlation Engine** | `pipeline.js` → `computeCorrelations()` | Pearson R analysis across 10 signal pairs with human-readable insights |
| **Trajectory Projection** | `pipeline.js` → `computeTrajectory()` | Linear regression-based risk trend forecasting up to 16 weeks |
| **Dashboard** | `routes/dashboard.js`, `public/js/dashboard.js` | 13 parallel DB queries, risk gauge canvas, goals, charts, tips, challenge card |
| **Insights & Charts** | `routes/insights.js`, `public/js/insights.js` | 7 categories, 5 time periods, daily/weekly aggregation, What-If Simulator |
| **PDF Report** | `routes/export.js` | Puppeteer-based HTML-to-PDF health report generation |
| **30-Day Challenge** | `routes/engagement.js`, `routes/dashboard.js` | Enrollment, auto-advancing weekly progression, completion tracking |
| **Onboarding** | `public/js/onboarding.js` | 5-step wizard capturing profile, body measurements, family history, lifestyle, labs |
| **Security Layer** | `middleware/index.js`, `api/index.js` | Helmet, CORS, rate limiting, Zod validation, XSS prevention, error sanitisation |

### Key Code Snippets

**Risk Score Calculation Formula (pipeline.js):**
```javascript
// Each risk factor contributes penalty points
// BMI uses South Asian thresholds (23 = action point, not 25)
let bmiPts = 0;
if (metrics.bmi >= 30) bmiPts = 25;
else if (metrics.bmi >= 28) bmiPts = 20;
else if (metrics.bmi >= 25) bmiPts = 15;
else if (metrics.bmi >= 23) bmiPts = 10;

// Lab values carry massive penalties (clinical diagnostic thresholds)
if (metrics.latestHbA1c >= 6.5) labPts += 50;  // Diabetes range
if (metrics.latestFastingGlucose >= 7.0) labPts += 50;  // Diabetes range

// Pattern detection: compound risk
if (metrics.avgStressScore7d > 3.5 && metrics.avgSleepHours7d < 6.5) {
  patternPts += 15;  // "Stress + poor sleep = insulin resistance"
}

// Final score: scaled out of 160 to 0-100
const internalScore = Math.min(Math.round((rawSum / 160) * 100), 100);
```

**Pearson R Correlation (utils/index.js):**
```javascript
function pearsonR(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { r: 0, n: 0 };
  const xMean = avg(xSlice);
  const yMean = avg(ySlice);
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean;
    const dy = ySlice[i] - yMean;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return { r: Math.round((num / Math.sqrt(denX * denY)) * 100) / 100, n };
}
```

**Dynamic Goal Generation (pipeline.js):**
```javascript
// Goals automatically adjust based on health risk
if (metrics.bmi >= 30) {
  stepsGoal = 8000;       // Higher step target
  weightGoalPct = 7;      // 7% weight loss target
}
if (hasFamilyHistory) {
  activityMin = 200;      // 200 min/week (vs standard 150)
}
if (metrics.latestHbA1c >= 6.0) {
  activityMin = Math.max(activityMin, 200);
  stepsGoal = Math.max(stepsGoal, 8000);
}
```

---

## Results / Output

### System Capabilities Demonstrated

| Feature | Output |
|---------|--------|
| **Risk Score** | Dynamic 0–100 score with gauge visualisation and colour-coded risk levels (Low/Medium/High/Very High) |
| **Risk Breakdown** | Factor-by-factor breakdown showing exactly how much each lifestyle factor contributes to the score |
| **Personalised Recommendations** | Up to 5 evidence-backed recommendations with research citations, snooze/resolve functionality |
| **Safety Alerts** | Automatic override when lab values enter diabetes diagnostic ranges (fasting glucose ≥7.0, HbA1c ≥6.5%) |
| **Pattern Correlations** | Statistical insights like "On days you sleep less, you tend to consume more sugary drinks" (Pearson R ≥ 0.3) |
| **Trajectory Projection** | "Your risk could improve from High to Medium in about 3 weeks" based on linear trend analysis |
| **Interactive Charts** | 7 categories × 5 time periods with proper null/zero handling for unlogged days |
| **What-If Simulator** | Sliders to project how changing habits would affect the risk score |
| **PDF Health Report** | Professionally formatted downloadable report with patient summary, metrics, and recommendations |
| **30-Day Challenge** | 4-week progressive challenge with auto-advancing weekly goals |
| **Streak System** | Consecutive logging streak with 1-day protection per week |
| **Dynamic Goals** | Goals that automatically adjust based on BMI, family history, and lab values |

### Sample Results

- A user with BMI 28, 4000 steps/day, 5.5h sleep, 8 sugary drinks/week, and family history of T2D receives a risk score of **62 (High)** with recommendations to increase steps, reduce sugary drinks, and improve sleep.

- After 3 weeks of consistent logging with improved habits (7500 steps, 7h sleep, 2 sugary drinks), the score drops to **38 (Medium)** and the trajectory message reads: "Your risk has been consistently improving — keep going!"

- A user who self-reports HbA1c of 6.8% triggers the **Safety Override**, replacing all recommendations with: "Please consult a healthcare professional."

---

## Conclusion & Future Scope

### Conclusion (Objectives Fulfilled)

All 8 primary objectives have been successfully achieved:

1. ✅ **Full-stack web application** built with Express.js backend and vanilla JavaScript SPA frontend, deployed on Vercel.
2. ✅ **Custom risk scoring algorithm** implemented with 12 risk factors, 3 pattern detection rules, South Asian BMI thresholds, and lab value integration.
3. ✅ **Rule-based recommendation engine** with trigger/resolve conditions, family history modifiers, evidence citations, and auto-resolution logic.
4. ✅ **Pearson R correlation engine** analysing 10 signal pairs across 28-day windows with human-readable insights.
5. ✅ **Trajectory projection system** using linear regression to forecast risk level changes up to 16 weeks.
6. ✅ **Dynamic goal system** that adjusts targets based on BMI, family history, and lab values.
7. ✅ **Data export** via CSV (90-day) and PDF health reports (30-day) with Puppeteer.
8. ✅ **Comprehensive security** with JWT auth, bcrypt, Zod validation, rate limiting, XSS prevention, and production error handling.

The system successfully demonstrates that a data-driven, evidence-based lifestyle tracking tool can provide meaningful, personalised diabetes risk assessment and prevention guidance.

### Future Improvements

1. **Wearable Device Integration:** Connect with Google Fit, Apple Health, or Fitbit APIs to automatically import step counts, sleep data, and heart rate, eliminating manual logging.

2. **Machine Learning Risk Model:** Replace the rule-based scoring algorithm with a trained ML model (e.g., Random Forest or XGBoost) built on clinical diabetes datasets (e.g., PIMA Indians Diabetes Dataset) for more accurate risk prediction.

3. **Push Notifications:** Implement daily reminder notifications using Web Push API to encourage consistent logging. (Backend infrastructure already built — `push_subscriptions` collection exists.)

4. **Meal Photo Logging:** Integrate image recognition (e.g., Google Cloud Vision or a food recognition model) to allow users to photograph meals and automatically estimate nutritional content.

5. **Social Features:** Add anonymised community features — compare progress with peers, join group challenges, share achievements.

6. **Multi-Language Support:** Add Hindi, Tamil, Telugu, and other regional language support for wider accessibility across the Indian subcontinent.

7. **Healthcare Provider Dashboard:** Create a separate portal where a user can share their data with their doctor, enabling clinical decision support.

8. **Native Mobile App:** Convert the PWA to a native iOS/Android app using React Native or Flutter for improved performance and deeper OS integration.

---

## Thank You

### Questions?

> **Path2Prevention** — Empowering individuals to prevent Type 2 Diabetes through daily habit tracking, evidence-based recommendations, and continuous risk monitoring.

---

## LIVE DEMONSTRATION

System is currently running at `http://localhost:5000` with the following demonstration flow:

1. **Registration** → Create a new account
2. **Onboarding** → Complete the 5-step wizard
3. **Daily Log** → Log today's health signals
4. **Dashboard** → View risk score, goals, recommendations
5. **Insights** → Explore charts and correlations
6. **PDF Export** → Download the health report
7. **Settings** → Edit profile, change theme
