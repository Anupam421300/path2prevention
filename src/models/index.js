'use strict';
// Re-export all models from individual files for backward compatibility.
// Usage: const { User, Profile, DailyLog, ... } = require('../models');

module.exports = {
  User: require('./User'),
  Profile: require('./Profile'),
  DailyLog: require('./DailyLog'),
  WeeklyMeasure: require('./WeeklyMeasure'),
  RiskScore: require('./RiskScore'),
  Recommendation: require('./Recommendation'),
  Goal: require('./Goal'),
  StreakRecord: require('./StreakRecord'),
  CorrelationSnapshot: require('./CorrelationSnapshot'),
  RiskTrajectory: require('./RiskTrajectory'),
  UserProgram: require('./UserProgram'),
  EvidenceSource: require('./EvidenceSource'),
  Tip: require('./Tip'),
  ActivityGuide: require('./ActivityGuide'),
};