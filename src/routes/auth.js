'use strict';
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User, Profile } = require('../models');
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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
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

    // Create empty profile
    await Profile.create({ userId: user._id, firstName });

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
    if (!user) return res.status(401).json({ error: 'Email not found in our system' });

    // Check if account is currently locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Account locked. Try again in ${waitMinutes} minute(s).` });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      let errorMsg = 'Incorrect password';
      let statusCode = 401;
      
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 10 * 60 * 1000; // 10 minutes
        errorMsg = 'Account locked for 10 minutes due to too many failed attempts.';
        statusCode = 429;
      } else if (user.failedLoginAttempts === 4) {
        errorMsg = 'Incorrect password. Warning: 1 attempt remaining before your account is temporarily locked.';
      }
      
      await user.save();
      return res.status(statusCode).json({ error: errorMsg });
    }

    // Reset lock logic on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

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

// POST /api/auth/verify-dob — verify identity without changing password (Step 1 of forgot password flow)
router.post('/verify-dob', async (req, res, next) => {
  try {
    const { email, dob } = req.body;
    if (!email || !dob) return res.status(400).json({ error: 'Email and date of birth are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Date of birth does not match. Please enter the correct date of birth.' });

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile || !profile.dob) {
      return res.status(400).json({ error: 'Date of birth does not match. Please enter the correct date of birth.' });
    }

    const storedDob = new Date(profile.dob).toISOString().split('T')[0];
    if (storedDob !== dob) {
      return res.status(400).json({ error: 'Date of birth does not match. Please enter the correct date of birth.' });
    }

    res.json({ verified: true });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password (public — no JWT required)
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email, dob, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return same error for invalid email — prevents email enumeration
    if (!user) return res.status(400).json({ error: 'Date of birth does not match. Please enter the correct date of birth.' });

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile || !profile.dob) {
      return res.status(400).json({ error: 'Date of birth does not match. Please enter the correct date of birth.' });
    }

    // Normalise stored DOB to YYYY-MM-DD for comparison
    const storedDob = new Date(profile.dob).toISOString().split('T')[0];
    if (storedDob !== dob) {
      return res.status(400).json({ error: 'Date of birth does not match. Please enter the correct date of birth.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (err) { next(err); }
});

module.exports = router;
