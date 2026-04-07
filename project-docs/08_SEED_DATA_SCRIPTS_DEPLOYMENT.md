# Seed Data, Scripts & Deployment Configuration

---

## 1. Seed Data — `src/data/seedData.js`

### What It Does
Contains ALL the **static content** that gets inserted into MongoDB before any user ever registers. This is the "reference data" the app needs to function.

### Data Categories:

#### EVIDENCE_SOURCES (Research Citations)
```javascript
{
  sourceId: 'DPP_2002',
  title: 'Diabetes Prevention Program',
  year: 2002,
  journal: 'NEJM',
  url: 'https://...',
  summary: '...'
}
```
These are the scientific studies that justify the recommendations. When a recommendation says "Based on DPP research," it links to one of these.

#### TIPS (Daily Health Tips)
~50+ tips rotated daily. Each has:
- `text`: The tip content
- `category`: "activity", "nutrition", "sleep", etc.
- `tipId`: Unique identifier

Tips are shown on the dashboard. The backend selects today's tips using `getDayOfYear()` to rotate them deterministically.

#### ACTIVITY_GUIDES
Exercise type definitions:
```javascript
{
  type: 'walking',
  displayName: 'Walking',
  moderateMultiplier: 1.0,    // Moderate: 1× minutes
  vigorousMultiplier: 2.0,    // Vigorous: 2× minutes
  lightMultiplier: 0.5        // Light: 0.5× minutes
}
```
These multipliers are used by the daily log to convert activity minutes to "moderate-equivalent minutes."

#### RULES (Recommendation Engine Rules)
Static rules are exported directly via `src/data/seedData.js` as `RULES` rather than being seeded into the database.
```javascript
{
  ruleId: 'STEPS_LOW',
  category: 'Steps',
  title: 'Increase your daily steps',
  trigger: [{ signal: 'avgSteps7d', op: 'lt', value: 5000 }],
  resolve: [{ signal: 'avgSteps7d', op: 'gte', value: 6000 }],
  basePriority: 70,
  why: 'Less than 5,000 steps/day is associated with...',
  actions: ['Walk for 15 minutes after each meal', ...],
  evidenceRefs: ['DPP_2002'],
  familyHistoryBoost: 10,
  isSafetyAlert: false
}
```

**Rule structure:**
- `trigger`: Conditions that ACTIVATE this recommendation (e.g., `avgSteps7d < 5000`)
- `resolve`: Conditions that AUTO-RESOLVE it (e.g., `avgSteps7d >= 6000`)
- `basePriority`: Default importance score (higher = shown first)
- `familyHistoryBoost`: Extra priority points if user has family history
- `isSafetyAlert`: If `true`, this rule creates a SAFETY ALERT that overrides all others

---

## 2. Scripts Reference

### `scripts/seed.js` — Database Seeder

**Command:** `node scripts/seed.js`

**What it does:**
1. Connects to MongoDB
2. For each data category (Evidence Sources, Tips, Activity Guides):
   - Loops through each item
   - Uses `findOneAndUpdate` with `upsert: true` → insert if new, update if exists
3. Prints success count per model

**Safe to run multiple times:** `upsert: true` means it won't create duplicates.

### `scripts/clearUsers.js` — User Data Wiper

**Command:** `npm run clear`

**What it does:**
1. Connects to MongoDB
2. Calls `deleteMany({})` on ALL 15 user-related collections
3. Does NOT touch seed data (tips, articles, recipes, etc.)

**Use case:** Testing, demo resets, development cleanup.

### `scripts/seedTestData.js` — Test User Creator

**What it does:**
Creates a test user with pre-filled:
- Profile (name, DOB, height, weight, family history)
- 30+ days of daily logs with realistic data
- Risk scores
- Onboarding complete

**Use case:** Demo purposes, development testing.

---

## 3. Deployment Configuration

### `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"        // Build as Node.js serverless function
    },
    {
      "src": "public/**",
      "use": "@vercel/static"      // Serve as static files
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },     // All /api/* → serverless function
    { "src": "/login", "dest": "/public/login.html" },    // /login → static HTML
    { "src": "/register", "dest": "/public/register.html" },
    { "src": "/app", "dest": "/public/app.html" },
    { "src": "/(.*)", "dest": "/public/$1" },             // All other → static files
    { "src": "/(.*)", "dest": "/public/login.html" }      // Fallback → login
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, max-age=0" }  // Never cache API
      ]
    },
    {
      "source": "/(css|js|images)/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }  // Cache static assets for 1 year
      ]
    }
  ]
}
```

**How Vercel deployment works:**
1. `git push` to your repo
2. Vercel detects the push → runs build
3. `api/index.js` becomes an AWS Lambda function
4. `public/*` files are served from a CDN edge
5. Routes map URLs to handlers

**Key caching strategy:**
- API responses: NEVER cached (always fresh)
- Static assets (CSS/JS/images): Cached for 1 year (immutable)
- To bust the cache: change the file content (Vercel auto-hashes)

### `package.json` — Project Configuration

```json
{
  "name": "path2prevention",
  "version": "1.0.0",
  "scripts": {
    "start": "node api/index.js",              // Production start
    "dev": "nodemon api/index.js",             // Dev with auto-restart
    "clear": "node scripts/clearUsers.js"      // Clear user data
  },
  "engines": {
    "node": ">=18.0.0"                          // Requires Node.js 18+
  }
}
```

### `.env.example` — Environment Template

```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5000
RISK_THRESHOLD_MEDIUM=25
RISK_THRESHOLD_HIGH=50
RISK_THRESHOLD_VERY_HIGH=75
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@...
```

### `.gitignore` — Files NOT in Git

```
node_modules/        # Dependencies (huge, re-installable)
.env                 # Secrets (NEVER commit)
.vercel/             # Vercel local config
*.log                # Log files
```

---

## 4. How to Run the Project

### Local Development:

```bash
# 1. Clone the repo
git clone <repo-url>
cd path2prevention

# 2. Install dependencies
npm install

# 3. Create .env file (copy from .env.example, fill in values)
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. Seed the database
node scripts/seed.js

# 5. Start development server
npm run dev
# → Server runs on http://localhost:5000

# 6. Open in browser
# http://localhost:5000/register → create account
# http://localhost:5000/login → login
# http://localhost:5000/app → main app
```

### Deploy to Vercel:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# (Settings → Environment Variables)
```
