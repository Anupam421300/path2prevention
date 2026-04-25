'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const weeklyMeasureSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: String, required: true },
  weightKg: { type: Number, required: true, min: 20, max: 300 },
  waistCm: Number,
}, { timestamps: true });
weeklyMeasureSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });
weeklyMeasureSchema.index({ userId: 1, weekStartDate: -1 });

module.exports = mongoose.models.WeeklyMeasure || mongoose.model('WeeklyMeasure', weeklyMeasureSchema, 'weekly_measures');
