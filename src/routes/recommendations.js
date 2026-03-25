'use strict';
const express = require('express');
const router = express.Router();
const { Recommendation } = require('../models');
const { addDays, getTodayString } = require('../utils');

// GET /api/recommendations
router.get('/', async (req, res, next) => {
  try {
    const recs = await Recommendation.find({ userId: req.userId })
      .sort({ selectionScoreFinal: -1 }).limit(15);
    res.json(recs);
  } catch (err) { next(err); }
});

// PATCH /api/recommendations/:id/snooze
router.patch('/:id/snooze', async (req, res, next) => {
  try {
    const days = req.body.days || 7;
    const rec = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'snoozed', snoozedUntil: new Date(Date.now() + days * 86400000) },
      { new: true }
    );
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
    res.json(rec);
  } catch (err) { next(err); }
});

// PATCH /api/recommendations/:id/resolve
router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const rec = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
    res.json(rec);
  } catch (err) { next(err); }
});

module.exports = router;
