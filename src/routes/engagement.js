'use strict';
const express = require('express');
const router = express.Router();
const { StreakRecord, UserProgram } = require('../models');

// GET /api/engagement/program
router.get('/program', async (req, res, next) => {
  try {
    const prog = await UserProgram.findOne({ userId: req.userId });
    res.json(prog || { enrolled: false });
  } catch (err) { next(err); }
});

// POST /api/engagement/program/enroll
router.post('/program/enroll', async (req, res, next) => {
  try {
    const prog = await UserProgram.findOneAndUpdate(
      { userId: req.userId },
      { userId: req.userId, programId: 'P2P_30_DAY_CHALLENGE', startedAt: new Date(), status: 'active', currentWeek: 1, completedWeeks: [] },
      { upsert: true, new: true }
    );
    res.json(prog);
  } catch (err) { next(err); }
});

module.exports = router;
