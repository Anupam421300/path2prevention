# Security Architecture & Data Flow

---

## Security Layers

The application implements **6 layers of security:**

### Layer 1: Password Hashing (bcryptjs)

```
User enters: "MyPassword123"
            ↓
bcrypt.hash("MyPassword123", 12)           // 12 salt rounds
            ↓
Stored in DB: "$2a$12$LJ3GY.Iq5JxRW.qi8hkOx.gD..." // 60-char irreversible hash
```

- **Salt rounds = 12** means bcrypt runs 2¹² = 4,096 iterations
- Each hash is unique (even for same password) due to random salt
- **Cannot be reversed** — only way to "check" is to hash the input and compare
- If database is stolen, passwords are safe

### Layer 2: JWT Authentication

```
Login:
  User sends email + password → server verifies → creates JWT token
  Token = base64(header).base64(payload).signature
         ↓
  Payload contains: { userId: "abc123", email: "user@example.com", iat: 1712345678, exp: 1712950478 }
         ↓
  Signature = HMAC-SHA256(header + payload, JWT_SECRET)
         ↓
  Only the server can create valid signatures (knows JWT_SECRET)

Every subsequent request:
  Client sends: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
         ↓
  Server verifies signature → extracts userId → attaches as req.userId
```

**Token lifetime:** `JWT_EXPIRES_IN` (default 7 days). After expiry → user must login again.

### Layer 3: HTTP Security Headers (Helmet)

Helmet sets these headers automatically:

| Header | What It Does |
|--------|-------------|
| `X-Content-Type-Options: nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options: DENY` | Prevents clickjacking (embedding in iframe) |
| `X-XSS-Protection: 1; mode=block` | Enables browser XSS filter |
| `Strict-Transport-Security` | Forces HTTPS |
| `Referrer-Policy: no-referrer` | Hides referrer info |

### Layer 4: CORS (Cross-Origin Resource Sharing)

```javascript
cors({ origin: process.env.ALLOWED_ORIGIN || '*', credentials: true })
```

- In production: Only `ALLOWED_ORIGIN` (your domain) can call the API
- Other domains trying to call your API → blocked by browser
- `credentials: true` allows cookies/auth headers to be sent

### Layer 5: NoSQL Injection Prevention (express-mongo-sanitize)

**Attack example:**
```json
// Malicious request body:
{ "email": { "$gt": "" }, "password": { "$gt": "" } }
```
Without sanitization, this could match ANY user in MongoDB.

**Protection:** `mongoSanitize()` strips `$` and `.` from request body/query → the attack becomes harmless string characters.

### Layer 6: Rate Limiting

| Limiter | Max Requests | Time Window | Purpose |
|---------|-------------|-------------|---------|
| `authLimiter` | 1,000 | 15 minutes | Prevents brute-force login |
| `mainLimiter` | 2,000 | 1 minute | Prevents API abuse |
| `simulateLimiter` | 60 | 1 minute | CPU-heavy endpoint protection |
| `pdfLimiter` | 3 | 1 hour | Expensive PDF generation |

---

## Data Flow Diagrams

### Registration Flow:

```
Browser                          Server                         MongoDB
  │                                │                               │
  │ POST /api/auth/register        │                               │
  │ { email, password, firstName } │                               │
  │ ─────────────────────────────→ │                               │
  │                                │ 1. Check email exists?         │
  │                                │ ── User.findOne({email}) ────→ │
  │                                │ ←──── null (not found) ────── │
  │                                │                               │
  │                                │ 2. Hash password               │
  │                                │ bcrypt.hash(password, 12)     │
  │                                │                               │
  │                                │ 3. Create User                │
  │                                │ ── User.create({...}) ──────→ │
  │                                │ 4. Create Profile              │
  │                                │ ── Profile.create({...}) ───→ │
  │                                │ 5. Create Settings             │
  │                                │ ── Settings.create({...}) ──→ │
  │                                │                               │
  │                                │ 6. Sign JWT token             │
  │          { token, user }       │ jwt.sign({userId, email})     │
  │ ←───────────────────────────── │                               │
  │                                │                               │
  │ localStorage.p2p_token = token │                               │
  │ redirect → /app               │                               │
```

### Daily Log Flow:

```
Browser                          Server                         MongoDB
  │                                │                               │
  │ POST /api/logs/daily           │                               │
  │ { date, steps, sleep, ... }    │                               │
  │ (+ Auth: Bearer <JWT>)         │                               │
  │ ─────────────────────────────→ │                               │
  │                                │ 1. authMiddleware              │
  │                                │    verify JWT → req.userId    │
  │                                │                               │
  │                                │ 2. Zod validate body          │
  │                                │                               │
  │                                │ 3. Calculate moderate-eq mins │
  │                                │    for each activity          │
  │                                │                               │
  │                                │ 4. Check if locked            │
  │                                │ ── DailyLog.findOne() ──────→ │
  │                                │ ←──── (not locked) ────────── │
  │                                │                               │
  │                                │ 5. Save + lock atomically    │
  │                                │ ── findOneAndUpdate({        │
  │                                │      lockedAt: new Date()    │
  │                                │    }) ──────────────────────→ │
  │                                │                               │
  │                                │ 6. Run PIPELINE               │
  │                                │ ──────────────────────────→   │
  │                                │   normalizeInputs()           │
  │                                │   computeMetrics()             │
  │                                │   computeRiskIndex()           │
  │                                │   buildRecommendations()      │
  │                                │   computeCorrelations()       │
  │                                │   computeTrajectory()         │
  │                                │   evaluateEngagement()        │
  │                                │   ← Save all results ──────→ │
  │                                │                               │
  │ { log, riskScore, engagement } │                               │
  │ ←───────────────────────────── │                               │
  │                                │                               │
  │ updateSidebarRisk()            │                               │
  │ showRiskDelta toast            │                               │
  │ lockForm()                     │                               │
  │ forceTabRefresh('dashboard')   │                               │
```

### Dashboard Load Flow:

```
Browser                          Server                         MongoDB
  │                                │                               │
  │ GET /api/dashboard             │                               │
  │ (+ Auth: Bearer <JWT>)         │                               │
  │ ─────────────────────────────→ │                               │
  │                                │ Promise.all([                  │
  │                                │   Goal.findOne()               │
  │                                │   RiskScore.findOne() latest  │
  │                                │   RiskTrajectory.findOne()    │
  │                                │   CorrelationSnapshot.find()  │
  │                                │   Recommendation.find() top15 │
  │                                │   StreakRecord.findOne()       │
  │                                │   UserProgram.findOne()       │
  │                                │   DailyLog.find() last 7     │
  │                                │   WeeklyMeasure.find() last 8 │
  │                                │   DailyLog.findOne() today   │
  │                                │   RiskScore.findOne() first  │
  │                                │   Recommendation.find() res. │
  │                                │   Tip.find()                 │
  │                                │ ])                            │
  │                                │ ←─────── ALL AT ONCE ──────── │
  │                                │                               │
  │  { greeting, riskScore,        │ Build response object         │
  │    metrics, goals, recs,       │                               │
  │    engagement, trajectory,     │                               │
  │    chartData, tips, ... }      │                               │
  │ ←───────────────────────────── │                               │
  │                                │                               │
  │ buildDashboardHTML()           │                               │
  │ renderRiskGauge()              │                               │
  │ renderDashboardChart()         │                               │
```

---

## What Data Is Stored Where?

### In MongoDB (Server):
- User credentials (email, password hash)
- Profile data (name, DOB, height, family history)
- ALL daily logs (every day's health data)
- ALL risk scores (historical record)
- Recommendations, goals, streaks
- Correlation snapshots, trajectories

### In localStorage (Browser):
- `p2p_token` — JWT token string
- `p2p_user` — `{userId, email, firstName, onboardingComplete}` JSON

### In Memory (Browser session):
- `window.state` — current tab data, dashboard cache
- `window.APP` — last risk score for delta calculation
- Chart.js instances
- Activity guides cache

### NOT Stored Anywhere:
- Plain-text passwords (hashed immediately)
- Raw request/response data (GC'd by JavaScript)

---

## Input Validation Summary

| Endpoint | Validation Library | Validated Fields |
|----------|-------------------|-----------------|
| POST /auth/register | Zod | email (valid format), password (min 8 chars), firstName (min 1) |
| POST /auth/login | Zod | email, password |
| POST /logs/daily | Zod | date, steps (0-50000), sleepHours (0-24), waterGlasses (0-20), activities array |
| PUT /profile | Manual | firstName, lastName, dob, sex (enum), heightCm, weightKg |
| POST /insights/simulate | Zod | All slider values with min/max ranges |
| PATCH /auth/password | Manual | currentPassword, newPassword (min 8) |
| Various | MongoDB Schema | Schema-level validation (min/max, enums, required fields) |

**Triple validation:** Input is validated at 3 levels:
1. **Frontend** — HTML input `min`/`max`/`type` attributes
2. **Middleware** — Zod schema validation
3. **Database** — Mongoose schema validation
