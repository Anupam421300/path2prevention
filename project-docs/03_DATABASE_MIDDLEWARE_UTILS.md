# Database, Middleware & Utilities — Deep Dive

---

## 1. Database Connection — `src/config/db.js`

### What It Does
Connects the app to MongoDB Atlas (cloud database). Uses a **caching pattern** critical for Vercel serverless.

### Line-by-Line

```javascript
'use strict';
const mongoose = require('mongoose');               // MongoDB ODM library

let cached = global.mongooseCache;                  // Line 4: Check if a global cache exists
if (!cached) cached = global.mongooseCache = { conn: null, promise: null }; // Line 5: Create cache if not
```

**Lines 4-5: The Serverless Cache Pattern**
- On Vercel, each request MIGHT spin up a new server instance (called "cold start")
- But sometimes, the SAME instance handles multiple requests (called "warm")
- `global.mongooseCache` survives between requests on the SAME instance
- Without this, every request would open a NEW database connection → crashes MongoDB with too many connections

```javascript
async function connectDB() {
  if (cached.conn) return cached.conn;              // Line 8: If already connected, reuse it

  if (!cached.promise) {                            // Line 10: If no connection attempt in progress
    const uri = process.env.MONGODB_URI;            // Line 11: Read connection string from .env
    if (!uri) throw new Error('MONGODB_URI environment variable not set'); // Line 12

    cached.promise = mongoose.connect(uri, {        // Line 14: Start connecting
      serverSelectionTimeoutMS: 15000,              // Line 15: Wait max 15 seconds to find server
    }).then((m) => {
      console.log('MongoDB connected');             // Line 17: Log success
      return m;
    });
  }

  cached.conn = await cached.promise;               // Line 22: Wait for connection to complete
  return cached.conn;                               // Line 23: Return the connection
}

module.exports = { connectDB };                     // Line 26: Export for use in api/index.js
```

**How the cache works:**

| Scenario | What Happens |
|----------|-------------|
| First request (cold start) | `cached.conn` is null → creates new connection promise → awaits → stores in cache |
| Second request (warm) | `cached.conn` exists → returns immediately (no new connection) |
| Connection fails | Error thrown → caught in `api/index.js` |

**To change:** If you need a different timeout, change `serverSelectionTimeoutMS` on line 15.

---

## 2. Middleware — `src/middleware/index.js`

### What It Does
Provides reusable functions that run BEFORE route handlers. Three types:
1. **authMiddleware** — Verifies JWT tokens (login check)
2. **validate** — Validates request body with Zod schemas
3. **Rate Limiters** — Prevents abuse (too many requests)

### Authentication Middleware (Lines 7-21)

```javascript
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;     // Line 8: Read "Authorization" header
  if (!authHeader || !authHeader.startsWith('Bearer ')) { // Line 9: Check format
    return res.status(401).json({ error: 'Authentication required' }); // Line 10: No token → reject
  }
  const token = authHeader.split(' ')[1];           // Line 12: Extract token from "Bearer <token>"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Line 14: Verify + decode token
    req.userId = decoded.userId;                    // Line 15: Attach userId to request
    req.userEmail = decoded.email;                  // Line 16: Attach email to request
    next();                                         // Line 17: Continue to route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' }); // Line 19: Bad token → reject
  }
}
```

**How JWT auth works step by step:**

1. User logs in → server creates a JWT token containing `{userId: "abc123", email: "user@example.com"}`
2. Token is signed with `JWT_SECRET` — only our server can create valid tokens
3. Frontend stores token in `localStorage`
4. Every API request sends: `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`
5. This middleware verifies the signature → extracts `userId` → attaches to `req.userId`
6. Route handler uses `req.userId` to know WHO is making the request

**Security:** If someone tampers with the token, `jwt.verify()` throws → 401 Unauthorized.

### Validation Middleware (Lines 24-39)

```javascript
function validate(schema) {                         // Line 24: Takes a Zod schema
  return (req, res, next) => {                      // Line 25: Returns a middleware function
    try {
      req.body = schema.parse(req.body);            // Line 27: Validate + transform body
      next();                                       // Line 28: Valid → continue
    } catch (err) {
      if (err instanceof z.ZodError) {              // Line 30: If validation error
        const detailsStr = err.errors.map(e =>      // Line 31: Build error message
          `${e.path.join('.')}: ${e.message}`
        ).join(', ');
        return res.status(400).json({               // Line 32: Return 400 Bad Request
          error: `Validation failed: ${detailsStr}`,
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
        });
      }
      next(err);                                    // Line 38: Non-Zod error → pass to error handler
    }
  };
}
```

**Usage example:** In `auth.js`: `router.post('/register', validate(registerSchema), handler)`
- First `validate()` checks the body matches the schema
- If email is missing or password < 8 chars → returns 400 error with details
- If valid → `next()` passes to the actual handler

### Rate Limiters (Lines 42-73)

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 1000,                    // Max 1000 requests per 15 min per IP
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
  standardHeaders: true,        // Sends RateLimit-* headers in response
  legacyHeaders: false,         // Don't send X-RateLimit-* headers
});

const mainLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 2000,                    // Max 2000 requests per minute per IP
  message: { error: 'Too many requests. Please slow down.' },
});

const simulateLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 60,                      // Max 60 simulations per minute (prevent abuse)
});

const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,     // 1 hour
  max: 3,                        // Only 3 PDF exports per hour (expensive operation)
});
```

| Limiter | Where Used | Why |
|---------|-----------|-----|
| `authLimiter` | `/api/auth/*` routes | Prevents brute-force login attacks |
| `mainLimiter` | All other `/api/*` routes | Prevents general API abuse |
| `simulateLimiter` | `/api/insights/simulate` | What-If simulator is CPU-intensive |
| `pdfLimiter` | `/api/export/pdf` | PDF generation is server-heavy |

---

## 3. Utility Functions — `src/utils/index.js`

### What It Does
Pure helper functions used across the backend. No database access, no side effects.

### Date Utilities

```javascript
function getTodayString() {                         // Returns today as "2026-04-06"
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {                   // "2026-04-06" + (-7) = "2026-03-30"
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysDiff(dateStrA, dateStrB) {              // "2026-04-06" - "2026-04-01" = 5
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

function getWeekStart(dateStr) {                    // Returns Monday of the week
  const d = new Date(dateStr);
  const day = d.getDay();                           // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
```

### Math Utilities

```javascript
function avg(arr) {                                 // Average of array: [3,5,7] → 5
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function sum(arr) {                                 // Sum of array: [3,5,7] → 15
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0);
}

function stdDev(arr) {                              // Standard deviation (spread measure)
  if (!arr || arr.length < 2) return 0;
  const mean = avg(arr);
  const sqDiffs = arr.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(avg(sqDiffs));
}
```

### Health Calculations

```javascript
function computeBMI(weightKg, heightCm) {           // BMI = weight / height²
  if (!weightKg || !heightCm || heightCm === 0) return 0;
  const heightM = heightCm / 100;                   // Convert cm to meters
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10; // Round to 1 decimal
}
// Example: 70kg, 170cm → 70 / (1.7 * 1.7) = 70 / 2.89 = 24.2

function computeAge(dob) {                          // Calculates current age from DOB
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--; // Not had birthday yet
  return age;
}
```

### Statistical Correlation

```javascript
function pearsonR(xs, ys) {                         // Pearson correlation coefficient (-1 to +1)
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { r: 0, n: 0 };                // Need at least 3 data points

  // ... calculates how strongly two variables are related
  // r = +1: perfect positive correlation (more sleep = more steps)
  // r = -1: perfect negative correlation (more stress = less sleep)
  // r = 0: no correlation
  // Used by pipeline Step 7 to find patterns between health signals
}
```

### Other Helpers

```javascript
function scoreToGrade(score) {                      // Maps 0-100 to A/B/C/D grade
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function getGreeting(firstName) {                   // Time-based greeting
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  return `Good ${time}, ${firstName || 'there'}!`;  // "Good morning, Priya!"
}

function getDayOfYear() {                           // 1-365 — used for rotating daily tips
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function escapeHTML(str) {                          // Prevents XSS attacks in HTML output
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')                         // & → &amp;
    .replace(/</g, '&lt;')                          // < → &lt;
    .replace(/>/g, '&gt;')                          // > → &gt;
    .replace(/"/g, '&quot;')                        // " → &quot;
    .replace(/'/g, '&#039;');                       // ' → &#039;
}
```

---

## Connection Map

```
src/config/db.js
  └── Used by: api/index.js, scripts/seed.js, scripts/clearUsers.js, scripts/import_rules.js

src/middleware/index.js
  └── Used by: api/index.js (mounting), src/routes/auth.js, src/routes/profile.js,
               src/routes/settings.js, src/routes/logs.js, src/routes/insights.js, etc.

src/utils/index.js
  └── Used by: src/routes/logs.js, src/routes/dashboard.js, src/routes/insights.js,
               src/routes/export.js, src/services/compute/pipeline.js
```
