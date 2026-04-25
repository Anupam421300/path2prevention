'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const activityGuideSchema = new Schema({
  type: { type: String, unique: true },
  displayName: String,
  recommendedDurationMin: Number,
  metValue: Number,
  imageKeyword: String,
  beginnerTips: [String],
  intensityGuide: {
    light: String,
    moderate: String,
    vigorous: String,
  },
  whyBeneficial: String,
  evidenceRef: String,
});

module.exports = mongoose.models.ActivityGuide || mongoose.model('ActivityGuide', activityGuideSchema, 'activity_guides');
