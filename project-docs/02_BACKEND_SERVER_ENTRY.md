# Backend Server Entry Point — `api/index.js`

## What Is This File?

This is the **main entry point** of the entire server application. When you run `npm start` or `npm run dev`, Node.js executes THIS file. It:

1. Loads environment variables
2. Creates an Express HTTP server
3. Applies security middleware
4. Connects to MongoDB
5. Mounts all API routes
6. Serves frontend HTML files
7. Handles errors
8. Starts listening for requests

---

## Line-by-Line Breakdown

### Lines 1-8: Imports

```javascript
'use strict';                                          // Line 1: Enables strict mode — catches coding mistakes (e.g. undeclared variables)
require('dotenv').config();                             // Line 2: Loads .env file → makes process.env.MONGODB_URI etc. available
const express = require('express');                     // Line 3: Import Express framework — the HTTP server library
const helmet = require('helmet');                       // Line 4: Security headers library
const cors = require('cors');                           // Line 5: Cross-Origin Resource Sharing middleware
const mongoSanitize = require('express-mongo-sanitize');// Line 6: Prevents NoSQL injection attacks
const morgan = require('morgan');                       // Line 7: HTTP request logger (prints "GET /api/dashboard 200 45ms" in console)
const path = require('path');                           // Line 8: Node.js built-in — helps construct file paths correctly across OS
const { connectDB } = require('../src/config/db');      // Line 9: Our custom MongoDB connection function
```

**Why these imports?**
- `dotenv.config()` MUST be called before anything that reads `process.env` — it loads the `.env` file
- `path` is needed because file paths use `\` on Windows but `/` on Linux. `path.join()` handles this automatically

### Line 11: Create Express App

```javascript
const app = express();    // Creates the Express application instance
```

This `app` object IS the server. Everything else (routes, middleware, error handlers) gets attached to it.

### Lines 13-18: Security Middleware Stack

```javascript
app.use(helmet({ contentSecurityPolicy: false }));      // Line 14
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', credentials: true })); // Line 15
app.use(express.json({ limit: '1mb' }));                // Line 16
app.use(mongoSanitize());                               // Line 17
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev')); // Line 18
```

| Line | What It Does | Why |
|------|-------------|-----|
| 14 | Sets security HTTP headers (X-Frame-Options, X-XSS-Protection, etc.) | Prevents common web attacks. `contentSecurityPolicy: false` is disabled because inline styles are used |
| 15 | Allows requests from the frontend domain | Without CORS, browsers block cross-origin API calls. `'*'` means "allow from anywhere" (used in dev) |
| 16 | Parses JSON request bodies, max 1MB | Without this, `req.body` would be `undefined`. 1MB limit prevents huge payloads |
| 17 | Strips `$` and `.` from request body | Prevents MongoDB query injection like `{"email": {"$gt": ""}}` |
| 18 | Logs every HTTP request in dev mode | Shows `GET /api/dashboard 200 45ms` — crucial for debugging. Disabled in production for performance |

**⚠️ Order matters!** Middleware runs in the order it's added. Security headers → CORS → Body parsing → Sanitization → Logging.

### Lines 20-32: Database Connection

```javascript
let dbReady = connectDB().catch(err => console.error('DB connection failed:', err)); // Line 21
app.dbReady = dbReady;                                  // Line 22

app.use('/api', async (req, res, next) => {             // Lines 25-32
  try {
    await app.dbReady;                                  // Wait for DB to be ready
    next();                                             // Continue to route handler
  } catch (err) {
    next(err);                                          // Pass error to error handler
  }
});
```

**Why is this complex?**
- On Vercel (serverless), the server spins up fresh for each request
- The DB connection is **cached globally** (see `db.js`) so it only connects once
- `await app.dbReady` ensures the DB is connected BEFORE any API route runs
- Without this, routes might execute while MongoDB is still connecting → crash

### Line 35: Static File Serving

```javascript
app.use(express.static(path.join(__dirname, '../public')));
```

This makes EVERY file in the `public/` folder accessible via URL:
- `/css/main.css` → serves `public/css/main.css`
- `/js/api.js` → serves `public/js/api.js`
- `/images/logo!.jpeg` → serves `public/images/logo!.jpeg`

### Lines 37-53: Route Mounting

```javascript
const { authMiddleware, authLimiter, mainLimiter } = require('../src/middleware');

// PUBLIC routes (no JWT required):
app.use('/api/auth', authLimiter, require('../src/routes/auth'));

// PROTECTED routes (JWT required):
app.use('/api', authMiddleware, mainLimiter);   // ← This line is the JWT gate!

app.use('/api/profile', require('../src/routes/profile'));
app.use('/api/settings', require('../src/routes/settings'));
app.use('/api/logs', require('../src/routes/logs'));
app.use('/api/dashboard', require('../src/routes/dashboard'));
app.use('/api/insights', require('../src/routes/insights'));
app.use('/api/recommendations', require('../src/routes/recommendations'));
app.use('/api/engagement', require('../src/routes/engagement'));
app.use('/api/export', require('../src/routes/export'));
app.use('/api', require('../src/routes/content'));
app.use('/api', require('../src/routes/account'));
```

**Critical concept: Line 42 is the JWT gate.**

- `/api/auth/*` routes come BEFORE the JWT gate → anyone can call them (register, login)
- Line 42 applies `authMiddleware` to ALL `/api/*` routes AFTER it → requires valid JWT token
- If you don't have a valid token, any request to `/api/profile`, `/api/logs`, etc. returns `401 Unauthorized`

**Route prefix mapping:**
| URL Pattern | Route File | Example Endpoints |
|-------------|-----------|-------------------|
| `/api/auth/*` | `auth.js` | `POST /api/auth/register`, `POST /api/auth/login` |
| `/api/profile/*` | `profile.js` | `GET /api/profile`, `PUT /api/profile` |
| `/api/logs/*` | `logs.js` | `POST /api/logs/daily`, `GET /api/logs/daily/2026-04-06` |
| `/api/dashboard` | `dashboard.js` | `GET /api/dashboard` |
| `/api/insights/*` | `insights.js` | `GET /api/insights/analytics?period=30` |
| `/api/recommendations/*` | `recommendations.js` | `PATCH /api/recommendations/:id/snooze` |
| `/api/engagement/*` | `engagement.js` | `POST /api/engagement/program/enroll` |
| `/api/export/*` | `export.js` | `GET /api/export/csv`, `GET /api/export/pdf` |
| `/api/*` | `content.js` | `GET /api/articles`, `GET /api/recipes` |
| `/api/*` | `account.js` | `POST /api/feedback`, `DELETE /api/account` |

### Lines 55-61: Page Routes & SPA Fallback

```javascript
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/register.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../public/app.html')));

// SPA fallback — any unknown URL shows login page
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
```

If someone visits `https://yourapp.com/login`, the server sends the `login.html` file.
The `*` wildcard catches any URL not matched — sends the login page (prevents 404 errors).

### Lines 63-70: Global Error Handler

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';
  const message = status === 500 && !isDev ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(status).json({ error: message });
});
```

**When any route calls `next(err)`, this handler catches it.**
- In production: hides error details from users (security)
- In development: shows the full error message (debugging)
- Always logs the full error stack trace to console

### Lines 72-78: Local Development Server

```javascript
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

- `require.main === module` checks: "Was this file run directly?" (not imported)
- If you do `node api/index.js`, it starts listening on port 5000
- On Vercel, this file is **imported** (not run directly), so the `if` block doesn't execute — Vercel handles the server itself
- `module.exports = app` exports the Express app so Vercel can use it as a serverless function

---

## How to Change Things

| Want to... | Change this |
|-----------|-------------|
| Add a new API route file | Create file in `src/routes/`, add `app.use('/api/newroute', require('../src/routes/newroute'));` after line 42 |
| Make a route public (no login) | Add it BEFORE line 42 (before `authMiddleware`) |
| Change the port | Set `PORT` in `.env` file |
| Disable CORS | Remove line 15 or change `origin` to specific domain |
| Add more body size limit | Change `{ limit: '1mb' }` on line 16 |
| Add new security headers | Configure `helmet()` options on line 14 |

---

## Connection Map

```
api/index.js
  ├── imports → src/config/db.js (database connection)
  ├── imports → src/middleware/index.js (auth, validation, rate limiting)
  ├── mounts → src/routes/auth.js
  ├── mounts → src/routes/profile.js
  ├── mounts → src/routes/settings.js
  ├── mounts → src/routes/logs.js
  ├── mounts → src/routes/dashboard.js
  ├── mounts → src/routes/insights.js
  ├── mounts → src/routes/recommendations.js
  ├── mounts → src/routes/engagement.js
  ├── mounts → src/routes/export.js
  ├── mounts → src/routes/content.js
  └── mounts → src/routes/account.js
```
