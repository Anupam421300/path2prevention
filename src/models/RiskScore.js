'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const riskScoreSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  computedAt: { type: Date, default: Date.now },
  internalScore: { type: Number, required: true },
  meterLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Very High'] },
  meterColorKey: String,
  familyHistoryWeight: { type: Number, default: 0 },
  breakdown: [{
    factor: String,
    contribution: Number,
    note: String,
    _id: false,
  }],
  metricsSnapshot: {
    avgSteps7d: Number,
    moderateEqMin7d: Number,
    avgSleepHours7d: Number,
    avgSleepStdDev7d: Number,
    bmi: Number,
    sugaryDrinks7d: Number,
    fastFood7d: Number,
    avgWaterGlasses7d: Number,
    avgStressScore7d: Number,
    avgSedentaryHours7d: Number,
    daysLogged7d: Number,
    daysLogged14d: Number,
    activityDays7d: Number,
    waistCm: Number,
    latestFastingGlucose: Number,
    latestHbA1c: Number,
    weightFromBaselinePct: Number,
  },
  safetyOverride: { type: Boolean, default: false },
  isOnboardingEstimate: { type: Boolean, default: false },
});
riskScoreSchema.index({ userId: 1, computedAt: -1 });

module.exports = mongoose.models.RiskScore || mongoose.model('RiskScore', riskScoreSchema, 'risk_scores');
