'use strict';
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('../src/config/db');

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Connect to MongoDB (cached for serverless)
let dbReady = connectDB().catch(err => console.error('DB connection failed:', err));
app.dbReady = dbReady;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Route imports
const { authMiddleware, authLimiter, mainLimiter } = require('../src/middleware');
app.use('/api/auth', authLimiter, require('../src/routes/auth'));

// JWT gate — all /api/* except /api/auth require authentication
app.use('/api', authMiddleware, mainLimiter);

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

// Page routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/register.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../public/app.html')));

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';
  const message = status === 500 && !isDev ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(status).json({ error: message });
});

// For local dev: node api/index.js
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
