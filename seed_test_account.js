const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Profile, Settings, Goal, StreakRecord, DailyLog, RiskScore } = require('./src/models');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/path2prevention';

async function seedTestAccount() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const email = 'test25user@test.com';
    const password = 'password123';

    // 1. Cleanup old
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      await Profile.deleteOne({ userId: oldUser._id });
      await Settings.deleteOne({ userId: oldUser._id });
      await Goal.deleteOne({ userId: oldUser._id });
      await StreakRecord.deleteOne({ userId: oldUser._id });
      await DailyLog.deleteMany({ userId: oldUser._id });
      await RiskScore.deleteMany({ userId: oldUser._id });
      await User.deleteOne({ _id: oldUser._id });
      console.log('Deleted old test user');
    }

    // 2. Create User
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    console.log(`Created user: ${email}`);

    // 3. Create Profile
    await Profile.create({
      userId: user._id,
      firstName: 'Long term',
      lastName: 'Tester',
      ageYears: 35,
      sex: 'male',
      heightCm: 180,
      baselineWeightKg: 80,
      onboardingComplete: true,
      consentAccepted: true,
      familyHistory: {
        firstDegreeT2D: 'yes',
        firstDegreeT2DRelatives: 'parent',
        firstDegreeT1D: 'no',
        secondDegree: 'yes'
      },
      lifestyleSnapshot: { typicalSteps: 5000, typicalSleepHours: 6, typicalSugaryDrinks: 2, activityLevel: 'light' }
    });

    // 4. Create Settings, Goal, Streak
    await Settings.create({ userId: user._id, theme: 'system' });
    await Goal.create({ userId: user._id });
    
    // We will generate the last 25 days of logs.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = [];
    for (let i = 25; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Generate some realistic varying data
      const baseSteps = 4000 + Math.floor(Math.random() * 4000) + (i < 10 ? 2000 : 0); // Improve over time
      const sleepH = 5 + (Math.random() * 3) + (i < 10 ? 1 : 0);
      const water = 4 + Math.floor(Math.random() * 6);
      const sugary = i < 15 ? (3 - Math.floor(Math.random() * 2)) : 0; // Stopped sugary drinks 15 days ago
      const fastFood = 1;
      const actMin = i < 15 ? 10 + Math.floor(Math.random() * 20) : 30 + Math.floor(Math.random() * 30); // More activity recently

      logs.push({
        userId: user._id,
        date: dateStr,
        lockedAt: i > 0 ? new Date(d.getTime() + 86400000) : null,
        steps: baseSteps,
        sleepHours: parseFloat(sleepH.toFixed(1)),
        waterGlasses: water,
        sedentaryHours: 8,
        stressScore: Math.floor(Math.random() * 3) + 2,
        dietSignals: {
          sugaryDrinks: sugary,
          fastFood: fastFood,
        },
        physicalActivities: actMin > 0 ? [{ type: 'walking', intensity: 'moderate', minutes: actMin, moderateEqMin: actMin }] : [],
        fastingGlucoseMmol: 5.5 - (i < 10 ? 0.3 : 0),
      });
    }

    await DailyLog.insertMany(logs);
    console.log(`Inserted ${logs.length} daily logs`);

    await StreakRecord.create({
      userId: user._id,
      currentStreak: 25,
      personalBestStreak: 25,
      lastLoggedDate: today.toISOString().split('T')[0],
      weekWindowStart: new Date(today.getTime() - (today.getDay() * 86400000)).toISOString().split('T')[0],
    });

    // Recompute Risk
    const pipeline = require('./src/services/compute/pipeline');
    await pipeline.run(user._id);

    console.log('Test account setup complete!');
    console.log('Login: test25user@test.com / password123');

  } catch (e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}

seedTestAccount();
