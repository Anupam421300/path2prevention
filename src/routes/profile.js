'use strict';
const express = require('express');
const router = express.Router();
const { Profile } = require('../models');
const { z } = require('zod');
const { validate } = require('../middleware');

// GET /api/profile
router.get('/', async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ userId: req.userId }).lean();
    if (!profile) {
      const p = await Profile.create({ userId: req.userId });
      profile = p.toObject();
    }
    const user = await require('../models').User.findById(req.userId).lean();
    if (user) profile.email = user.email;
    
    // Also get latest weight
    const latestMeasure = await require('../models').WeeklyMeasure.findOne({ userId: req.userId }).sort({ weekStartDate: -1 });
    profile.currentWeightKg = latestMeasure ? latestMeasure.weightKg : profile.baselineWeightKg;

    res.json(profile);
  } catch (err) { next(err); }
});

const profileUpdateSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  baselineWeightKg: z.number().min(20).max(500).optional(),
  familyHistory: z.any().optional(),
  optionalLabs: z.any().optional(),
  lifestyleSnapshot: z.object({
    typicalSteps: z.number().min(0).max(50000).optional(),
    typicalSleepHours: z.number().min(0).max(24).optional(),
    typicalSugaryDrinks: z.number().min(0).max(30).optional(),
    avgSugaryDrinksPerDay: z.number().min(0).max(30).optional(),
    activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active']).optional(),
  }).optional(),
});

// PUT /api/profile
router.put('/', validate(profileUpdateSchema), async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const updates = { ...req.body };

    // CRITICAL: strip familyHistory if already consented
    if (profile.consentAccepted) {
      delete updates.familyHistory;
    }

    Object.assign(profile, updates);
    await profile.save();

    res.json({ profile });
  } catch (err) { next(err); }
});

// POST /api/profile/consent
router.post('/consent', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    profile.consentAccepted = true;
    profile.consentTimestamp = new Date();
    profile.onboardingComplete = true;
    await profile.save();

    res.json({
      consentAccepted: true,
      consentTimestamp: profile.consentTimestamp,
      onboardingComplete: true,
    });
  } catch (err) { next(err); }
});

// POST /api/profile/estimate-risk
router.post('/estimate-risk', async (req, res, next) => {
  try {
    const { run } = require('../services/compute/pipeline');
    const result = await run(req.userId);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
