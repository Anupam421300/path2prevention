'use strict';
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

// ───── Auth Middleware ─────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ───── Validation Middleware ─────
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const detailsStr = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({
          error: `Validation failed: ${detailsStr}`,
          details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
}

// ───── Rate Limiters ─────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for multiple users on same IP
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const mainLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2000, // Increased for multiple concurrent users
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

const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'PDF export limit (3 per hour) reached.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authMiddleware, validate, authLimiter, mainLimiter, simulateLimiter, pdfLimiter };
