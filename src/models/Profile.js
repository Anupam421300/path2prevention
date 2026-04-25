'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  dob: Date,
  ageYears: Number,
  sex: { type: String, enum: ['male', 'female', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
  heightCm: Number,
  baselineWeightKg: Number,
  familyHistory: {
    firstDegreeT2D: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    firstDegreeT2DRelatives: { type: String, enum: ['parent', 'sibling', 'both', 'other', null], default: null },
    firstDegreeT1D: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    secondDegree: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
  },
  optionalLabs: {
    fastingGlucoseMmol: Number,
    hba1cPct: Number,
    loggedAt: Date,
  },
  
  preferences: {
    scheduleType: { type: String, enum: ['regular', 'rotating', 'night_shift'], default: 'regular' },
    preferredUnits: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    mainGoal: { type: String, default: 'risk_reduction' },
  },
  lifestyleSnapshot: {
    typicalSteps: Number,
    typicalSleepHours: Number,
    typicalSugaryDrinks: Number,
    activityLevel: String,
  },
  onboardingComplete: { type: Boolean, default: false },
  consentAccepted: { type: Boolean, default: false },
  consentTimestamp: Date,
}, { timestamps: true });

module.exports = mongoose.models.Profile || mongoose.model('Profile', profileSchema, 'profiles');
