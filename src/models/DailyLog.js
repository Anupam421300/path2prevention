'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const dailyLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  lockedAt: Date,
  steps: { type: Number, default: 0, min: 0, max: 50000 },
  sleepHours: { type: Number, default: 0, min: 0, max: 24 },
  waterGlasses: { type: Number, default: 0, min: 0, max: 20 },
  sedentaryHours: { type: Number, min: 0, max: 24 },
  stressScore: { type: Number, min: 1, max: 5 },
  dietSignals: {
    sugaryDrinks: { type: Number, default: 0, min: 0, max: 20 },
    fastFood: { type: Number, default: 0, min: 0, max: 10 },
  },
  physicalActivities: [{
    type: { type: String, required: true },
    intensity: { type: String, enum: ['light', 'moderate', 'vigorous'], required: true },
    minutes: { type: Number, required: true, min: 1, max: 300 },
    moderateEqMin: { type: Number, default: 0 },
    _id: false,
  }],
  fastingGlucoseMmol: Number,
}, { timestamps: true });
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.models.DailyLog || mongoose.model('DailyLog', dailyLogSchema, 'daily_logs');
