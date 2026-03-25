'use strict';
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { DailyLog, WeeklyMeasure } = require('../models');
const { validate } = require('../middleware');
const pipeline = require('../services/compute/pipeline');
const { getTodayString, getWeekStart } = require('../utils');

const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  steps: z.number().min(0).max(50000).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  waterGlasses: z.number().min(0).max(20).optional(),
  sedentaryHours: z.number().min(0).max(24).optional(),
  stressScore: z.number().min(1).max(5).optional(),
  dietSignals: z.object({
    sugaryDrinks: z.number().min(0).max(20).optional(),
    fastFood: z.number().min(0).max(10).optional(),
    dietScore: z.number().min(1).max(10).optional(),
  }).optional(),
  physicalActivities: z.array(z.object({
    type: z.string(),
    intensity: z.enum(['light', 'moderate', 'vigorous']),
    minutes: z.number().min(1).max(300),
  })).optional(),
  fastingGlucoseMmol: z.number().positive().optional(),
});

const weeklyMeasureSchema = z.object({
  weightKg: z.number().min(20).max(300),
  waistCm: z.number().min(30).max(200).optional(),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// POST /api/logs/daily
router.post('/daily', validate(dailyLogSchema), async (req, res, next) => {
  try {
    const userId = req.userId;
    const date = req.body.date || getTodayString();
    const data = { ...req.body, date };

    // Compute moderate-eq minutes for activities
    if (data.physicalActivities) {
      data.physicalActivities = data.physicalActivities.map(a => {
        const multiplier = a.intensity === 'vigorous' ? 2 : a.intensity === 'moderate' ? 1 : 0.5;
        return { ...a, moderateEqMin: Math.round(a.minutes * multiplier) };
      });
    }

    // Block future dates
    const today = getTodayString();
    if (date > today) {
      return res.status(400).json({ error: 'Cannot log future dates' });
    }

    // Check if already locked — prevent re-save of any existing locked log
    const existing = await DailyLog.findOne({ userId, date });
    if (existing && existing.lockedAt) {
      return res.status(409).json({
        error: 'This day is already logged and cannot be changed.',
        code: 'LOG_LOCKED',
        lockedAt: existing.lockedAt,
      });
    }

    // Save and lock in one operation
    const dataWithLock = { userId, ...data, lockedAt: new Date() };
    const log = await DailyLog.findOneAndUpdate(
      { userId, date },
      { $set: dataWithLock },
      { upsert: true, new: true }
    );

    // Run pipeline
    const pipelineResult = await pipeline.run(userId);

    res.json({
      log,
      riskScore: pipelineResult?.riskScore,
      engagement: pipelineResult?.engagement,
    });
  } catch (err) { next(err); }
});

// GET /api/logs/daily/:date
router.get('/daily/:date', async (req, res, next) => {
  try {
    const log = await DailyLog.findOne({ userId: req.userId, date: req.params.date });
    res.json(log || { date: req.params.date, empty: true });
  } catch (err) { next(err); }
});

// GET /api/logs/range?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/range', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const logs = await DailyLog.find({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });
    res.json(logs);
  } catch (err) { next(err); }
});

// POST /api/logs/weekly
router.post('/weekly', validate(weeklyMeasureSchema), async (req, res, next) => {
  try {
    const weekStart = req.body.weekStartDate || getWeekStart(getTodayString());
    const measure = await WeeklyMeasure.findOneAndUpdate(
      { userId: req.userId, weekStartDate: weekStart },
      { userId: req.userId, weekStartDate: weekStart, weightKg: req.body.weightKg, waistCm: req.body.waistCm },
      { upsert: true, new: true }
    );
    res.json(measure);
  } catch (err) { next(err); }
});

// GET /api/logs/weekly
router.get('/weekly', async (req, res, next) => {
  try {
    const measures = await WeeklyMeasure.find({ userId: req.userId }).sort({ weekStartDate: -1 }).limit(24);
    res.json(measures);
  } catch (err) { next(err); }
});

module.exports = router;
