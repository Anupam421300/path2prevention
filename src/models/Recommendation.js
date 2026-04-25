'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const recommendationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ruleId: { type: String, required: true },
  ruleVersion: { type: String, default: '2.0.0' },
  category: String,
  title: String,
  why: String,
  actions: [String],
  familyHistoryContext: String,
  basePriority: Number,
  selectionScoreFinal: Number,
  status: { type: String, enum: ['active', 'snoozed', 'resolved'], default: 'active' },
  evidenceRefs: [String],
  modifiedBy: [{
    source: String,
    changeSummary: String,
    _id: false,
  }],
  warnings: [String],
  triggeredAt: { type: Date, default: Date.now },
  snoozedUntil: Date,
  resolvedAt: Date,
  resolvedNote: String,
  cooldownUntil: Date,
  isSafetyAlert: { type: Boolean, default: false },
}, { timestamps: true });
recommendationSchema.index({ userId: 1, status: 1, selectionScoreFinal: -1 });
recommendationSchema.index({ userId: 1, ruleId: 1 });

module.exports = mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema, 'recommendations');
