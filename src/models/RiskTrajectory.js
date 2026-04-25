'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const riskTrajectorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  computedAt: { type: Date, default: Date.now },
  currentScore: Number,
  currentLevel: String,
  projectedLevel: String,
  weeksAhead: Number,
  direction: String,
  message: String,
  insufficientData: { type: Boolean, default: false },
});
riskTrajectorySchema.index({ userId: 1, computedAt: -1 });

module.exports = mongoose.models.RiskTrajectory || mongoose.model('RiskTrajectory', riskTrajectorySchema, 'risk_trajectories');
