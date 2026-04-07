'use strict';
const express = require('express');
const router = express.Router();
const { User, Profile, Settings, DailyLog, WeeklyMeasure, RiskScore, Recommendation, StreakRecord, CorrelationSnapshot, RiskTrajectory, Goal, UserProgram } = require('../models');

// DELETE /api/account
router.delete('/account', async (req, res, next) => {
  try {
    const userId = req.userId;
    await Promise.all([
      DailyLog.deleteMany({ userId }),
      WeeklyMeasure.deleteMany({ userId }),
      RiskScore.deleteMany({ userId }),
      Recommendation.deleteMany({ userId }),
      StreakRecord.deleteMany({ userId }),
      CorrelationSnapshot.deleteMany({ userId }),
      RiskTrajectory.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      UserProgram.deleteMany({ userId }),
      Settings.deleteMany({ userId }),
      Profile.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);
    res.json({ message: 'Account deleted permanently.' });
  } catch (err) { next(err); }
});

module.exports = router;

