'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const { 
  User, Profile, Settings, DailyLog, WeeklyMeasure, RiskScore, 
  Recommendation, Goal, StreakRecord, CorrelationSnapshot, 
  RiskTrajectory, UserProgram, Feedback, PushSubscription, PersonalRecord 
} = require('../src/models');
const { connectDB } = require('../src/config/db');

async function clearUsers() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Clearing all user data...');
    
    const collections = [
      User, Profile, Settings, DailyLog, WeeklyMeasure, RiskScore,
      Recommendation, Goal, StreakRecord, CorrelationSnapshot,
      RiskTrajectory, UserProgram, Feedback, PushSubscription, PersonalRecord
    ];

    for (const Model of collections) {
      const result = await Model.deleteMany({});
      console.log(`Deleted ${result.deletedCount} documents from ${Model.modelName}`);
    }

    console.log('Successfully cleared all user data database entries. Seed data was kept intact.');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

clearUsers();
