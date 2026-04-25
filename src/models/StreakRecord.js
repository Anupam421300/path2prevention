'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const streakRecordSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  personalBestStreak: { type: Number, default: 0 },
  lastLoggedDate: String,
  protectionUsedThisWindow: { type: Boolean, default: false },
  weekWindowStart: String,
  missedDatesThisWindow: [String],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.StreakRecord || mongoose.model('StreakRecord', streakRecordSchema, 'streak_records');
