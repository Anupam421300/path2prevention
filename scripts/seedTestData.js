'use strict';
/**
 * Path2Prevention — 25-Day Test Data Seeder
 * ==========================================
 * Seeds 15 days of realistic health logs plus all derived data
 * (risk scores, recommendations, weekly reports, correlations, streaks, badges)
 * for the MOST RECENTLY REGISTERED user in the database.
 *
 * Usage:
 *   node scripts/seedTestData.js
 *   node scripts/seedTestData.js --email=test@example.com
 */

require('dotenv').config();
const { connectDB } = require('../src/config/db');
const models = require('../src/models');

// ── tiny CLI arg parser ────────────────────────────────────────────
const emailArg = process.argv.find(a => a.startsWith('--email='));
const TARGET_EMAIL = emailArg ? emailArg.split('=')[1] : null;

// ── date helpers ───────────────────────────────────────────────────
function dateStr(daysAgo) {
  const d = new Date('2026-03-21'); // today (pinned for reproducibility)
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function mondayOf(dateString) {
  const d = new Date(dateString);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// ── Random helpers ────────────────────────────────────────────────
function rnd(min, max, decimals = 0) {
  const v = min + Math.random() * (max - min);
  return decimals === 0 ? Math.round(v) : parseFloat(v.toFixed(decimals));
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── 25 days of realistic daily data ──────────────────────────────
// Days 25→16: very poor habits + high risk (new 10 days)
// Days 15→8:  moderate habits, improving slowly
// Days 7→0:   great habits, risk drops to Low
const DAY_PROFILES = [
  // ── Days 25–16: baseline week 1 (very poor) ──
  { steps: 2100, sleep: 5.0, water: 2, sugary: 4, fastFood: 2, dietScore: 2, sedentary: 12, mood: 1, stress: 5, activities: [] },
  { steps: 2800, sleep: 4.5, water: 2, sugary: 4, fastFood: 2, dietScore: 2, sedentary: 12, mood: 2, stress: 5, activities: [] },
  { steps: 3400, sleep: 5.5, water: 3, sugary: 3, fastFood: 2, dietScore: 3, sedentary: 11, mood: 2, stress: 4, activities: [] },
  { steps: 2200, sleep: 5.0, water: 2, sugary: 4, fastFood: 3, dietScore: 2, sedentary: 12, mood: 1, stress: 5, activities: [] },
  { steps: 4500, sleep: 6.0, water: 3, sugary: 3, fastFood: 1, dietScore: 4, sedentary: 10, mood: 2, stress: 4, activities: [{ type: 'walking', intensity: 'light', minutes: 10 }] },
  { steps: 2600, sleep: 5.0, water: 2, sugary: 4, fastFood: 2, dietScore: 2, sedentary: 12, mood: 1, stress: 5, activities: [] },
  { steps: 3800, sleep: 5.5, water: 3, sugary: 3, fastFood: 1, dietScore: 3, sedentary: 11, mood: 2, stress: 4, activities: [] },
  // ── Days 15–16 transition ──
  { steps: 3000, sleep: 5.0, water: 3, sugary: 4, fastFood: 2, dietScore: 3, sedentary: 11, mood: 2, stress: 4, activities: [] },
  { steps: 3500, sleep: 5.5, water: 3, sugary: 3, fastFood: 1, dietScore: 3, sedentary: 10, mood: 2, stress: 4, activities: [] },
  { steps: 4000, sleep: 6.0, water: 4, sugary: 2, fastFood: 1, dietScore: 4, sedentary: 10, mood: 3, stress: 3, activities: [] },
  // ── Days 15–9: moderate habits (original week 1) ──
  { steps: 3200, sleep: 5.5, water: 3, sugary: 3, fastFood: 1, dietScore: 4, sedentary: 10, mood: 2, stress: 4, activities: [{ type: 'walking', intensity: 'light', minutes: 15 }] },
  { steps: 4100, sleep: 6.0, water: 4, sugary: 2, fastFood: 0, dietScore: 5, sedentary: 9, mood: 3, stress: 3, activities: [] },
  { steps: 5500, sleep: 6.5, water: 5, sugary: 2, fastFood: 1, dietScore: 5, sedentary: 9, mood: 3, stress: 3, activities: [{ type: 'cycling', intensity: 'moderate', minutes: 20 }] },
  { steps: 3800, sleep: 5.0, water: 3, sugary: 3, fastFood: 2, dietScore: 3, sedentary: 11, mood: 2, stress: 4, activities: [] },
  { steps: 6000, sleep: 7.0, water: 5, sugary: 1, fastFood: 0, dietScore: 6, sedentary: 8, mood: 4, stress: 2, activities: [{ type: 'walking', intensity: 'moderate', minutes: 30 }] },
  { steps: 4400, sleep: 6.0, water: 4, sugary: 2, fastFood: 1, dietScore: 5, sedentary: 9, mood: 3, stress: 3, activities: [] },
  { steps: 7200, sleep: 7.5, water: 6, sugary: 1, fastFood: 0, dietScore: 7, sedentary: 7, mood: 4, stress: 2, activities: [{ type: 'yoga', intensity: 'light', minutes: 30 }, { type: 'walking', intensity: 'moderate', minutes: 20 }] },
  // ── Days 8–1: great habits (original week 2) ──
  { steps: 7800, sleep: 7.5, water: 6, sugary: 1, fastFood: 0, dietScore: 7, sedentary: 7, mood: 4, stress: 2, activities: [{ type: 'walking', intensity: 'moderate', minutes: 35 }] },
  { steps: 8500, sleep: 8.0, water: 7, sugary: 0, fastFood: 0, dietScore: 8, sedentary: 6, mood: 4, stress: 2, activities: [{ type: 'cycling', intensity: 'moderate', minutes: 30 }] },
  { steps: 9200, sleep: 7.5, water: 7, sugary: 0, fastFood: 0, dietScore: 8, sedentary: 6, mood: 4, stress: 1, activities: [{ type: 'running', intensity: 'moderate', minutes: 25 }] },
  { steps: 7600, sleep: 7.0, water: 6, sugary: 1, fastFood: 0, dietScore: 7, sedentary: 7, mood: 3, stress: 2, activities: [{ type: 'walking', intensity: 'moderate', minutes: 30 }] },
  { steps: 9800, sleep: 8.0, water: 8, sugary: 0, fastFood: 0, dietScore: 9, sedentary: 5, mood: 5, stress: 1, activities: [{ type: 'running', intensity: 'vigorous', minutes: 30 }] },
  { steps: 10200, sleep: 8.0, water: 8, sugary: 0, fastFood: 0, dietScore: 9, sedentary: 5, mood: 5, stress: 1, activities: [{ type: 'swimming', intensity: 'moderate', minutes: 40 }] },
  { steps: 11000, sleep: 8.5, water: 8, sugary: 0, fastFood: 0, dietScore: 9, sedentary: 4, mood: 5, stress: 1, activities: [{ type: 'running', intensity: 'vigorous', minutes: 35 }] },
  // day 0 → today
  { steps: 6500, sleep: 7.5, water: 6, sugary: 1, fastFood: 0, dietScore: 7, sedentary: 7, mood: 4, stress: 2, activities: [{ type: 'walking', intensity: 'moderate', minutes: 30 }] },
];

// ── Risk scores aligned to improvement trend (25 days) ──────────────
const RISK_SNAPSHOTS = [
  // Week 1 — Very High / High (days 25-19)
  { daysAgo: 25, score: 74, level: 'Very High' },
  { daysAgo: 24, score: 72, level: 'Very High' },
  { daysAgo: 23, score: 70, level: 'High' },
  { daysAgo: 22, score: 73, level: 'Very High' },
  { daysAgo: 21, score: 68, level: 'High' },
  { daysAgo: 20, score: 71, level: 'Very High' },
  { daysAgo: 19, score: 66, level: 'High' },
  // Week 2 — High (days 18-12)
  { daysAgo: 18, score: 64, level: 'High' },
  { daysAgo: 17, score: 62, level: 'High' },
  { daysAgo: 16, score: 60, level: 'High' },
  { daysAgo: 15, score: 58, level: 'High' },
  { daysAgo: 14, score: 55, level: 'High' },
  { daysAgo: 13, score: 52, level: 'High' },
  { daysAgo: 12, score: 50, level: 'High' },
  // Week 3 — Medium (days 11-5)
  { daysAgo: 11, score: 48, level: 'Medium' },
  { daysAgo: 10, score: 46, level: 'Medium' },
  { daysAgo: 9,  score: 42, level: 'Medium' },
  { daysAgo: 8,  score: 40, level: 'Medium' },
  { daysAgo: 7,  score: 37, level: 'Medium' },
  { daysAgo: 6,  score: 34, level: 'Medium' },
  { daysAgo: 5,  score: 31, level: 'Low' },
  // Week 4 — Low (days 4-0)
  { daysAgo: 4,  score: 28, level: 'Low' },
  { daysAgo: 3,  score: 26, level: 'Low' },
  { daysAgo: 2,  score: 24, level: 'Low' },
  { daysAgo: 1,  score: 22, level: 'Low' },
];

const BREAKDOWN_TEMPLATES = (score) => [
  { factor: 'Physical Activity', contribution: Math.round(score * 0.3), note: 'Activity minutes below WHO 150 min/week target.' },
  { factor: 'Sugary Drinks', contribution: Math.round(score * 0.2), note: 'High consumption of sugary beverages linked to insulin resistance.' },
  { factor: 'Sleep', contribution: Math.round(score * 0.15), note: 'Short sleep duration (< 7h) increases cortisol and HbA1c risk.' },
  { factor: 'Sedentary Hours', contribution: Math.round(score * 0.2), note: 'Prolonged sitting reduces insulin sensitivity.' },
  { factor: 'BMI', contribution: Math.round(score * 0.15), note: 'Overweight range increases insulin resistance risk.' },
];

// ── Recommendation data ───────────────────────────────────────────
const REC_DATA = [
  {
    ruleId: 'R_STEPS_LOW',
    category: 'LIFESTYLE',
    title: 'Take 7,000+ steps every day',
    why: 'Your average step count is below 5,000/day. Walking just 20 more minutes per day can reduce your risk by up to 30% according to the DPP trial.',
    actions: ['Take a 15-min walk after lunch', 'Park further from your destination', 'Use the stairs whenever possible'],
    basePriority: 4,
    selectionScoreFinal: 0.9,
    status: 'active',
    evidenceRefs: ['EV001', 'EV003'],
    priority: 'high',
  },
  {
    ruleId: 'R_SUGARY_DRINKS',
    category: 'LIFESTYLE',
    title: 'Eliminate sugary drinks',
    why: 'You consumed 2+ sugary drinks/day in your logs. These cause rapid blood glucose spikes and promote insulin resistance over time.',
    actions: ['Replace fizzy drinks with sparkling water + lemon', 'Choose unsweetened tea or black coffee', 'Set a weekly goal of 0 sugary drinks'],
    basePriority: 4,
    selectionScoreFinal: 0.88,
    status: 'active',
    evidenceRefs: ['EV002'],
    priority: 'high',
  },
  {
    ruleId: 'R_SLEEP_DEFICIT',
    category: 'LIFESTYLE',
    title: 'Improve your sleep to 7–8 hours',
    why: 'Chronic sleep deficit raises cortisol, which directly raises fasting glucose. Even a 1h improvement in sleep can lower HbA1c by 0.2%.',
    actions: ['Set a consistent sleep schedule 7 days a week', 'No screens 60 min before bed', 'Keep bedroom temperature below 19°C'],
    basePriority: 3,
    selectionScoreFinal: 0.75,
    status: 'active',
    evidenceRefs: ['EV004'],
    priority: 'moderate',
  },
  {
    ruleId: 'R_SEDENTARY',
    category: 'LIFESTYLE',
    title: 'Break up sitting every 30 minutes',
    why: 'Sitting for 8+ hours daily, even with exercise, raises diabetes risk. Standing or walking for 2 min per 30 min reduces post-meal glucose spikes.',
    actions: ['Set a phone reminder every 30 min', 'Stand during phone calls', 'Walk to a colleague instead of messaging'],
    basePriority: 3,
    selectionScoreFinal: 0.7,
    status: 'snoozed',
    evidenceRefs: ['EV003'],
    priority: 'moderate',
  },
  {
    ruleId: 'R_DIET_QUALITY',
    category: 'LIFESTYLE',
    title: 'Adopt a low-GI diet pattern',
    why: 'A Mediterranean or low-GI diet reduces insulin resistance and has been shown to lower HbA1c by 0.3–0.5% in pre-diabetic adults.',
    actions: ['Replace white rice with brown rice or quinoa', 'Eat vegetables before carbohydrates at meals', 'Include lentils or chickpeas 3x/week'],
    basePriority: 3,
    selectionScoreFinal: 0.68,
    status: 'resolved',
    evidenceRefs: ['EV002', 'EV004'],
    priority: 'moderate',
  },
  {
    ruleId: 'R_STRESS_MGMT',
    category: 'LIFESTYLE',
    title: 'Add a daily stress reset routine',
    why: 'Chronic stress elevates cortisol, promoting fat storage around the abdomen and increasing fasting glucose. Even 10 min/day of mindfulness reduces cortisol significantly.',
    actions: ['Try 10-min deep breathing each morning', 'Journal 3 things you are grateful for daily', 'Reduce caffeine after noon'],
    basePriority: 2,
    selectionScoreFinal: 0.55,
    status: 'active',
    evidenceRefs: [],
    priority: 'low',
  },
];

// ── Main seeder ───────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log('\n🌱 Path2Prevention — 25-day test data seeder\n' + '─'.repeat(50));

  // ── Find target user ──────────────────────────────────────────
  let user;
  if (TARGET_EMAIL) {
    user = await models.User.findOne({ email: TARGET_EMAIL.toLowerCase() });
    if (!user) { console.error(`❌ No user found with email: ${TARGET_EMAIL}`); process.exit(1); }
  } else {
    user = await models.User.findOne({}).sort({ createdAt: -1 });
    if (!user) { console.error('❌ No users found. Please register first via the app.'); process.exit(1); }
  }

  const uid = user._id;
  console.log(`✓ Target user: ${user.email} (${uid})\n`);

  // ── 0. Profile (mark onboarding complete) ────────────────────
  await models.Profile.findOneAndUpdate(
    { userId: uid },
    {
      firstName: 'Test',
      lastName: 'User',
      dob: new Date('1990-06-15'),
      ageYears: 35,
      sex: 'male',
      heightCm: 175,
      baselineWeightKg: 82,
      familyHistory: {
        firstDegreeT2D: 'yes',
        firstDegreeT2DRelatives: 'parent',
        firstDegreeT1D: 'no',
        secondDegree: 'yes',
      },
      optionalLabs: {
        fastingGlucoseMmol: 5.6, // ~101 mg/dL
        hba1cPct: 5.8,
        loggedAt: new Date(dateStr(15)),
      },
      preferences: {
        dietType: 'non_veg',
        scheduleType: 'regular',
        preferredUnits: 'metric',
        mainGoal: 'risk_reduction',
      },
      lifestyleSnapshot: { typicalSteps: 6000, typicalSleepHours: 7, typicalSugaryDrinks: 1, activityLevel: 'moderate' },
      onboardingComplete: true,
      consentAccepted: true,
      consentTimestamp: new Date(dateStr(15)),
    },
    { upsert: true, new: true }
  );
  console.log('✓ Profile updated (onboarding complete)');

  // ── 1. Goals ─────────────────────────────────────────────────
  await models.Goal.findOneAndUpdate(
    { userId: uid },
    { userId: uid, stepsGoalDaily: 7000, activityGoalWeeklyMin: 150, sleepGoalHours: 7.5, waterGoalGlasses: 8, familyHistoryAdjusted: true },
    { upsert: true, new: true }
  );
  console.log('✓ Goals created');

  // ── 2. Daily Logs (25 days) ──────────────────────────────────
  let logCount = 0;
  for (let i = 0; i < DAY_PROFILES.length; i++) {
    const p = DAY_PROFILES[i];
    const daysAgo = DAY_PROFILES.length - 1 - i; // 24 → 0
    const date = dateStr(daysAgo);

    const activities = p.activities.map(a => {
      const metMap = { light: 3.5, moderate: 5.5, vigorous: 8.5 };
      const met = metMap[a.intensity] || 5;
      const moderateEqMin = Math.round(a.minutes * (met / 5));
      return { ...a, moderateEqMin };
    });

    await models.DailyLog.findOneAndUpdate(
      { userId: uid, date },
      {
        userId: uid, date,
        steps: p.steps + rnd(-200, 200),
        sleepHours: p.sleep + rnd(-0.3, 0.3, 1),
        waterGlasses: p.water,
        sedentaryHours: p.sedentary + rnd(-0.5, 0.5, 1),
        moodScore: p.mood,
        stressScore: p.stress,
        dietSignals: {
          sugaryDrinks: p.sugary,
          fastFood: p.fastFood,
          dietScore: p.dietScore,
        },
        physicalActivities: activities,
        fastingGlucoseMmol: daysAgo % 5 === 0 ? rnd(4.8, 6.0, 1) : undefined,
      },
      { upsert: true, new: true }
    );
    logCount++;
  }
  console.log(`✓ ${logCount} daily logs created (day 24 → today)`);

  // ── 3. Weekly Measures (weights — 4 weeks) ──────────────────
  const weeklyMeasures = [
    { weekStartDate: mondayOf(dateStr(24)), weightKg: 86.0, waistCm: 99 },
    { weekStartDate: mondayOf(dateStr(17)), weightKg: 85.0, waistCm: 97 },
    { weekStartDate: mondayOf(dateStr(10)), weightKg: 83.5, waistCm: 95 },
    { weekStartDate: mondayOf(dateStr(3)),  weightKg: 81.9, waistCm: 93 },
  ];
  for (const wm of weeklyMeasures) {
    await models.WeeklyMeasure.findOneAndUpdate(
      { userId: uid, weekStartDate: wm.weekStartDate },
      { userId: uid, ...wm },
      { upsert: true, new: true }
    );
  }
  console.log('✓ 4 weekly body measurements created (86.0→81.9 kg declining)');

  // ── 4. Risk Scores (historical + current) ─────────────────────
  // Clear old risk scores for this user first to avoid duplicates
  await models.RiskScore.deleteMany({ userId: uid });
  for (const snap of RISK_SNAPSHOTS) {
    const score = snap.score + rnd(-2, 2);
    await models.RiskScore.create({
      userId: uid,
      computedAt: new Date(dateStr(snap.daysAgo) + 'T' + rnd(8,20).toString().padStart(2,'0') + ':00:00.000Z'),
      internalScore: score,
      meterLevel: snap.level,
      meterColorKey: snap.level.toLowerCase().replace(' ','_'),
      familyHistoryWeight: 15,
      breakdown: BREAKDOWN_TEMPLATES(score),
      metricsSnapshot: {
        avgSteps7d: DAY_PROFILES.slice(Math.max(0, 15 - snap.daysAgo - 7), 15 - snap.daysAgo).reduce((a, p) => a + p.steps, 0) / 7,
        moderateEqMin7d: rnd(60, 200),
        avgSleepHours7d: rnd(6.0, 8.0, 1),
        bmi: rnd(25, 29, 1),
        sugaryDrinks7d: rnd(1, 14),
      },
    });
  }
  console.log(`✓ ${RISK_SNAPSHOTS.length} risk score snapshots created (74→22, Very High→Low improving trend)`);

  // ── 5. Risk Trajectory ────────────────────────────────────────
  await models.RiskTrajectory.findOneAndUpdate(
    { userId: uid },
    {
      userId: uid,
      computedAt: new Date(),
      currentScore: 22,
      currentLevel: 'Low',
      projectedLevel: 'Low',
      weeksAhead: 4,
      direction: 'improving',
      message: 'Your risk has dropped 52 points over 25 days — from Very High to Low. At this pace, you could reach 12/100 within 4 weeks — an exceptional outcome.',
      insufficientData: false,
    },
    { upsert: true, new: true }
  );
  console.log('✓ Risk trajectory set to "improving" (55 → 22)');

  // ── 6. Recommendations ────────────────────────────────────────
  await models.Recommendation.deleteMany({ userId: uid });
  for (const rec of REC_DATA) {
    await models.Recommendation.create({
      userId: uid,
      ...rec,
      triggeredAt: new Date(dateStr(rnd(1, 10))),
      snoozedUntil: rec.status === 'snoozed' ? new Date(dateStr(-5)) : undefined, // snooze expires 5 days from now
      resolvedAt: rec.status === 'resolved' ? new Date(dateStr(3)) : undefined,
    });
  }
  console.log(`✓ ${REC_DATA.length} recommendations seeded (3 active, 1 snoozed, 1 resolved)`);

  // ── 7. Streak Record ──────────────────────────────────────────
  await models.StreakRecord.findOneAndUpdate(
    { userId: uid },
    {
      userId: uid,
      currentStreak: 18,
      personalBestStreak: 22,
      lastLoggedDate: dateStr(0),
      protectionUsedThisWindow: false,
      weekWindowStart: mondayOf(dateStr(0)),
      missedDatesThisWindow: [],
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  console.log('✓ Streak: 18 days current, 22 days personal best');

  // ── 8. Badges (earned some) ───────────────────────────────────
  // First ensure some badge definitions exist
  const DEMO_BADGES = [
    { badgeId: 'BADGE_FIRST_LOG', name: 'First Steps', description: 'Completed your first daily log', earnedMessage: 'You started your journey! 🌱', iconEmoji: '🌱', category: 'Milestone' },
    { badgeId: 'BADGE_3_STREAK', name: '3-Day Streak', description: 'Logged for 3 consecutive days', earnedMessage: 'Consistency is key! 🔥', iconEmoji: '🔥', category: 'Streak' },
    { badgeId: 'BADGE_7_STREAK', name: 'Week Warrior', description: 'Logged for 7 consecutive days', earnedMessage: 'One full week! You\'re on fire 🏆', iconEmoji: '🏆', category: 'Streak' },
    { badgeId: 'BADGE_RISK_DROP', name: 'Risk Buster', description: 'Risk score dropped by 10+ points', earnedMessage: 'Your lifestyle changes are working! ↓', iconEmoji: '📉', category: 'Health' },
    { badgeId: 'BADGE_STEPS_10K', name: 'Step Champion', description: 'Logged 10,000+ steps in a single day', earnedMessage: '10K steps done! Your legs are legendary 👟', iconEmoji: '👟', category: 'Activity' },
    { badgeId: 'BADGE_NO_SUGAR', name: 'Sugar-Free Day', description: 'Logged a day with 0 sugary drinks', earnedMessage: 'Hydration hero! 💧', iconEmoji: '💧', category: 'Nutrition' },
    { badgeId: 'BADGE_SLEEP_WEEK', name: 'Sleep Champion', description: 'Averaged 7.5h+ sleep for a full week', earnedMessage: 'Rest is your superpower 😴', iconEmoji: '😴', category: 'Sleep' },
    { badgeId: 'BADGE_14_STREAK', name: '14-Day Legend', description: 'Logged for 14 consecutive days', earnedMessage: 'Two full weeks! You\'re unstoppable 🦾', iconEmoji: '🦾', category: 'Streak' },
    { badgeId: 'BADGE_PROGRAM_ENROLL', name: 'Challenge Accepted', description: 'Enrolled in the 30-day challenge', earnedMessage: 'The 30-day journey begins! 🚀', iconEmoji: '🚀', category: 'Program' },
  ];

  for (const b of DEMO_BADGES) {
    await models.BadgeDefinition.findOneAndUpdate({ badgeId: b.badgeId }, b, { upsert: true, new: true });
  }

  // Clear existing earned badges
  await models.BadgeEarned.deleteMany({ userId: uid });

  // Earn 5 badges
  const earned = ['BADGE_FIRST_LOG', 'BADGE_3_STREAK', 'BADGE_7_STREAK', 'BADGE_RISK_DROP', 'BADGE_STEPS_10K', 'BADGE_NO_SUGAR'];
  for (const badgeId of earned) {
    await models.BadgeEarned.create({
      userId: uid,
      badgeId,
      earnedAt: new Date(dateStr(rnd(1, 12))),
      displayedAt: new Date(dateStr(rnd(0, 6))), // already displayed (no pending celebration)
    });
  }
  console.log(`✓ ${earned.length} badges earned, ${DEMO_BADGES.length - earned.length} locked`);

  // ── 9. Weekly Reports (3 full weeks + current) ───────────────
  const reports = [
    {
      weekStartDate: mondayOf(dateStr(24)),
      weekEndDate: dateStr(18),
      grade: 'D',
      overallScore: 28,
      categoryScores: [
        { category: 'Activity',  score: 18, trend: 'stable' },
        { category: 'Steps',     score: 22, trend: 'stable' },
        { category: 'Sleep',     score: 30, trend: 'stable' },
        { category: 'Hydration', score: 25, trend: 'stable' },
        { category: 'Diet',      score: 22, trend: 'stable' },
        { category: 'Stress',    score: 20, trend: 'stable' },
      ],
      topWin: 'You logged 5 out of 7 days — your first step on the journey!',
      biggestOpportunity: 'Your step count is critically low. Start with a 10-minute walk every day.',
      motivationalCopy: 'Every giant journey begins with a single step. You\'ve started — that\'s what matters.',
      streakAtTime: 3,
      generatedAt: new Date(dateStr(18)),
    },
    {
      weekStartDate: mondayOf(dateStr(17)),
      weekEndDate: dateStr(11),
      grade: 'C',
      overallScore: 46,
      categoryScores: [
        { category: 'Activity',  score: 38, trend: 'up' },
        { category: 'Steps',     score: 42, trend: 'up' },
        { category: 'Sleep',     score: 50, trend: 'up' },
        { category: 'Hydration', score: 48, trend: 'up' },
        { category: 'Diet',      score: 44, trend: 'up' },
        { category: 'Stress',    score: 50, trend: 'up' },
      ],
      topWin: 'You started logging every day this week — consistency is key!',
      biggestOpportunity: 'Boost your daily steps by 2,000 and cut sugary drinks to 1/day.',
      motivationalCopy: 'A solid improvement from last week. Your risk is starting to respond.',
      streakAtTime: 7,
      generatedAt: new Date(dateStr(11)),
    },
    {
      weekStartDate: mondayOf(dateStr(10)),
      weekEndDate: dateStr(4),
      grade: 'B',
      overallScore: 74,
      categoryScores: [
        { category: 'Activity',  score: 78, trend: 'up' },
        { category: 'Steps',     score: 82, trend: 'up' },
        { category: 'Sleep',     score: 76, trend: 'up' },
        { category: 'Hydration', score: 80, trend: 'up' },
        { category: 'Diet',      score: 76, trend: 'up' },
        { category: 'Stress',    score: 70, trend: 'up' },
      ],
      topWin: 'You hit 10,000 steps TWICE this week — absolutely legendary!',
      biggestOpportunity: 'Aim for zero sugary drinks next week to push to an A.',
      motivationalCopy: 'A massive improvement from last week. Risk dropped 18 points this week alone. Keep it up!',
      streakAtTime: 14,
      newBadgesThisWeek: ['BADGE_7_STREAK', 'BADGE_STEPS_10K', 'BADGE_14_STREAK'],
      generatedAt: new Date(dateStr(4)),
    },
  ];

  await models.WeeklyReport.deleteMany({ userId: uid });
  for (const r of reports) {
    await models.WeeklyReport.create({ userId: uid, ...r });
  }
  console.log('✓ 3 weekly reports seeded (Week 1: D, Week 2: C, Week 3: B)');

  // ── 10. Correlation Snapshot ─────────────────────────────────
  await models.CorrelationSnapshot.deleteMany({ userId: uid });
  await models.CorrelationSnapshot.create({
    userId: uid,
    computedAt: new Date(),
    windowDays: 25,
    pairs: [
      {
        signalA: 'steps',
        signalB: 'moodScore',
        r: 0.72,
        n: 25,
        insight: 'On days with 8,000+ steps, your mood score averages 4.2 vs 2.8 on low-activity days.',
        actionSuggestion: 'Walking isn\'t just physical — it\'s your biggest mood booster.',
      },
      {
        signalA: 'sleepHours',
        signalB: 'stressScore',
        r: -0.68,
        n: 25,
        insight: 'Every 1 extra hour of sleep corresponds to ~0.8 lower stress score the next day.',
        actionSuggestion: 'Prioritising sleep is your most powerful stress management tool.',
      },
      {
        signalA: 'sedentaryHours',
        signalB: 'dietScore',
        r: -0.57,
        n: 25,
        insight: 'On your most sedentary days, your diet quality score drops noticeably.',
        actionSuggestion: 'Movement and good eating seem to reinforce each other for you.',
      },
      {
        signalA: 'sugaryDrinks',
        signalB: 'moodScore',
        r: -0.51,
        n: 25,
        insight: 'Sugar intake correlates with lower mood the same day — likely blood sugar spikes and crashes.',
        actionSuggestion: 'Cutting sugary drinks may give you a faster mood lift than expected.',
      },
    ],
    hasEnoughData: true,
  });
  console.log('✓ Correlation snapshot seeded (4 real insight pairs)');

  // ── 11. 30-Day Program (enrolled, Week 4 of 4) ─────────────────
  await models.UserProgram.findOneAndUpdate(
    { userId: uid },
    {
      userId: uid,
      programId: 'P2P_30_DAY_CHALLENGE',
      startedAt: new Date(dateStr(25)),
      status: 'active',
      currentWeek: 4,
      completedWeeks: [1, 2, 3],
    },
    { upsert: true, new: true }
  );
  console.log('✓ 30-Day Challenge: enrolled, Week 4 of 4 (final week!)');

  // ── 12. Settings ──────────────────────────────────────────────
  await models.Settings.findOneAndUpdate(
    { userId: uid },
    { userId: uid, theme: 'light', notificationsEnabled: true, reminderTime: '20:00', weeklyReportEnabled: true },
    { upsert: true, new: true }
  );
  console.log('✓ Settings updated');

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log('✅  Test data seeded successfully!\n');
  console.log('  What to expect in the app:');
  console.log('  • Dashboard: Risk 22/100 (Low), 18-day streak, improving trajectory');
  console.log('  • Goals: Steps, sleep, water, activity all tracked');
  console.log('  • Log Today: Today\'s data pre-filled (day 0 profile)');
  console.log('  • Insights: 7/14/30-day charts, 4 correlation pairs (n=25 days),');
  console.log('              What-If simulator, 3 active recs, 1 snoozed, 1 resolved');
  console.log('  • Weekly Reports: 3 reports (Week 1=D, Week 2=C, Week 3=B)');
  console.log('  • Learn: Articles/recipes/glossary from existing seed data');
  console.log('  • Settings: 6 badges earned, 3 locked, 30-Day Challenge at Week 4 (final!)');
  console.log('\n  → Visit http://localhost:5000 and log in to test!\n');

  process.exit(0);
}

seed().catch(e => { console.error('❌ Seed error:', e.message); console.error(e); process.exit(1); });
