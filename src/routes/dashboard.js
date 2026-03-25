'use strict';
const express = require('express');
const router = express.Router();
const {
  Profile, RiskScore, CorrelationSnapshot, RiskTrajectory,
  Recommendation, StreakRecord, UserProgram, DailyLog, WeeklyMeasure, Tip,
  Goal
} = require('../models');
const { getTodayString, addDays, getGreeting, getDayOfYear } = require('../utils');

// ── Helper: deterministic daily tip ──────────────────────────────────────────
async function getTodayTips() {
  const totalTips = await Tip.countDocuments();
  if (totalTips === 0) return [];
  const index1 = getDayOfYear() % totalTips;
  const index2 = (getDayOfYear() + 1) % totalTips;
  const index3 = (getDayOfYear() + 2) % totalTips;
  
  const [t1, t2, t3] = await Promise.all([
    Tip.findOne().skip(index1).lean(),
    Tip.findOne().skip(index2).lean(),
    Tip.findOne().skip(index3).lean()
  ]);
  return [t1, t2, t3].filter(Boolean);
}

// ── Helper: count how many of 8 signals are present in a log ─────────────────
function countSignals(log) {
  let c = 0;
  if (log.steps > 0) c++;
  if (log.sleepHours > 0) c++;
  if (log.waterGlasses > 0) c++;
  if (log.stressScore != null) c++;
  if (log.sedentaryHours != null) c++;
  if ((log.physicalActivities || []).length > 0) c++;
  if (log.dietSignals?.sugaryDrinks != null) c++;
  return c;
}

// ── Helper: build Mon-Sun week dots with signal quality ───────────────────────
function buildWeekDots(logs, today) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay(); // 0=Sun
    const labelIdx = dow === 0 ? 6 : dow - 1;
    const log = logs.find(l => l.date === dateStr);
    const signalCount = log ? countSignals(log) : 0;
    dots.push({
      date: dateStr,
      hasLog: !!log,
      signalCount,
      dayLabel: dayLabels[labelIdx],
    });
  }
  return dots;
}

// ── Helper: build chart data (7 days, oldest first) ──────────────────────────
function buildChartData(logs) {
  return [...logs]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(l => ({
      date: l.date,
      steps: l.steps || 0,
      sleepHours: l.sleepHours || 0,
      activityMin: (l.physicalActivities || []).reduce((s, a) => s + (a.moderateEqMin || 0), 0),
      waterGlasses: l.waterGlasses || 0,
      sugaryDrinks: l.dietSignals?.sugaryDrinks || 0,
    }));
}

// ── Helper: 30-day program state ─────────────────────────────────────────────
function buildProgramState(program) {
  const weekTasks = {
    1: 'Log at least 3 signals today',
    2: 'Do 30 minutes of any physical activity today',
    3: 'Replace one sugary drink with water today',
    4: 'Hit your daily steps goal today',
  };
  return {
    currentWeek: program.currentWeek,
    dailyTask: weekTasks[program.currentWeek] || 'Keep going!',
    completedWeeks: program.completedWeeks || [],
    progressPct: Math.round(((program.completedWeeks || []).length / 4) * 100),
    startedAt: program.startedAt,
    status: program.status,
  };
}


// ── GET /api/dashboard — READ ONLY, no pipeline call ─────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = getTodayString();

    const profile = await Profile.findOne({ userId }).lean();
    if (!profile || !profile.onboardingComplete) {
      return res.json({ onboardingRequired: true });
    }

    // Load all data in parallel — purely from cached pipeline results
    const [
      goals,
      latestScore, trajectory, correlation,
      recommendations, streak,
      userProgram,
      chartLogs,
      weights,
      todayLog,
      firstScore,
      recentlyResolved,
      tip,
    ] = await Promise.all([
      Goal.findOne({ userId }).lean(),
      RiskScore.findOne({ userId }).sort({ computedAt: -1 }).lean(),
      RiskTrajectory.findOne({ userId }).sort({ computedAt: -1 }).lean(),
      CorrelationSnapshot.findOne({ userId }).sort({ computedAt: -1 }).lean(),
      Recommendation.find({ userId, status: 'active' }).sort({ selectionScoreFinal: -1 }).limit(15).lean(),
      StreakRecord.findOne({ userId }).lean(),
      UserProgram.findOne({ userId, status: 'active' }).lean(),
      DailyLog.find({ userId }).sort({ date: -1 }).limit(7).lean(),
      WeeklyMeasure.find({ userId }).sort({ weekStartDate: -1 }).limit(8).lean(),
      DailyLog.findOne({ userId, date: today }).select('lockedAt steps').lean(),
      RiskScore.findOne({ userId }).sort({ computedAt: 1 }).select('internalScore').lean(),
      Recommendation.find({
        userId, status: 'resolved',
        resolvedAt: { $gte: new Date(Date.now() - 86400000) },
      }).limit(1).lean(),
      getTodayTips(),
    ]);

    const weekDots = buildWeekDots(chartLogs, today);
    const chartData = buildChartData(chartLogs);
    const greeting = getGreeting(profile.firstName);

    // Auto-advance UserProgram Weeks
    if (userProgram && userProgram.startedAt) {
      const daysSinceStart = Math.floor((Date.now() - new Date(userProgram.startedAt).getTime()) / 86400000);
      const trueWeek = Math.floor(daysSinceStart / 7) + 1;
      
      if (trueWeek !== userProgram.currentWeek && trueWeek > 1) {
        if (trueWeek > 4) {
          userProgram.currentWeek = 4;
          userProgram.status = 'completed';
          userProgram.completedWeeks = [1, 2, 3, 4];
        } else {
          for (let w = userProgram.currentWeek; w < trueWeek; w++) {
            if (!userProgram.completedWeeks.includes(w)) userProgram.completedWeeks.push(w);
          }
          userProgram.currentWeek = trueWeek;
        }
        // Fire-and-forget sync to DB
        UserProgram.updateOne(
          { _id: userProgram._id },
          { $set: { 
              currentWeek: userProgram.currentWeek, 
              status: userProgram.status, 
              completedWeeks: userProgram.completedWeeks 
            } 
          }
        ).catch(console.error);
      }
    }

    const metricsSnap = latestScore?.metricsSnapshot || {};

    res.json({
      greeting,
      riskScore: {
        ...(latestScore || {}),
        startingScore: firstScore?.internalScore ?? null,
        safetyOverride: latestScore?.safetyOverride ?? false,
        isOnboardingEstimate: latestScore?.isOnboardingEstimate ?? false,
      },
      metrics: metricsSnap,
      goals: goals || {},
      recommendations,
      engagement: {
        streak: {
          currentStreak: streak?.currentStreak || 0,
          personalBest: streak?.personalBestStreak || 0,
        },
        weekDots,
        program: userProgram ? buildProgramState(userProgram) : null,
      },
      trajectory: trajectory || { insufficientData: true },
      correlations: correlation?.pairs || [],
      hasEnoughDataForCorrelations: (correlation?.hasEnoughData) ?? false,
      tips: tip, // it's heavily embedded, tip variable contains the tips array
      chartData,
      weights: weights.map(w => ({ date: w.weekStartDate, weight: w.weightKg })),
      familyHistoryPersonalised: profile.familyHistory?.firstDegreeT2D === 'yes',
      todayLocked: !!todayLog?.lockedAt,
      lastPipelineRun: latestScore?.computedAt || null,
      recentlyResolved,
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    next(err);
  }
});



module.exports = router;
