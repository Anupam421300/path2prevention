'use strict';
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User, Profile, Settings } = require('../models');
const { validate } = require('../middleware');
const { authMiddleware } = require('../middleware');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

function issueToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, firstName } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), passwordHash });

    // Create empty profile and settings
    await Profile.create({ userId: user._id, firstName });
    await Settings.create({ userId: user._id });

    const token = issueToken(user);
    res.status(201).json({
      token,
      user: { userId: user._id, email: user.email, firstName, onboardingComplete: false },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const profile = await Profile.findOne({ userId: user._id });
    const token = issueToken(user);
    res.json({
      token,
      user: {
        userId: user._id,
        email: user.email,
        firstName: profile?.firstName || '',
        onboardingComplete: profile?.onboardingComplete || false,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const profile = await Profile.findOne({ userId: user._id });
    res.json({
      userId: user._id,
      email: user.email,
      firstName: profile?.firstName || '',
      onboardingComplete: profile?.onboardingComplete || false,
      consentAccepted: profile?.consentAccepted || false,
    });
  } catch (err) { next(err); }
});

// PATCH /api/auth/password
router.patch('/password', authMiddleware, validate(passwordSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

module.exports = router;
