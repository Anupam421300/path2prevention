'use strict';
// Re-export all middleware from individual files for backward compatibility.
// Usage: const { authMiddleware, validate, authLimiter } = require('../middleware');

const { authMiddleware } = require('./auth');
const { validate } = require('./validate');
const { authLimiter, mainLimiter, simulateLimiter } = require('./rateLimiters');

module.exports = { authMiddleware, validate, authLimiter, mainLimiter, simulateLimiter };
