'use strict';
const express = require('express');
const router = express.Router();
const { Settings } = require('../models');
const { z } = require('zod');
const { validate } = require('../middleware');

// GET /api/settings
router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ userId: req.userId });
    if (!settings) settings = await Settings.create({ userId: req.userId });
    res.json(settings);
  } catch (err) { next(err); }
});

const settingsUpdateSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).optional(),
  notifications: z.object({
    dailyReminder: z.boolean().optional(),
    reminderTime: z.string().optional(),
    weeklyReport: z.boolean().optional(),
  }).optional(),
});

// PUT /api/settings
router.put('/', validate(settingsUpdateSchema), async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ userId: req.userId });
    if (!settings) settings = await Settings.create({ userId: req.userId });
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ settings });
  } catch (err) { next(err); }
});

module.exports = router;
