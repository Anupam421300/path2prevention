'use strict';
const express = require('express');
const router = express.Router();
const { User, Profile, Settings, DailyLog, WeeklyMeasure, RiskScore, Recommendation, StreakRecord, CorrelationSnapshot, RiskTrajectory, Goal, UserProgram, Feedback, PushSubscription } = require('../models');
const { pdfLimiter } = require('../middleware');

// POST /api/feedback
router.post('/feedback', async (req, res, next) => {
  try {
    const fb = await Feedback.create({ userId: req.userId, text: req.body.text });
    res.json({ message: 'Feedback received. Thank you!', id: fb._id });
  } catch (err) { next(err); }
});

// POST /api/push-subscribe
router.post('/push-subscribe', async (req, res, next) => {
  try {
    await PushSubscription.findOneAndUpdate(
      { userId: req.userId },
      { userId: req.userId, subscription: req.body.subscription },
      { upsert: true }
    );
    res.json({ subscribed: true });
  } catch (err) { next(err); }
});

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
      PushSubscription.deleteMany({ userId }),
      Feedback.deleteMany({ userId }),
      Settings.deleteMany({ userId }),
      Profile.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);
    res.json({ message: 'Account deleted permanently.' });
  } catch (err) { next(err); }
});

module.exports = router;
