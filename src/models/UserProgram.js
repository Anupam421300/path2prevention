'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userProgramSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  programId: { type: String, default: 'P2P_30_DAY_CHALLENGE' },
  startedAt: Date,
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  currentWeek: { type: Number, default: 1 },
  completedWeeks: [Number],
  completedAt: Date,
});

module.exports = mongoose.models.UserProgram || mongoose.model('UserProgram', userProgramSchema, 'user_programs');
