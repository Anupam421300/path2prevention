# Frontend Architecture — Complete Guide

## Frontend Overview

The frontend is a **vanilla HTML/CSS/JavaScript Single Page Application (SPA)** — no React, no Vue, no Angular. The entire app runs inside `app.html`.

### File Map

| File | Size | Purpose |
|------|------|---------|
| `public/app.html` | 17KB | Main app shell — sidebar, tab containers, modals, overlays |
| `public/login.html` | 10KB | Login page with Forgot Password modal flow |
| `public/register.html` | 21KB | Registration page with Terms/Privacy modals |
| `public/js/state.js` | 427B | Global state object |
| `public/js/api.js` | 3.2KB | API client (fetch wrapper, toast, sidebar risk) |
| `public/js/router.js` | 2.8KB | Tab switching + app init |
| `public/js/onboarding.js` | 21.7KB | 4-step onboarding wizard |
| `public/js/dashboard.js` | 28.4KB | Dashboard tab builder + charts |
| `public/js/log.js` | 23.4KB | Daily log form + save logic |
| `public/js/insights.js` | 17.3KB | Insights tab (charts, simulator, recommendations) |
| `public/js/settings.js` | 15.5KB | Settings tab (profile, export, security) |
| `public/js/popups.js` | 7.7KB | Modals and drawers |
| `public/css/main.css` | 41.7KB | Core stylesheet |
| `public/css/mobile.css` | 10KB | Mobile responsive overrides |
| `public/sw.js` | 1.2KB | Service worker (offline caching) |
| `public/manifest.json` | 420B | PWA manifest |

---

## How the SPA Works

### Loading Order (in app.html):
```
1. main.css       → Design system, all component styles
2. mobile.css     → Media queries for mobile
3. Chart.js (CDN) → Charting library
4. state.js       → Global state object (must be first JS)
5. api.js         → API client + toast + sidebar risk
6. popups.js      → Modal/drawer helpers
7. onboarding.js  → Onboarding wizard
8. dashboard.js   → Dashboard tab
9. log.js         → Log today tab
10. insights.js   → Insights tab
11. settings.js   → Settings tab
12. router.js     → Tab switching + initApp() (must be LAST)
```

**Order matters!** `router.js` calls `initApp()` which calls `loadDashboard()`, so dashboard.js must be loaded first.

---

## 1. Global State — `state.js`

```javascript
window.state = {
  currentTab: 'dashboard',    // Which tab is active right now
  user: null,                 // { userId, email, firstName, onboardingComplete }
  dashboardData: null,        // Cached dashboard API response
  todayLog: null,             // Today's log data
  goals: null,                // User's goals
  recs: [],                   // All recommendations
  settings: null,             // User's settings
  lastFetched: {},            // Timestamps of last API fetch per tab
};
```

**Plus XSS helper:**
```javascript
window.escapeHTML = function(str) { ... }  // Same as backend version
```

All state is on `window` (global) because there's no module bundler. Every JS file can access `state.user`, `state.dashboardData`, etc.

---

## 2. API Client — `api.js`

### Key Functions:

**`getToken()`** — Reads JWT from `localStorage.p2p_token`

**`getUser()`** — Reads user info from `localStorage.p2p_user`

**`logout()`** — Clears localStorage, redirects to `/login`

**`apiFetch(path, options)`** — Central API call function:
1. Reads JWT token from localStorage
2. Adds `Authorization: Bearer <token>` header
3. Adds cache-buster query param for GET requests (prevents browser caching)
4. Makes the fetch request
5. If 401 (Unauthorized) → auto-logout
6. If response is CSV/PDF/HTML → return raw response
7. Otherwise parse JSON and check for errors

**`api` object:**
```javascript
api.get('/dashboard')           → apiFetch('/dashboard')
api.post('/logs/daily', body)   → apiFetch('/logs/daily', { method: 'POST', body })
api.put('/profile', body)       → apiFetch('/profile', { method: 'PUT', body })
api.patch('/auth/password', body) → apiFetch('/auth/password', { method: 'PATCH', body })
api.delete('/account')          → apiFetch('/account', { method: 'DELETE' })
```

**`showToast(message, type)`** — Shows temporary notification:
- Creates a div dynamically
- Uses Material Symbols icons
- Auto-removes after 3.5 seconds

**`updateSidebarRisk(riskScore)`** — Updates the sidebar risk badge:
- Sets risk level text and color
- Updates progress bar width and color

---

## 3. Router — `router.js`

### Tab Switching:

```javascript
function switchTab(tab, event, forceRefresh = false) {
  state.currentTab = tab;
  // 1. Hide all tab content divs
  // 2. Show the selected tab
  // 3. Update sidebar + mobile nav active states
  // 4. Close mobile slidebar
  // 5. If tab not cached OR force refresh: load data
}
```

**Tab caching:** Each tab loads data ONCE. Subsequent switches show cached DOM. `forceTabRefresh(tabName)` clears the cache for a specific tab.

### App Initialization:

```javascript
async function initApp() {
  if (!token) → redirect to /login
  
  // 1. Verify session: GET /api/auth/me
  // 2. Store user info in state + localStorage
  // 3. Update sidebar avatar (first letter of name)
  // 4. If not onboardingComplete → start onboarding wizard
  // 5. Otherwise → switchTab('dashboard')
  // 6. After 500ms → preload log, insights, settings tabs in background
}
```

**Background preloading:** After the dashboard loads, the other 3 tabs are quietly loaded in the background. This makes tab switching feel INSTANT because the DOM is already built.

---

## 4. Onboarding Wizard — `onboarding.js`

### 4 Steps:

| Step | Title | What It Collects |
|------|-------|-----------------|
| 1 | Personal Profile | First name, last name, DOB, sex, height, weight |
| 2 | Biometric Vitality | Fasting glucose, HbA1c, family history (T2D) |
| 3 | Lifestyle Scan | Typical steps, sleep, sugary drinks (sliders) |
| 4 | Your Roadmap | Shows timeline + "Enter dashboard" button |

### Flow:

```
Step 1 → validate → Step 2 → validate → Step 3 → save to API → show "Analysing" animation
  → PUT /api/profile (save all data)
  → POST /api/profile/estimate-risk (run pipeline)
  → Step 4 (show roadmap with initial score)
  → "Enter dashboard" button → POST /api/profile/consent → close overlay → loadDashboard()
```

### Step Transitions (Lines 14-41):
```javascript
function renderOnboardingStep() {
  // 1. Slide OUT current content to the LEFT (opacity: 0, translateX: -20px)
  // 2. Wait 200ms
  // 3. Replace HTML content
  // 4. Position new content on the RIGHT (translateX: 20px)
  // 5. Animate IN from right (opacity: 1, translateX: 0)
  // Uses cubic-bezier for bouncy entrance animation
}
```

---

## 5. Dashboard Tab — `dashboard.js`

### loadDashboard():
1. Show skeleton loading state
2. `GET /api/dashboard`
3. If `onboardingRequired` → start onboarding
4. Build HTML with `buildDashboardHTML(data)`
5. Render risk gauge (canvas arc)
6. Render 4 dashboard charts (steps, sleep, activity, weight)
7. Show "resolved recommendation" banner if applicable
8. Show "Very High Risk" warning if score ≥ 75

### Dashboard Layout (Bento Grid):

```
┌───────────────────────────────────────────────┐
│ Date & Greeting                                │
├─────────────┬─────────────────────────────────┤
│ Risk Score  │  This Week's Goals               │
│ (gauge)     │  (progress bars)                  │
├──────┬──────┼──────┬──────────────────────────┤
│Streak│Trend │Focus │  (or Safety Alert)         │
├──────┴──────┼──────┴──────────────────────────┤
│ Steps Chart │ Sleep Chart  │ Tips              │
│ Activity    │ Weight Chart │                   │
├─────────────┴──────────────┴──────────────────┤
│ Deep Analysis: Lifestyle Pattern Correlations   │
└───────────────────────────────────────────────┘
```

### Risk Gauge (Canvas rendering, lines 334-359):
Uses HTML5 Canvas to draw a semi-circle arc:
- Track (grey arc) = full path
- Fill (colored arc) = score percentage

### Dashboard Charts (lines 363-428):
Uses Chart.js to render 4 mini line charts:
- Steps, Sleep, Activity: from `chartData` (last 7 daily logs)
- Weight: from `weights` (weekly measures)

---

## 6. Log Today Tab — `log.js`

### UI Components:

| Section | Inputs | Type |
|---------|--------|------|
| **Movement** | Steps (number + ±1k buttons), activities (dynamic rows), weight, waist | Number inputs, selects |
| **Nutrition** | Water (8 clickable droplet icons), sugary drinks (counter), fast food (counter) | Interactive buttons |
| **Rest & Wellbeing** | Sleep (slider 4-11h), stress (1-5 buttons) | Range slider, buttons |
| **Sitting & Labs** | Sedentary hours (slider), fasting glucose (mg/dL), HbA1c (%) | Range slider, number inputs |

### Key UI Interactions:

**Water drops (lines 289-298):** Click a droplet → toggles all drops up to that index. Uses `filled` CSS class and `font-variation-settings` for the Material icon fill.

**Stress buttons (lines 299-307):** Click a number → highlights it with green border/background. Stores value in hidden input.

**"Same as yesterday" (lines 453-465):** Fetches yesterday's log from API and pre-fills the form.

### Save Logic (lines 323-406):

```javascript
async function saveLog() {
  // 1. Disable save button, show spinner
  // 2. Collect all form values into payload
  // 3. Convert glucose mg/dL → mmol/L (÷ 18)
  // 4. POST /api/logs/daily
  // 5. If weight entered → POST /api/logs/weekly
  // 6. Update sidebar risk badge
  // 7. Show risk score delta toast (+/-X pts)
  // 8. Show log summary card
  // 9. Lock the form (disable all inputs)
  // 10. Force refresh dashboard + insights tabs
}
```

**Locked state (lines 409-424):** After saving, ALL inputs are disabled and a green banner appears: "Today's log is saved — see you tomorrow!"

---

## 7. Insights Tab — `insights.js`

### Components:

1. **Trend Chart** — Line chart with category selectors (activity, sleep, hydration, stress, sugar, fast food) and period selectors (7d, 14d, 30d, 90d)
2. **Pattern Correlations** — Shows Pearson-R results with insights
3. **What-If Simulator** — 6 sliders with real-time risk projection
4. **My Recommendations** — Tabbed list (Active/Snoozed/Done) with snooze/resolve buttons

### What-If Simulator (lines 295-329):

```javascript
function runSimulation() {
  // Debounced (500ms) — doesn't spam API on rapid slider changes
  // Reads all 6 slider values
  // POST /api/insights/simulate
  // Shows: ↓ 14 pts — Projected score: 28/100 · Low
}
```

---

## 8. Settings Tab — `settings.js`

### Sections:

1. **Profile Card** — Edit name (DOB, sex, height, weight are locked after onboarding)
2. **Family History** — Read-only, locked after consent
3. **30-Day Challenge** — Enroll or see progress
4. **Export Data** — CSV download + PDF report
5. **Security** — Change password + delete account (danger zone)

### Account Deletion (lines 269-278):

```javascript
function confirmDeleteAccount() {
  // 1. window.confirm() — first warning
  // 2. window.prompt("Type DELETE") — double confirmation
  // 3. DELETE /api/account — permanently removes everything
  // 4. Auto-logout after 1.5 seconds
}
```

---

## 9. Popups & Modals — `popups.js`

### Risk Breakdown Modal:
Shows detailed breakdown of the risk score — each factor with icon, points, and clinical note.

### Evidence Panel (Drawer):
Side-sliding panel showing research citations for recommendations. Falls back to default WHO/ADA/NEJM sources if no specific evidence is linked.

### Very High Risk Warning:
Modal that appears when risk score ≥ 75 (non-onboarding estimate).

---

## 10. Service Worker — `sw.js`

```javascript
// Strategy: Network-First with Cache Fallback
// 1. Try to fetch from network
// 2. If network succeeds → update cache + return response
// 3. If network fails (offline) → return from cache
// API calls are NEVER cached (line 28)
```

**Cache name:** `p2p-v5` — Bump this version to invalidate old caches.

**Cached assets:** app.html, main.css, mobile.css, all JS files.

---

## 11. PWA Manifest — `manifest.json`

```json
{
  "name": "Path2Prevention",
  "short_name": "P2P",
  "start_url": "/app",           // Opens at /app when installed
  "display": "standalone",       // Hides browser chrome
  "background_color": "#F8FAFB",
  "theme_color": "#27AE60",      // Green status bar on mobile
  "icons": [192px, 512px]
}
```

This makes the app installable on mobile devices as a "home screen app."

---

## CSS Architecture

### `main.css` (41.7KB):
- CSS custom properties (variables) for design tokens
- Light AND dark mode via `prefers-color-scheme` media query
- Base element resets
- Card, button, input, slider, toast component styles
- Skeleton shimmer animations (loading states)
- Sidebar, modal, drawer styles

### `mobile.css` (10KB):
- `@media (max-width: 768px)` overrides
- Converts desktop grid layouts to single-column
- Shows mobile bottom navigation, hides desktop sidebar
- Adjusts font sizes and spacing for mobile

---

## Frontend-Backend Connection Map

```
Frontend File        →  API Endpoint(s) Called
─────────────────────────────────────────────
register.html        →  POST /api/auth/register
login.html           →  POST /api/auth/login, POST /api/auth/verify-dob, POST /api/auth/forgot-password
router.js            →  GET /api/auth/me
onboarding.js        →  PUT /api/profile, POST /api/profile/estimate-risk, POST /api/profile/consent
dashboard.js         →  GET /api/dashboard
log.js               →  GET /api/logs/daily/:date, POST /api/logs/daily, POST /api/logs/weekly, GET /api/activity-guides
insights.js          →  GET /api/insights/analytics, GET /api/insights/correlations, GET /api/recommendations, POST /api/insights/simulate
settings.js          →  GET /api/profile, GET /api/settings, GET /api/engagement/program, PUT /api/profile, PUT /api/settings, PATCH /api/auth/password, POST /api/engagement/program/enroll, GET /api/export/csv, GET /api/export/pdf, DELETE /api/account
popups.js            →  GET /api/content/evidence
```
