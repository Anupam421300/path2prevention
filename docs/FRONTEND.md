# Path2Prevention — Complete Frontend Documentation

> **Frontend-only reference.** Every screen, section, component, interaction, animation, popup, API call, and data binding visible to the user.

---

## Table of Contents

1. [Technology & File Structure](#1-technology--file-structure)
2. [Design System](#2-design-system)
3. [App Shell — Layout & Navigation](#3-app-shell--layout--navigation)
4. [Authentication Pages](#4-authentication-pages)
5. [Onboarding Flow](#5-onboarding-flow-4-steps)
6. [Tab 1 — Dashboard](#6-tab-1--dashboard)
7. [Tab 2 — Log Today](#7-tab-2--log-today)
8. [Tab 3 — Insights](#8-tab-3--insights)
9. [Tab 4 — Learn](#9-tab-4--learn)
10. [Tab 5 — Settings](#10-tab-5--settings)
11. [Global Popups & Overlays (5 types)](#11-global-popups--overlays-5-types)
12. [Toast Notification System](#12-toast-notification-system)
13. [Skeleton Loaders](#13-skeleton-loaders)
14. [Error States](#14-error-states)
15. [Routing & Tab Transitions](#15-routing--tab-transitions)
16. [API Communication Layer](#16-api-communication-layer)
17. [State Management](#17-state-management)
18. [Responsive Design — Desktop vs Mobile](#18-responsive-design--desktop-vs-mobile)
19. [All API Calls by Tab](#19-all-api-calls-by-tab)
20. [All Interactive Elements & Event Handlers](#20-all-interactive-elements--event-handlers)

---

## 1. Technology & File Structure

### Libraries & CDN Assets
| Asset | Source | Purpose |
|---|---|---|
| **Chart.js v4** | `cdn.jsdelivr.net/npm/chart.js@4` | All charts (bar, line) |
| **Material Symbols Outlined** | Google Fonts CDN | All icons throughout the app |
| **Inter font** | Google Fonts CDN (wght 300–800) | Typography system |

### JavaScript Files (loaded in order at bottom of body)
```
public/
  js/
    api.js          ← HTTP client (fetch wrapper with JWT)
    state.js        ← Global app state object
    popups.js       ← 5 popup/modal/overlay types
    onboarding.js   ← 4-step onboarding wizard
    dashboard.js    ← Dashboard tab renderer
    log.js          ← Log Today tab renderer
    insights.js     ← Insights tab renderer
    learn.js        ← Learn tab renderer
    settings.js     ← Settings tab renderer
    router.js       ← Tab switching, back/forward, deep-link

  css/
    main.css        ← Full design system (tokens, components, utilities)

  app.html          ← App shell (entry point for authenticated users)
  login.html        ← Login page
  register.html     ← Registration page

  manifest.json     ← PWA manifest
  sw.js             ← Service worker stub (offline-ready hook)
```

---

## 2. Design System

### Color Palette
| Token | Hex | Used For |
|---|---|---|
| `--color-primary` | `#006c49` | Buttons, active states, progress bars, icons |
| `--color-primary-light` | `rgba(0,108,73,0.08–0.15)` | Hover states, backgrounds |
| `--color-accent` | `#10b981` | Secondary green, gradient ends |
| `--color-text-primary` | `#191c1d` | Headings |
| `--color-text-secondary` | `#3c4a42` | Body text |
| `--color-text-muted` | `#6c7a71` | Labels, captions |
| `--color-muted-light` | `#bbcabf` | Borders, disabled elements |
| `--color-surface` | `#f8f9fa` | Card backgrounds |
| `--color-bg` | `#f0f4f1` | Page background |
| Risk Low | `#006c49` | Green |
| Risk Medium | `#f59e0b` | Amber |
| Risk High | `#f97316` | Orange |
| Risk Very High | `#ba1a1a` | Red |

### Typography
- **Font family:** Inter (Google Fonts)
- **Heading sizes:** 26–36px, weight 800–900, letter-spacing −0.5px
- **Body text:** 13–15px, weight 400–500
- **Labels/caps:** 10–12px, weight 700, letter-spacing 0.05–0.12em, UPPERCASE
- **Card subtext:** 11–12px, color `#6c7a71`

### Component Classes
| Class | Description |
|---|---|
| `.card` | White rounded card, box-shadow, border-radius 20px |
| `.btn` | Base button style |
| `.btn-primary` | Green filled button |
| `.btn-secondary` | Light outlined button |
| `.btn-ghost` | Transparent button, hover highlight |
| `.btn-sm` | Small button |
| `.btn-full` | Full width button |
| `.input-field` | Styled text/number/date input |
| `.input-group` | Label + input wrapper |
| `.slider-input` | Custom range slider (green thumb) |
| `.counter-input` | − value + button group |
| `.mood-face` | Emoji selection button |
| `.pill` | Rounded filter/tag button |
| `.pill-green` | Active pill (green) |
| `.pill-gray` | Inactive pill |
| `.chart-tab` | Small tab button for chart categories |
| `.insight-tab` | Same as chart-tab, used in Insights |
| `.skeleton` | Shimmer loading placeholder |
| `.skeleton-card` | Card-shaped skeleton |
| `.skeleton-title` | Title-shaped skeleton |
| `.skeleton-text` | Line-shaped skeleton |
| `.empty-state` | Centered empty/error state with icon |
| `.toggle-switch` | iOS-style toggle |
| `.toggle-track` | Toggle background track |
| `.toggle-thumb` | Toggle white circle |

### Animations & Transitions
| Animation | Duration | Used On |
|---|---|---|
| Tab fade-in slide up | `0.25s ease` | Every tab switch |
| Modal scale-in (spring) | `0.3s cubic-bezier(0.34,1.56,0.64,1)` | Modal panel appear |
| Drawer slide-in from right | `0.35s cubic-bezier(0.4,0,0.2,1)` | Evidence drawer |
| Modal backdrop blur fade | `0.2s` | Backdrop opacity |
| Progress bar width | `0.8s ease` | Goal bars |
| Risk gauge arc | Canvas draw (instant) | Dashboard gauge |
| Confetti fall | `2–5s linear infinite` | Badge celebration |
| Badge ring breathe | `2s ease-in-out infinite` | Celebration overlay |
| Very High Risk pulse | `2s ease-in-out infinite` | Warning icon |
| Streak dot glow | `box-shadow` on filled | Week dots |
| Sidebar risk bar | `0.8s ease width` | Risk fill bar |
| Simulator result | `0.3s all` + `0.5s width` | Score bar |
| Water drop toggle | `0.2s color` | Log tab |
| Counter adjust | Instant | Steps/drink counters |

---

## 3. App Shell — Layout & Navigation

**File:** `public/app.html`

### Layout Structure (Desktop)
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (left, 240px fixed)                    │
│  ┌─────────────────────────────────────────┐    │
│  │ Logo: [🟢] Path2Prevention              │    │
│  │       Clinical Serenity (tagline)        │    │
│  │                                          │    │
│  │ Navigation links:                        │    │
│  │  📊 Dashboard (active = green bg)       │    │
│  │  ➕ Log Today                           │    │
│  │  📈 Insights                            │    │
│  │  📚 Learn                              │    │
│  │  ⚙️ Settings                           │    │
│  │                                          │    │
│  │ Risk Badge (shown after first log):      │    │
│  │  RISK LEVEL label                        │    │
│  │  Medium ——— 34/100                      │    │
│  │  [====       ] progress bar             │    │
│  │                                          │    │
│  │ User section (bottom):                   │    │
│  │  [JB] First Last      Sign out           │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  MAIN CONTENT AREA (right, fills remaining)      │
│  Scrollable. Active tab content injected here.   │
└─────────────────────────────────────────────────┘
```

### Layout Structure (Mobile)
```
┌──────────────────────────────────┐
│  MAIN CONTENT AREA               │
│  (full width, scrollable)        │
│                                  │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│  BOTTOM NAV (fixed, 5 buttons)   │
│  🏠Home  ➕Log  📈  📚  ⚙️     │
└──────────────────────────────────┘
```

### Sidebar Risk Badge
- **Shown:** After first successful dashboard load (`updateSidebarRisk()`)
- **Hidden:** Before first pipeline run
- **Data:** `riskScore.internalScore`, `riskScore.meterLevel`
- **Visual:** Risk level label + `XX/100` score + thin 4px progress bar (color matches risk level)

### Sidebar User
- **Avatar:** Gradient circle with first letter initial
- **Name:** From `localStorage` `p2p_user.firstName`
- **Sign out button:** Clears `localStorage`, redirects to `/login`

### Active State
- Clicking any nav link/button: adds `.active` class to that item, removes from others
- Both desktop sidebar links and mobile bottom nav items sync via `switchTab()`

---

## 4. Authentication Pages

### Login Page (`/login` or `public/login.html`)
**Sections:**
- App logo + "Path2Prevention" branding
- "Welcome back" heading
- Email input (`type="email"`)
- Password input (`type="password"`, show/hide toggle)
- **Sign in** button → `POST /api/auth/login`
- Link to Register page
- Error messages displayed inline (red, below button)

**On success:**
- Save `p2p_token` and `p2p_user` to `localStorage`
- Redirect to `/app`

**Validations (client-side):**
- Email format check
- Password non-empty

---

### Register Page (`/register` or `public/register.html`)
**Sections:**
- App logo
- "Create your account" heading
- First name input
- Email input
- Password input (min 8 chars)
- Confirm password input
- **Create account** button → `POST /api/auth/register`
- Link to Login page

**On success:**
- Save token + user to `localStorage`
- Redirect to `/app` → onboarding overlay shows automatically

---

## 5. Onboarding Flow (4 Steps)

**File:** `public/js/onboarding.js`  
**Triggered:** When `api.get('/dashboard')` returns `{ onboardingRequired: true }` (i.e., profile not complete)  
**Overlay:** `#onboardingOverlay` covers 100% of screen (#f8f9fa background)

### Step indicator (top-right)
- "Step 1 of 4" label
- 4 animated dots (filled = completed, current = primary color)

### Step 1 — About You
**Fields:**
- Date of birth (date input)
- Sex (radio: Male / Female / Prefer not to say)
- Height (cm)
- Baseline weight (kg)

**API on save:** Stored locally and submitted in Step 4

---

### Step 2 — Family History
**Fields:**
- "Does a first-degree relative (parent, sibling) have Type 2 Diabetes?" — Yes / No / Unknown
  - If Yes: "Which relatives?" — Parent / Sibling / Both / Other
- "First-degree relative with Type 1 Diabetes?" — Yes / No / Unknown
- "Second-degree relative with T2D?" — Yes / No / Unknown

> ⚠️ **Locked after consent** — shown as read-only in Settings after this step.  
> 🎯 **This data directly affects risk scoring**: +7 to +20 points to all risk calculations.

---

### Step 3 — Lifestyle Snapshot
**Fields:**
- Typical daily steps (counter input, ±500)
- Typical sleep hours per night (slider)
- Typical sugary drinks per day (counter)
- Activity level (radio: Sedentary / Light / Moderate / Active)
- Diet preference (pill buttons: veg / eggetarian / non_veg)
- Work schedule (radio: Regular / Rotating / Night shift)

---

### Step 4 — Consent & Goals
**Content:**
- Summary of what the app collects and how it's used
- Consent checkbox (required to proceed)
- Consent timestamp recorded
- "Get started" button → `PUT /api/profile` (saves all onboarding data) + marks `onboardingComplete: true`
- On success: hides overlay, loads dashboard

---

## 6. Tab 1 — Dashboard

**File:** `public/js/dashboard.js`  
**API Call:** `GET /api/dashboard` (runs full computation pipeline each load)  
**Loading state:** `dashboardSkeleton()` — 5 shimmer cards grid

### 6.1 Header
```
Saturday, March 21          ← date today (JS toLocaleDateString)
Good morning, Rohan!        ← time-aware greeting from backend
```

### 6.2 Bento Grid Layout (12-column)

All cards are arranged in a CSS grid `grid-template-columns: repeat(12, 1fr)`:

---

### Card A — Diabetes Risk (columns 1–5)
**Size:** 5/12 width, ~220px height

**Elements:**
- Label: "DIABETES RISK" (uppercase, muted)
- `[Why this level?]` button → opens **Risk Breakdown Modal** (Popup #1)
- **Arc Gauge** (Canvas 200×110px):
  - Grey semicircle background track (14px line width)
  - Coloured fill arc from 0 → (score/100 × 180°)
  - Color matches risk level (green/amber/orange/red)
- **Score number:** big (36px, weight 900), color matches level
- "out of 100" subtext
- **Level badge pill:** "Low" / "Medium" / "High" / "Very High" — colored background

**Triggers:**
- `renderRiskGauge(riskScore)` called after DOM injection
- Very High (≥75): automatically opens `showVeryHighRiskWarning()` (Popup #5)

---

### Card B — This Week's Goals (columns 6–12)
**Size:** 7/12 width

**4 goal rows** — each row has:
- Material icon in green circle
- Label + live value vs goal
- 6px progress bar (animates width transition 0.8s)

| Row | Icon | Metric | Source field | Goal |
|---|---|---|---|---|
| Activity | `directions_run` | moderateEqMin7d min | `metrics.moderateEqMin7d` | `goals.activityGoalWeeklyMin` (150) |
| Steps (avg) | `footprint` | avg/day | `metrics.avgSteps7d` | `goals.stepsGoalDaily` (6000/7000) |
| Sleep (avg) | `bedtime` | hrs | `metrics.avgSleepHours7d` | `goals.sleepGoalHours` (7.5) |
| Water (avg) | `local_drink` | glasses | `metrics.avgWaterGlasses7d` | `goals.waterGoalGlasses` (8) |

**Progress bar color rules:**
- ≥100%: `#006c49` (green)
- ≥60%: `#10b981` (light green)
- ≥30%: `#f59e0b` (amber)
- <30%: `#f97316` (orange)

Header right: "X/7 days logged" → `metrics.daysLogged7d`

---

### Card C — Current Streak (columns 1–4)
**Left side:**
- "CURRENT STREAK" label
- Big number: `engagement.streak.currentStreak` days
- 🔥 emoji (right)

**Week Dots (Mon–Sun row):**
- 7 circles (28px each), labelled M T W T F S S
- Filled = green with glow shadow, data from `engagement.weekDots[0..6]`

**Footer:**
- "Best: X days" → `engagement.streak.personalBest`

---

### Card D — Risk Trajectory (columns 5–8)
**Elements:**
- "RISK TRAJECTORY" label
- Direction icon + label row:
  - `trending_down` (green) = Improving
  - `trending_up` (red) = Worsening
  - `trending_flat` (amber) = Stable
- Message text: e.g. "At your current trend, your risk could improve from Medium to Low in ~3 weeks."

**Data:** `data.trajectory.direction`, `data.trajectory.message`

---

### Card E — Top Focus Areas (columns 9–12)
**Shows top 2 recommendations (from `data.recommendations[0..1]`)**

Each rec card:
- `title`, `category`
- Red left border for #1, amber for #2
- Background `#f8f9fa`

"View all recommendations →" button → `switchTab('insights')`

---

### Card F — 7-Day Trends Chart (columns 1–8)
**Chart type:** Bar chart (Chart.js)  
**X axis:** 7 date labels (DD/MM format)  
**Y axis:** Auto-scaled

**5 metric tab buttons:**
| Button | Key in chartData | Label | Color |
|---|---|---|---|
| Steps | `steps` | Steps | `#006c49` |
| Sleep | `sleepHours` | Sleep (h) | `#8b5cf6` |
| Water | `waterGlasses` | Water | `#0ea5e9` |
| Mood | `moodScore` | Mood | `#ec4899` |
| Activity | `activityMin` | Activity (min) | `#10b981` |

**Interaction:** Clicking any tab button calls `switchChartMetric(metric)` → re-renders chart without API call (uses cached `state.dashboardData.chartData`)

**Chart options:**
- Legend: hidden
- Tooltip: dark bg (#191c1d), cornerRadius 10
- Border radius on bars: 8px
- Grid: x-grid hidden, y-grid light grey

---

### Card G — Today's Tip (columns 9–12)
**Elements:**
- 💡 icon + "TODAY'S TIP" label
- Tip text (14px, line-height 1.6, green left border 3px)
- Category badge pill (e.g. "Hydration", "Sleep")

**Data:** `data.tip.text`, `data.tip.category`  
**Fallback:** "Log your daily vitals to receive personalised health tips."

**How tip is selected:** Backend picks tip at `skip = dayOfYear % tipCount` — changes daily.

---

### Dashboard Sidebar Update
After any log save, `updateSidebarRisk(riskScore)` is called to:
- Show the sidebar risk badge (hidden by default)
- Set `#sidebarRiskLevel` text (e.g. "Medium")
- Set `#sidebarRiskScore` text (e.g. "34/100")
- Animate `#sidebarRiskFill` width to `${score}%`
- Color the fill bar by risk level

---

## 7. Tab 2 — Log Today

**File:** `public/js/log.js`  
**API calls on load:**
- `GET /api/logs/daily/:today` — pre-fill with existing data
- `GET /api/activity-guides` — populate activity type dropdown

**Loading state:** 3 skeleton card placeholders (3-column grid)

### 7.1 Header Row
- Left: date "Saturday, March 21" subtext + "Log Today" H1
- Right: `[📄 Same as yesterday]` button → fetches yesterday's log and pre-fills form

### 7.2 Four Input Cards (2×2 grid)

---

#### Card 1 — Movement (`directions_run` icon, green)

**Steps today** — counter input (±500, min 0, max 50,000):
- `−` / `+` buttons adjust hidden `#stepsVal`
- Display shows localized number (e.g. "7,500")

**Physical Activities** — dynamically added rows:
- `[+ Add activity]` button → adds a row containing:
  - Activity type dropdown (from `activityGuides` API — 11 types)
  - Intensity dropdown (Light / Moderate / Vigorous)
  - Minutes number input (1–300)
  - `✕` close button

**Weight (kg)** — number input (optional, saved to `WeeklyMeasure` if entered)  
**Waist (cm)** — number input (optional)

---

#### Card 2 — Nutrition (`restaurant` icon, green)

**Water (glasses)** — 8 water drop buttons (interactive toggle):
- Tap drop #N → fills drops 1 through N
- Tap filled drop #N → unfills back to N-1
- Filled drops: blue (`#0ea5e9`), FILL=1 SVG variation
- Unfilled: grey, FILL=0
- Hidden `#waterVal` stores count

**Sugary drinks/day** — counter ±1 (min 0, max 20)

**Fast food meals** — counter ±1 (min 0, max 10)

**Diet quality today** — 5 emoji buttons:
| Emoji | Label | Value |
|---|---|---|
| 😔 | Poor | 1 |
| 😕 | Fair | 3 |
| 😐 | Okay | 5 |
| 🙂 | Good | 7 |
| 😁 | Great | 10 |
Selected button gets `.selected` class (green border/bg).

---

#### Card 3 — Rest & Wellbeing (`bedtime` icon, purple)

**Sleep last night** — range slider (3h–12h, step 0.5h):
- Live display: "7.5h" updating as slider moves
- Tick marks: 3h | 7.5h ✓ | 12h
- Green custom thumb styling

**Mood today** — 5 emoji face buttons (1–5):
| Emoji | Label | Value |
|---|---|---|
| 😞 | Low | 1 |
| 😕 | Meh | 2 |
| 😐 | Okay | 3 |
| 🙂 | Good | 4 |
| 😁 | Great | 5 |

**Stress level today** — 5 number buttons (1–5):
- 1 = Calm, 5 = Highly stressed
- Selected: green border + bg; unselected: grey

---

#### Card 4 — Sitting Time & Labs (`chair` icon, amber)

**Sedentary hours** — range slider (0–16h, step 0.5h):
- Live display updating
- Tick marks: 0h | 8h | 16h

**Lab Values section (optional):**
- **Fasting Glucose (mg/dL)** — number input (50–400)
  - Hint text: "Normal: 70–99"
  - Converted to mmol on save: `glucoseMmol = glucoseMgDl / 18`
- **HbA1c (%)** — number input (3–15, step 0.1)
  - Hint text: "Normal: <5.7%"

---

### 7.3 Save Button (sticky footer)
- `[💾 Save today's log]` — sticky at bottom of page, blur backdrop
- On click: `saveLog()`:
  1. Collects all field values
  2. Removes falsy optional fields
  3. `POST /api/logs/daily` (triggers full pipeline)
  4. If weight entered: `POST /api/logs/weekly`
  5. On success: `updateSidebarRisk(result.riskScore)` + badge popup if earned + success toast
  6. On error: error toast, button re-enabled

---

## 8. Tab 3 — Insights

**File:** `public/js/insights.js`  
**API calls on load (parallel):**
- `GET /api/insights/analytics?period=7` (default period)
- `GET /api/insights/correlations`
- `GET /api/recommendations`

**Loading state:** 3 skeleton cards

### 8.1 Header
- "Insights" H1
- "Trends, correlations, and personalised recommendations." subtitle

### 8.2 Trend Chart Card (full width)

**Category tab row (7 buttons):**
| Button | Metric key in weekly data | Y-axis label | Color |
|---|---|---|---|
| All | `avgSteps` | Avg Steps | `#006c49` |
| Activity | `totalActivityMin` | Activity min | `#10b981` |
| Sleep | `avgSleepHours` | Sleep hrs | `#8b5cf6` |
| Diet | `avgDietScore` | Diet score | `#f59e0b` |
| Hydration | `avgWaterGlasses` | Water glasses | `#0ea5e9` |
| Stress | `avgStressScore` | Stress (1-5) | `#ec4899` |
| Mood | `avgMoodScore` | Mood (1-5) | `#f97316` |

**Period tab row (4 buttons):**
- `7d`, `14d`, `30d`, `90d`
- Changing period → `switchInsightPeriod(period)` → re-fetches analytics API

**Chart type:** Line chart (Chart.js)
- Points: 4px radius filled circles
- Fill: 15% opacity area under line
- Tension: 0.4 (smooth curves)
- X labels: `W1, W2, W3...` (week numbers from `analytics.weeks[].weekNum`)

**Switching category:** `switchInsightCategory(cat)` — no API call, uses cached `window._insAnalytics`

---

### 8.3 Pattern Correlations Card

**When ≥14 days of data logged:**
Shows up to 4 correlation cards. Each card:
- **Header row:** `Signal A ↔ Signal B` label + `r = +0.87` or `r = -0.96` badge
  - Positive r: green color
  - Negative r: red color
- **Insight text:** "When your sleep is better, your steps tend to be higher."
- **Action suggestion (green):** "→ Improving your sleep may also help your steps."

**Signal name mapping (frontend):**
```
steps       → Step count
sleepHours  → Sleep
moodScore   → Mood
stressScore → Stress
sedentaryHours → Sitting hours
sugaryDrinks → Sugary drinks
dietScore   → Diet quality
waterGlasses → Water intake
```

**When <14 days of data:**
- Lock icon 🔒
- "Not enough data"
- "Log for N more days to unlock correlations between your health signals."
- "Requires minimum 14 days of logs"

---

### 8.4 What-If Simulator Card

**Header:** `🔬` icon + "What-If Simulator"  
**Subtitle:** "Adjust sliders to see your projected risk score change."

**5 slider inputs:**
| ID | Label | Range | Default | Step | Backend field |
|---|---|---|---|---|---|
| `simActivity` | Daily activity (min) | 0–120 | 30 | 1 min | `moderateEqMin7d` (×7) |
| `simSteps` | Daily steps | 0–15,000 | 5,000 | 500 | `avgSteps7d` |
| `simSugary` | Sugary drinks/day | 0–10 | 2 | 1 | `sugaryDrinks7d` (×7) |
| `simSleep` | Sleep hours | 4–10 | 7 | 0.5 | `avgSleepHours7d` |
| `simSitting` | Sitting hours/day | 0–14 | 6 | 0.5 | `avgSedentaryHours7d` |

**Live label:** Each slider has a live `#simXxxDisplay` that updates `oninput`

**Simulation flow:**
1. Any slider move → 500ms debounce → `runSimulation()`
2. Shows skeleton loading in `#simResult`
3. `POST /api/insights/simulate` with all 5 slider values
4. Response: `{ delta, simulatedScore, simulatedLevel }`
5. Renders result:
   - `↑ 8 pts` or `↓ 12 pts` in red or green (36px, weight 900)
   - "Projected score: **34/100** · Medium"
   - Animated progress bar (0.5s width transition)

---

### 8.5 Recommendations Panel (full width)

**3 tab buttons:**
- `Active (N)` / `Snoozed (N)` / `Done (N)`
- Data from `GET /api/recommendations`

**Each recommendation card (active state):**
- Left border: `basePriority` colour (high=red, moderate=amber, low=green)
- Header row: category icon + "CATEGORY · PRIORITY" uppercase label
- Right: `[Snooze 7d]` + `[Done ✓]` buttons (active only)
- **Title** (15px, weight 700)
- **Why text** (evidence-based rationale, 13px)
- **Family History context** (amber block, only if FH detected):  
  `🧬 [context about why FH makes this more important]`
- **Actions list:** bulleted with `→` prefix
- **[🔬 View evidence]** button → `showEvidencePanel(r.evidenceRefs)` (Popup #2)

**Snooze action:** `PATCH /api/recommendations/:id/snooze` → toast + reload  
**Resolve action:** `PATCH /api/recommendations/:id/resolve` → toast + reload

---

## 9. Tab 4 — Learn

**File:** `public/js/learn.js`  
**API calls on load (parallel):**
- `GET /api/articles`
- `GET /api/recipes`
- `GET /api/glossary`
- `GET /api/activity-guides`

**Loading state:** `learnSkeleton()` placeholder

### 9.1 Sticky Search Header
- "Learn" H1 + subtitle
- **Food search input** (sticky at top, blurred background):
  - Search icon positioned inside input
  - Placeholder: "Search foods by name (e.g. banana, oats…)"
  - `oninput` → `searchFood(value)` with 2-char minimum
  - Results dropdown: `GET /api/diet-search?q=X`
  - Results show: food name, serving size, nutrients (calories, protein, fiber), GI category tag

---

### 9.2 Health Articles Section

**Filter row:** "All" + dynamic category buttons (from seeded article categories)

**Article Cards (2-column grid, first 6 shown, "Show more" button):**
Each card contains:
- **Banner image area** (140px height, gradient bg with category icon):
  - Nutrition → `restaurant` icon, amber gradient
  - Physical Activity → `fitness_center` icon, green gradient
  - Mental Health → `psychology` icon, purple gradient
  - Diabetes Prevention → `health_and_safety` icon, dark green gradient
- **Category badge pill** (colored)
- **Title** (14px, weight 700, max 2 lines)
- **Summary** (12px, 2-line clamp)
- **Reading time** (11px muted) + `→` arrow

**Click → `openArticle(idOrSlug)`:**
- Slides in right-side drawer (fixed, 600px wide, blur backdrop)
- Shows skeleton while loading
- Fetches `GET /api/articles/:idOrSlug`
- Displays: Back button, title, reading time, publish date, full body content
- Close: tap Back button or click outside drawer

**Filter buttons:** `filterArticles(cat)` — client-side filter (no API call)  
**Show more:** loads next 6 articles from `allArticles` cache

---

### 9.3 Healthy Recipes Section

**Filter tabs:** All / low gi / high fibre / vegetarian / low sugar

**Recipe Cards (3-column grid):**
Each card:
- **Banner area** (120px, gradient + 🥗 emoji center)
- **Recipe name** (13px, weight 700)
- **Tag pills** (first 2 tags, color-coded)
- **Nutrition mini-grid** (3 columns): calories / fiber / protein

**Click → `openRecipeModal(recipeId)`:**
- Modal/drawer with: recipe name, full description, ingredients list, instructions, nutrition summary, "Why diabetes-friendly" reasons

**Filter:** `filterRecipes(tag)` — client-side filter

---

### 9.4 Health Glossary Section

**Layout:** Single card, scrollable list  
**Term count label:** "10 terms"

**Each glossary item:**
- Term name (clickable to expand?)
- Short definition
- Related terms list

---

### 9.5 Activity Guides Section

**Layout:** 4-column grid, all guides shown

**Each activity guide card:**
- `activityGuideCard()` — shows:
  - Activity display name (e.g. "Brisk Walking")
  - MET value + recommended duration
  - "Why it helps" 1-liner
  - Click → expands to show beginner tips, intensity guide (light/moderate/vigorous descriptions)

---

## 10. Tab 5 — Settings

**File:** `public/js/settings.js`  
**API calls on load (parallel):**
- `GET /api/profile`
- `GET /api/settings`
- `GET /api/engagement/badges`
- `GET /api/engagement/program`

**Loading state:** Single tall skeleton card

### 10.1 Profile Card (full width)

**Header:**
- 72px avatar circle (gradient green → teal, initials inside)
- Full name + "Member since Month Year"

**Editable fields (2-column grid):**
- First name (`#setFirstName`)
- Last name (`#setLastName`)
- Date of birth (`#setDob`, date input)
- Sex (select: Male / Female / Other)
- Height cm (`#setHeight`)
- Weight kg (`#setWeight`)

**Dietary Preference (pill buttons):**
- balanced / low_carb / vegetarian / vegan / mediterranean / high_protein
- Selected = `pill-green`, unselected = `pill-gray`

**`[💾 Save profile]` button** → `saveProfile()`:
- `PUT /api/profile` with all field values
- Success toast: "Profile saved."

---

### 10.2 Family History Card (locked)

**Shows read-only recorded family history conditions**  
**Lock icon** (🔒) in header — cannot be edited after onboarding consent  
**If consent not given:** "Family history not yet entered or consent not given."

---

### 10.3 Notifications Card

**Two toggle rows:**

1. **Daily reminder** — "Remind me to log today"
   - iOS-style toggle (`#notifToggle`)
   - When ON: shows `#reminderTime` time input (default "20:00")
   - Auto-saves: `onchange="saveSettings()"`

2. **Weekly health report** — "Summary every Monday"
   - Toggle (`#weeklyReportToggle`)
   - Auto-saves on change

**Theme section:**
- `☀️ Light` / `🌙 Dark` pill buttons
- Calls `setTheme(theme)` → `PATCH /api/settings` + applies CSS class

---

### 10.4 Weekly Health Report Card

- "Weekly Health Report" heading
- `[View report]` button → opens **Weekly Report Modal** (Popup #3)
- Description text explaining what the report contains

---

### 10.5 30-Day Challenge Card

**If enrolled (`program.status === 'active'` or `program.currentWeek` exists):**
- "Week X/4" + "X% complete" (right-aligned, green)
- Progress bar: `currentWeek * 25%` width
- "Started: Mar 5, 2026"
- Completed weeks: "✓ Weeks 1, 2, 3 completed" (green)

**If not enrolled:**
- Description: "Build transformative health habits with our 4-week structured path."
- `[Start my 30-day challenge]` → `enrollProgram()` → `POST /api/engagement/program/enroll` → toast + reload

---

### 10.6 Achievements Card (full width)

**6-column badge grid:**

**Earned badges:**
- Green-tinted background, full opacity
- Large emoji (32px) + badge name (11px, green, weight 700)
- Hover tooltip: `earnedMessage`

**Locked badges:**
- Grey background, 50% opacity
- Greyed emoji + locked name
- Hover tooltip: description of how to earn

12 total badges possible (see SYSTEM.md §11 for full list).

---

### 10.7 Export My Data Card (full width)

**Two buttons:**

1. **`[⬇️ Download CSV]`** → `downloadCSV()`:
   - `GET /api/export/csv`
   - Creates blob URL, triggers `<a download>` click
   - Filename: `path2prevention-data-YYYY-MM-DD.csv`
   - Toast: "Preparing your CSV..." → "Downloaded successfully!"

2. **`[📄 Download health report]`** → `downloadPDF()`:
   - `GET /api/export/pdf`
   - Opens `data:text/html` blob in new tab
   - Filename: `path2prevention-report-YYYY-MM-DD.html`
   - Toast: success or error

---

### 10.8 Change Password Card

**Fields:**
- Current password
- New password (min 8 chars)
- Confirm new password

**`[Update password]` button** → `PATCH /api/auth/password`  
**Client validation:** new == confirm before API call  
**Toast on success:** "Password updated successfully."

---

### 10.9 Delete Account Card

**Warning text:** explains data is permanently deleted  
**`[Delete my account]`** → shows confirmation prompt:
- User must type "DELETE" to confirm
- `DELETE /api/account` → clears localStorage → redirects to `/login`

---

## 11. Global Popups & Overlays (5 types)

All managed in `public/js/popups.js`. Each popup has a unique animation.

### Popup #1 — Risk Breakdown Modal

**Trigger:** "Why this level?" button on Dashboard risk card  
**Animation:** Scale-in from 0.94 → 1, spring easing

**Content:**
- Level badge pill: "Medium · 34 / 100"
- Full-width progress bar (animated width)
- **Factor breakdown cards** (one per contributing factor):
  - Factor icon in colored circle
  - Factor name + "+ X pts" (right-aligned, colored)
  - Explanation note (e.g. "7,234 avg/day vs 7,000 target")
- DPP info footer: "Based on the National DPP. Small lifestyle changes can reduce risk by up to 58%."
- Close: ✕ button or click backdrop

**Factor icons:**
| Factor | Icon |
|---|---|
| Family History | `family_history` |
| Physical Activity | `directions_run` |
| BMI | `monitor_weight` |
| Steps | `footprint` |
| Sugary Drinks | `local_drink` |
| Sleep | `bedtime` |
| Fast Food | `restaurant` |
| Sedentary Hours | `chair` |

---

### Popup #2 — Evidence Drawer (right slide-in)

**Trigger:** "🔬 View evidence" button on recommendation cards  
**Animation:** Slides in from right edge (400ms cubic-bezier)  
**Width:** 380px

**Content (after API load):**
- `GET /api/content/evidence?ids=ID1,ID2,...`
- Each study card:
  - Publisher tag (black label)
  - Study title (bold)
  - Snippet text
  - "Read study →" external link

**Fallback (no matched studies):**
- 3 default sources: WHO, ADA, NEJM descriptions (hardcoded in JS)

**Footer disclaimer:** "Evidence is for educational purposes only. Always consult your healthcare professional."

---

### Popup #3 — Weekly Report Modal

**Trigger:** `[View report]` button in Settings  
**API:** `GET /api/insights/weekly-report`

**Content:**
- Date range header: "Mar 10 – Mar 16"
- "Your Weekly Health Snapshot" title
- **Grade circle** (90px, colored) with letter grade (A–F)
- "XX% overall" + "Target: 85%" + animated bar
- **Category score bars** (with trend arrows):
  - For each category: icon, name, score%, `north`/`south`/`horizontal_rule` trend icon
- **Two impact boxes:**
  - 🏆 "Top Win" — best achievement this week
  - 🎯 "Focus Next" — biggest improvement area
- `[Got it →]` close button

**No report state:** If user hasn't logged enough, shows "No report yet" empty state.

---

### Popup #4 — Achievement Celebration Overlay (full screen)

**Trigger:** `engagement.pendingCelebration` returned from dashboard or log save API  
**Animation:** Full-screen green gradient overlay (delayed 800ms on dashboard load)

**Content:**
- 20 confetti pieces (animated fall with random sizes, colors, speeds, delays)
- "ACHIEVEMENT UNLOCKED!" pill badge
- **Badge ring** (130px, breathing pulse animation) + emoji (60px)
- Badge name (36px, weight 900)
- Earn message text (16px)
- `[Keep going →]` button → dismisses overlay

**After dismiss:** `POST /api/engagement/badges/:badgeId/displayed` (marks as shown)

---

### Popup #5 — Very High Risk Warning Modal

**Trigger:** Automatically when `riskScore.internalScore >= 75` on dashboard load  

**Content:**
- Warning icon circle (88px, red, pulsing shadow animation every 2s)
- "Urgent: Very High Risk Detected"
- Explanation paragraph with **Very High Risk** in bold red
- **Important Disclaimer box** (grey, red left border):
  - "Path2Prevention is NOT a substitute for professional clinical diagnosis..."
- `[I understand — Continue]` green button → closes modal
- `[Find a professional near me]` ghost button

**Footer:** "Medical Safety Layer" label + "PRIORITY ALERT" red indicator dot

---

## 12. Toast Notification System

**Container:** `#toastContainer` (fixed, top-right on desktop, top on mobile)

**`showToast(message, type)` — 4 types:**
| Type | Color | Icon | Auto-dismiss |
|---|---|---|---|
| `success` | Green | `check_circle` | 3 seconds |
| `error` | Red | `error` | 5 seconds |
| `info` | Blue/teal | `info` | 3 seconds |
| `warning` | Amber | `warning` | 4 seconds |

**Animation:** Slides in from right + fade, slides back out on dismiss.  
**Multiple toasts:** Stack vertically.

---

## 13. Skeleton Loaders

Every tab shows a shimmer placeholder while API loads.

### Dashboard Skeleton
```
[Title shimmer line (200px)]
[Heading shimmer (300px)]
[Card 220px] [Card 220px] [Card 220px]
[Card 240px (span 2)]  [Card 240px]
```

### Log Tab Skeleton
3-column grid, 3 × 300px shimmer cards

### Insights Skeleton
Full-width 280px card + two 320px cards side by side

### Learn Skeleton
2-column grid of smaller cards

### Settings Skeleton
Single 500px shimmer card

### Article Detail Skeleton
400px skeleton inside the drawer

---

## 14. Error States

**`errorState(message, retryFn)` renders:**
- `wifi_off` icon (40px, muted grey)
- "Something went wrong" heading
- Custom message
- `[Retry]` green button → calls `retryFn`

Used in: Dashboard, Insights, Learn, Settings

---

## 15. Routing & Tab Transitions

**File:** `public/js/router.js`

### Active Tab Tracking
- Last tab stored in `localStorage` key `p2p_lastTab`
- On page load: restores last active tab (default: `dashboard`)

### `switchTab(name)` function
```
1. Hide all .tab-content (remove .active)
2. Show #tab-{name} (.active class)
3. Update sidebar links (.active state)
4. Update bottom nav items (.active state)
5. Save to localStorage
6. Load tab content:
   dashboard → loadDashboard()
   log       → loadLogForm()
   insights  → loadInsights()
   learn     → loadLearn()
   settings  → loadSettings()
```

### Tab Animation
- `.tab-content` base: `display:none; opacity:0; transform:translateY(8px)`
- `.tab-content.active`: `animation: tabFadeIn 0.25s ease forwards`
- `tabFadeIn`: opacity 0→1, translateY 8→0 in 250ms

### Loading Guard
- Each load function checks if tab is still active before rendering (avoids race conditions)

---

## 16. API Communication Layer

**File:** `public/js/api.js`

```javascript
const api = {
  get:    (path)         → fetch(BASE + path, { headers: { Authorization: 'Bearer ' + token } })
  post:   (path, body)   → fetch(..., { method: 'POST', body: JSON.stringify(body) })
  patch:  (path, body)   → fetch(..., { method: 'PATCH', body: JSON.stringify(body) })
  put:    (path, body)   → fetch(..., { method: 'PUT', body: JSON.stringify(body) })
  delete: (path)         → fetch(..., { method: 'DELETE' })
}
```

**Base URL:** same origin (no cross-domain - Express serves both frontend and API)  
**Auth:** JWT from `localStorage.getItem('p2p_token')` injected in every request header  
**Error handling:** Non-2xx responses throw with `response.json().error` message  
**401 handling:** Auto-redirect to `/login` (clears localStorage)

---

## 17. State Management

**File:** `public/js/state.js`

```javascript
const state = {
  dashboardData: null,   // Cached GET /api/dashboard response
  recs: null,            // Cached GET /api/recommendations response
  // other ephemeral state
}
```

- No reactive framework — state is read directly when needed
- `state.dashboardData` updated each time `loadDashboard()` succeeds
- `state.recs` updated each time `loadInsights()` succeeds
- Chart metric switchs use `state.dashboardData.chartData` directly without re-fetch

---

## 18. Responsive Design — Desktop vs Mobile

| Feature | Desktop (>768px) | Mobile (<768px) |
|---|---|---|
| Navigation | Left sidebar (fixed 240px) | Bottom tab bar (fixed, 5 icons) |
| Main layout | Sidebar + content area | Full-width content |
| Dashboard grid | 12-col bento grid | Single column stacked |
| Log form | 2×2 card grid | Single column |
| Insights | 2-col grid | Single column |
| Learn articles | 2-col grid | 2-col (smaller) |
| Learn recipes | 3-col grid | 2-col |
| Settings | 2-col grid | Single column |
| Modals | 520px centered | Full-width, 16px margin |
| Evidence drawer | 380px right-anchored | Full-width bottom sheet |
| Chart tab buttons | Overflow hidden | Horizontal scroll |

---

## 19. All API Calls by Tab

### Dashboard Tab
| API | Method | When |
|---|---|---|
| `/dashboard` | GET | Tab load |

### Log Today Tab
| API | Method | When |
|---|---|---|
| `/logs/daily/:today` | GET | Tab load (pre-fill) |
| `/activity-guides` | GET | Tab load (dropdown) |
| `/logs/daily` | POST | Save button click |
| `/logs/weekly` | POST | Save click (if weight entered) |

### Insights Tab
| API | Method | When |
|---|---|---|
| `/insights/analytics?period=X` | GET | Tab load + period change |
| `/insights/correlations` | GET | Tab load |
| `/recommendations` | GET | Tab load |
| `/recommendations/:id/snooze` | PATCH | Snooze button |
| `/recommendations/:id/resolve` | PATCH | Done button |
| `/insights/simulate` | POST | Slider move (500ms debounced) |

### Learn Tab
| API | Method | When |
|---|---|---|
| `/articles` | GET | Tab load |
| `/recipes` | GET | Tab load |
| `/glossary` | GET | Tab load |
| `/activity-guides` | GET | Tab load |
| `/articles/:idOrSlug` | GET | Article card click |
| `/diet-search?q=X` | GET | Food search (≥2 chars) |

### Settings Tab
| API | Method | When |
|---|---|---|
| `/profile` | GET | Tab load |
| `/settings` | GET | Tab load |
| `/engagement/badges` | GET | Tab load |
| `/engagement/program` | GET | Tab load |
| `/profile` | PUT | Save profile button |
| `/settings` | PATCH | Toggle changes / theme |
| `/engagement/program/enroll` | POST | Start challenge button |
| `/insights/weekly-report` | GET | View report button |
| `/content/evidence?ids=X` | GET | View evidence button |
| `/export/csv` | GET | Download CSV button |
| `/export/pdf` | GET | Download health report button |
| `/auth/password` | PATCH | Update password button |
| `/account` | DELETE | Delete account (confirmed) |
| `/engagement/badges/:id/displayed` | POST | Badge celebration dismiss |

---

## 20. All Interactive Elements & Event Handlers

| Element | Location | Interaction | Handler |
|---|---|---|---|
| Sidebar nav links | Shell | click | `switchTab(tab)` |
| Bottom nav buttons | Shell | click | `switchTab(tab)` |
| Sign out button | Sidebar | click | `logout()` |
| "Why this level?" button | Dashboard | click | `showRiskBreakdown(riskScore)` |
| Chart metric tabs | Dashboard | click | `switchChartMetric(metric)` |
| "View all recs →" link | Dashboard | click | `switchTab('insights')` |
| Risk gauge canvas | Dashboard | (display only) | `renderRiskGauge()` |
| Same as yesterday btn | Log Today | click | Prefill from yesterday's API |
| "−"/"+" counter buttons | Log Today | click | `adjustCounter(id, delta)` |
| Water drop buttons | Log Today | click | `toggleWater(idx)` |
| Mood emoji buttons | Log Today | click | `selectMood(val)` |
| Stress number buttons | Log Today | click | `selectStress(val)` |
| Diet emoji buttons | Log Today | click | `selectDietScore(val)` |
| Sleep slider | Log Today | input | Live label update |
| Sedentary slider | Log Today | input | Live label update |
| Add activity button | Log Today | click | `addActivityRow()` |
| Activity row ✕ button | Log Today | click | Remove activity row |
| Save log button | Log Today | click | `saveLog()` |
| Category tabs (Insights) | Insights | click | `switchInsightCategory(cat)` |
| Period tabs (Insights) | Insights | click | `switchInsightPeriod(period)` |
| Simulator sliders | Insights | input | Live update + `runSimulation()` (500ms debounce) |
| Rec tab buttons | Insights | click | `switchRecTab(tab)` |
| Snooze rec button | Insights | click | `snoozeRec(id)` |
| Resolve rec button | Insights | click | `resolveRec(id)` |
| View evidence button | Insights | click | `showEvidencePanel(refs)` |
| Article cards | Learn | click | `openArticle(idOrSlug)` |
| Article filter buttons | Learn | click | `filterArticles(cat)` |
| Show more articles btn | Learn | click | `showMoreArticles()` |
| Back button in drawer | Learn | click | `closeArticleDrawer()` |
| Article drawer backdrop | Learn | click | `closeArticleDrawer(event)` |
| Recipe cards | Learn | click | `openRecipeModal(recipeId)` |
| Recipe filter buttons | Learn | click | `filterRecipes(tag)` |
| Food search input | Learn | input | `searchFood(value)` |
| Save profile button | Settings | click | `saveProfile()` |
| Diet pref pills | Settings | click | `selectDietPref(d)` |
| Notification toggle | Settings | change | `saveSettings()` |
| Reminder time input | Settings | change | `saveSettings()` |
| Weekly report toggle | Settings | change | `saveSettings()` |
| Theme pills | Settings | click | `setTheme(theme)` |
| View report button | Settings | click | `showWeeklyReport()` |
| Enroll challenge button | Settings | click | `enrollProgram()` |
| Download CSV button | Settings | click | `downloadCSV()` |
| Download PDF button | Settings | click | `downloadPDF()` |
| Update password button | Settings | click | `updatePassword()` |
| Delete account button | Settings | click | `deleteAccount()` |
| Close modal buttons | All modals | click | `closeModal(id)` |
| Modal backdrop | All modals | click outside | `closeModal(id)` |
| Evidence drawer close | Evidence | click | `closeDrawer()` |
| "Keep going" button | Celebration | click | `closeCelebration()` |
| Risk warning buttons | VH Risk | click | `closeModal('riskWarningBackdrop')` |

---

*Path2Prevention Frontend Documentation — March 2026 · v3.0.0*
