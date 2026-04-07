'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const model = (name, schema, collection) => {
  if (mongoose.models[name]) return mongoose.models[name];
  return mongoose.model(name, schema, collection);
};

// ───────────── 1. User ─────────────
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

// ───────────── 2. Profile ─────────────
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

// ───────────── 3. Settings ─────────────
const settingsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  reminderTime: { type: String, default: '20:00' },
}, { timestamps: true });

// ───────────── 4. DailyLog ─────────────
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

// ───────────── 5. WeeklyMeasure ─────────────
const weeklyMeasureSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: String, required: true },
  weightKg: { type: Number, required: true, min: 20, max: 300 },
  waistCm: Number,
}, { timestamps: true });
weeklyMeasureSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });
weeklyMeasureSchema.index({ userId: 1, weekStartDate: -1 });

// ───────────── 6. RiskScore ─────────────
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

// ───────────── 7. Recommendation ─────────────
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

// ───────────── 8. Goal ─────────────
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

// ───────────── 9. StreakRecord ─────────────
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

// ───────────── 13. CorrelationSnapshot ─────────────
const correlationSnapshotSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  computedAt: { type: Date, default: Date.now },
  windowDays: { type: Number, default: 28 },
  pairs: [{
    signalA: String,
    signalB: String,
    r: Number,
    n: Number,
    insight: String,
    actionSuggestion: String,
    _id: false,
  }],
});
correlationSnapshotSchema.index({ userId: 1, computedAt: -1 });

// ───────────── 14. RiskTrajectory ─────────────
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

// ───────────── 15. UserProgram ─────────────
const userProgramSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  programId: { type: String, default: 'P2P_30_DAY_CHALLENGE' },
  startedAt: Date,
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  currentWeek: { type: Number, default: 1 },
  completedWeeks: [Number],
  completedAt: Date,
});

// ───────────── Seeded / Content Collections ─────────────
const evidenceSourceSchema = new Schema({
  sourceId: { type: String, unique: true },
  title: String,
  publisher: String,
  url: String,
  tags: [String],
  snippet: String,
});

const tipSchema = new Schema({
  tipId: { type: Number, unique: true },
  text: String,
  category: String,
  evidenceRef: String,
});




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


// ───────────── Export All ─────────────
module.exports = {
  User: model('User', userSchema, 'users'),
  Profile: model('Profile', profileSchema, 'profiles'),
  Settings: model('Settings', settingsSchema, 'settings'),
  DailyLog: model('DailyLog', dailyLogSchema, 'daily_logs'),
  WeeklyMeasure: model('WeeklyMeasure', weeklyMeasureSchema, 'weekly_measures'),
  RiskScore: model('RiskScore', riskScoreSchema, 'risk_scores'),
  Recommendation: model('Recommendation', recommendationSchema, 'recommendations'),
  Goal: model('Goal', goalSchema, 'goals'),
  StreakRecord: model('StreakRecord', streakRecordSchema, 'streak_records'),
  CorrelationSnapshot: model('CorrelationSnapshot', correlationSnapshotSchema, 'correlation_snapshots'),
  RiskTrajectory: model('RiskTrajectory', riskTrajectorySchema, 'risk_trajectories'),
  UserProgram: model('UserProgram', userProgramSchema, 'user_programs'),
  EvidenceSource: model('EvidenceSource', evidenceSourceSchema, 'evidence_sources'),
  Tip: model('Tip', tipSchema, 'tips'),
  ActivityGuide: model('ActivityGuide', activityGuideSchema, 'activity_guides'),
};