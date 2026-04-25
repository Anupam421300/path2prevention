'use strict';
const rateLimit = require('express-rate-limit');

// ───── Rate Limiters ─────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const mainLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2000,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const simulateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Simulator rate limit reached.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, mainLimiter, simulateLimiter };
