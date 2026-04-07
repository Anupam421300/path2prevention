# Common Questions, Tasks & How-To Guide

This file answers the most common questions about the codebase and guides you through typical tasks.

---

## Quick-Reference: Where Is Everything?

| "I want to change..." | File | Lines (approx) |
|-----------------------|------|----------------|
| **Risk score calculation** | `src/services/compute/pipeline.js` | 98-222 |
| **Risk level thresholds (Low/Med/High)** | `.env` file | `RISK_THRESHOLD_*` variables |
| **Family history bonus points** | `src/services/compute/pipeline.js` | 90-95 |
| **Recommendation rules** | `src/data/seedData.js` | RULES section |
| **BMI thresholds** | `src/services/compute/pipeline.js` | 131-135 |
| **What counts as "active day"** | `src/services/compute/pipeline.js` | ~55 |
| **Streak protection rules** | `src/services/compute/pipeline.js` | 578-584 |
| **Default health goals** | `src/services/compute/pipeline.js` | 684-720 |
| **Dashboard layout** | `public/js/dashboard.js` | 50-300 |
| **Log form fields** | `public/js/log.js` | 40-237 |
| **API CORS settings** | `api/index.js` | 15 |
| **Rate limits** | `src/middleware/index.js` | 42-73 |
| **Database connection** | `src/config/db.js` | full file |
| **User registration logic** | `src/routes/auth.js` | 36-55 |
| **Daily log save logic** | `src/routes/logs.js` | 37-84 |
| **Dashboard data aggregation** | `src/routes/dashboard.js` | full file |
| **Onboarding wizard steps** | `public/js/onboarding.js` | full file |
| **Color scheme / CSS variables** | `public/css/main.css` | 1-50 |
| **Mobile layout** | `public/css/mobile.css` | full file |
| **Page routes (URL → HTML)** | `api/index.js` | 55-61 |
| **Service worker cache** | `public/sw.js` | full file |
| **PWA settings** | `public/manifest.json` | full file |
| **Deployment routing** | `vercel.json` | full file |

---

## Common Task: Add a New Field to Daily Log

**Example:** Add "screen time hours" as a new daily log field.

### Step 1: Update the Mongoose Schema
**File:** `src/models/index.js`

Find the `dailyLogSchema` and add:
```javascript
screenTimeHours: { type: Number, min: 0, max: 24 },
```

### Step 2: Update the Zod Validation Schema
**File:** `src/routes/logs.js`

Find the Zod schema near the top and add:
```javascript
screenTimeHours: z.number().min(0).max(24).optional(),
```

### Step 3: Add the Input to the Log Form
**File:** `public/js/log.js`

Inside `buildLogHTML()`, add an input element:
```html
<div class="input-group">
  <label>Screen time (hours)</label>
  <input class="input-field" type="number" id="screenTimeInput" min="0" max="24" step="0.5" value="${log.screenTimeHours || ''}">
</div>
```

### Step 4: Include in the Save Payload
**File:** `public/js/log.js`

In the `saveLog()` function, add to the `payload` object:
```javascript
screenTimeHours: parseFloat(document.getElementById('screenTimeInput')?.value || 0) || undefined,
```

### Step 5 (Optional): Use in Risk Calculation
**File:** `src/services/compute/pipeline.js`

In `computeMetrics()`, add:
```javascript
const screenTimeArr = last7.map(l => l.screenTimeHours || 0);
metrics.avgScreenTime7d = Math.round(avg(screenTimeArr) * 10) / 10;
```

In `computeRiskIndex()`, add a new risk factor block.

---

## Common Task: Add a New API Endpoint

### Step 1: Create a New Route File
**File:** `src/routes/myNewRoute.js`

```javascript
'use strict';
const { Router } = require('express');
const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;  // From auth middleware
    // Your logic here
    res.json({ data: 'hello' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

### Step 2: Mount It in the Server
**File:** `api/index.js`

After the `authMiddleware` line (around line 42), add:
```javascript
app.use('/api/my-new-route', require('../src/routes/myNewRoute'));
```

**If public (no auth):** Add it BEFORE the `authMiddleware` line.

---

## Common Task: Change Risk Score Weights

### Where:
`src/services/compute/pipeline.js` → `computeRiskIndex()` function (line 98-222)

### How:
Each risk factor contributes a certain number of points. Find the factor you want to change and modify its values.

**Example — Make activity worth more points:**
```javascript
// Currently:
// 0 min activity → +25 pts (max)
// Change to +35 pts:
let activityScore = Math.round((Math.max(0, 150 - metrics.moderateEqMin7d) / 150) * 35);
```

**Then update the divisor on line 220:**
The `rawSum` is divided by a number to scale to 0-100. If you increase max points, increase the divisor proportionally.

---

## Common Task: Change the Dashboard Layout

### Where:
`public/js/dashboard.js` → `buildDashboardHTML()` function (line 50-300)

### How:
The dashboard uses CSS Grid with `grid-template-columns: repeat(12, 1fr)`.
- `grid-column: span 5` = takes 5 of 12 columns
- `grid-column: span 7` = takes 7 of 12 columns
- `grid-column: span 12` = full width

To rearrange cards, change the `grid-column: span X` values.

---

## Common Task: Add a New Recommendation Rule

### Where:
`src/data/seedData.js` → `RULES.baseRules` array

### How:
Add a new rule object following this template:
```javascript
{
  ruleId: 'MY_NEW_RULE',          // Unique ID
  category: 'Nutrition',          // Category group
  title: 'Eat more vegetables',   // What user sees
  trigger: [
    { signal: 'avgVegServings7d', op: 'lt', value: 3 }  // Activate when <3 servings
  ],
  resolve: [
    { signal: 'avgVegServings7d', op: 'gte', value: 4 } // Auto-resolve at 4+
  ],
  requires: [],                    // Optional prerequisite conditions
  basePriority: 60,                // Importance (higher = shown first)
  why: 'Low vegetable intake is linked to...',
  actions: ['Add a serving of vegetables to lunch', 'Try a salad before dinner'],
  evidenceRefs: [],                // Evidence source IDs
  familyHistoryBoost: 5,          // Extra priority if family history
  familyHistoryContext: 'With family history, nutrition is extra important',
  isSafetyAlert: false
}
```

Since rules are loaded statically, changes take effect immediately upon saving the `seedData.js` file (no database seeding required).

---

## Common Task: Debug a Problem

### "API returning 401 Unauthorized"
1. Check token exists: `localStorage.getItem('p2p_token')`
2. Check token not expired: decode JWT at jwt.io
3. Check `JWT_SECRET` matches between `.env` and token signing

### "Dashboard showing old data"
1. Log form saves → runs pipeline → caches new data
2. If cache stale: call `forceTabRefresh('dashboard')` in browser console
3. Hard refresh: `Ctrl + Shift + R`

### "Risk score seems wrong"
1. Open `pipeline.js` → `computeRiskIndex()`
2. Add `console.log(breakdown)` before the return
3. Check each factor's contribution in server logs

### "Recommendation not appearing"
1. Check rule `trigger` conditions match current metrics
2. Check no `requires` conditions blocking it
3. Check it's not already snoozed/resolved
4. Check category dedup (only 1 per category)
5. Check top 5 limit

### "Database not connecting"
1. Check `MONGODB_URI` in `.env`
2. Check MongoDB Atlas whitelist (Network Access → allow your IP)
3. Check credentials in connection string
4. Try `node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"`

---

## Alternatives & Architectural Decisions

### "Why not React/Vue/Angular?"
- **Chosen:** Vanilla HTML/CSS/JS
- **Why:** No build step, no dependencies, faster initial load, simpler deployment. The app is relatively simple with only 4 tabs.
- **Alternative:** If the UI grows significantly more complex (50+ components), migrating to React with Next.js would provide better component management.

### "Why MongoDB instead of PostgreSQL?"
- **Chosen:** MongoDB (NoSQL)
- **Why:** Flexible schema for health logs (fields may vary day-to-day), natural JSON storage matches JavaScript objects, free Atlas tier, well-suited for per-user document collections.
- **Alternative:** PostgreSQL would be better for complex queries, joins, and strict data integrity. Would require SQL skills.

### "Why JWT instead of sessions?"
- **Chosen:** JWT (stateless authentication)
- **Why:** No session store needed on server, works perfectly with serverless (no sticky sessions), scales horizontally.
- **Alternative:** Express-session with Redis would provide revocation capability but requires a Redis instance.

### "Why Vercel?"
- **Chosen:** Vercel (serverless)
- **Why:** Free tier generous enough for this app, automatic SSL, global CDN, git-based deployments, handles scaling.
- **Alternative:** Railway, Render, DigitalOcean App Platform, or self-hosted VPS with PM2.

### "Why Zod instead of Joi?"
- **Chosen:** Zod
- **Why:** TypeScript-first (even in JS), better error messages, smaller bundle, more composable schemas.
- **Alternative:** Joi (more established), express-validator (simpler for basic validation).

### "Why Chart.js?"
- **Chosen:** Chart.js via CDN
- **Why:** Simple API, responsive, looks good out-of-box, no build step needed (CDN).
- **Alternative:** D3.js (more powerful but much harder), Recharts (needs React), ApexCharts.

---

## Glossary of Technical Terms

| Term | Meaning |
|------|---------|
| **JWT** | JSON Web Token — encrypted ticket that proves who you are |
| **Middleware** | Function that runs BETWEEN receiving a request and sending a response |
| **Schema** | Template/structure defining what data looks like (like a form template) |
| **Mongoose** | Library that makes MongoDB easier to use from JavaScript |
| **ODM** | Object Document Mapper — converts between JS objects and MongoDB documents |
| **SPA** | Single Page Application — one HTML page, JavaScript swaps content |
| **Serverless** | Server runs only when a request comes in, not 24/7 |
| **CORS** | Security rule about which websites can talk to your API |
| **Upsert** | Update if exists, Insert if doesn't |
| **Salt** | Random data added to password before hashing (prevents rainbow tables) |
| **Pipeline** | Series of processing steps run one after another |
| **Pearson-R** | Statistical measure of how two things are related (-1 to +1) |
| **BMI** | Body Mass Index — weight divided by height squared |
| **HbA1c** | Blood test showing average blood sugar over 3 months |
| **Fasting Glucose** | Blood sugar measured after overnight fast |
| **Moderate-equivalent minutes** | Standardized way to compare different exercise intensities |
| **CDN** | Content Delivery Network — serves files from nearest location globally |
| **PWA** | Progressive Web App — website that can be installed like a phone app |
| **Service Worker** | Background script that can cache files for offline use |
