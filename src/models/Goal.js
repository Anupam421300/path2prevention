'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const goalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stepsGoalDaily: { type: Number, default: 6000 },
  activityGoalWeeklyMin: { type: Number, default: 150 },
  sleepGoalHours: { type: Number, default: 7.5 },
  waterGoalGlasses: { type: Number, default: 8 },
  weightGoalPct: Number,
  familyHistoryAdjusted: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Goal || mongoose.model('Goal', goalSchema, 'goals');
