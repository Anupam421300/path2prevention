'use strict';
const express = require('express');
const router = express.Router();
const { DailyLog, RiskScore, CorrelationSnapshot, WeeklyMeasure, WeeklyReport, RiskTrajectory, Profile, Goal } = require('../models');
const { getTodayString, addDays, avg, stdDev, getWeekStart, daysDiff, scoreToGrade, pearsonR, sum } = require('../utils');
const { simulateLimiter } = require('../middleware');

// GET /api/insights/analytics — Monthly analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = getTodayString();
    const periodDays = Math.min(90, Math.max(7, parseInt(req.query.period || '30')));
    const startDate = addDays(today, -(periodDays - 1));
    const logs = await DailyLog.find({ userId, date: { $gte: startDate, $lte: today } }).sort({ date: 1 });

    // Weekly aggregates — keyed as `weeks` for frontend compatibility
    const weekBuckets = {};
    for (const log of logs) {
      const ws = getWeekStart(log.date);
      if (!weekBuckets[ws]) weekBuckets[ws] = { logs: [], weekStart: ws, weekNum: Object.keys(weekBuckets).length + 1 };
      weekBuckets[ws].logs.push(log);
    }

    const weeks = Object.values(weekBuckets).map((w, idx) => {
      const validSugar = w.logs.filter(l => l.dietSignals?.sugaryDrinks != null).map(l => l.dietSignals.sugaryDrinks);
      const validFF = w.logs.filter(l => l.dietSignals?.fastFood != null).map(l => l.dietSignals.fastFood);
      const validWater = w.logs.filter(l => l.waterGlasses != null).map(l => l.waterGlasses);
      const validStress = w.logs.filter(l => l.stressScore != null).map(l => l.stressScore);

      return {
        weekStart: w.weekStart,
        weekNum: idx + 1,
        avgSteps: Math.round(avg(w.logs.map(l => l.steps || 0))), // Steps default to 0
        avgSleepHours: Math.round(avg(w.logs.filter(l => l.sleepHours > 0).map(l => l.sleepHours)) * 10) / 10,
        totalActivityMin: sum(w.logs.flatMap(l => (l.physicalActivities || []).map(a => a.moderateEqMin || 0))),
        avgSugaryDrinks: validSugar.length ? parseFloat(avg(validSugar).toFixed(1)) : null,
        avgFastFood: validFF.length ? parseFloat(avg(validFF).toFixed(1)) : null,
        avgWaterGlasses: validWater.length ? parseFloat(avg(validWater).toFixed(1)) : null,
        avgStressScore: validStress.length ? parseFloat(avg(validStress).toFixed(1)) : null,
        daysLogged: w.logs.length,
      };
    });

    // Risk score history
    const scores = await RiskScore.find({ userId }).sort({ computedAt: 1 }).limit(periodDays);

    // Heatmap data (90 days)
    const ninetyAgo = addDays(today, -89);
    const allLogs = await DailyLog.find({ userId, date: { $gte: ninetyAgo, $lte: today } });
    const heatmapData = allLogs.map(l => ({
      date: l.date,
      signalCount: [l.steps > 0, l.sleepHours > 0, l.waterGlasses > 0, (l.physicalActivities || []).length > 0, l.dietSignals?.sugaryDrinks != null, l.stressScore != null, l.sedentaryHours != null].filter(Boolean).length,
    }));

    // Also expose daily logs for the chart period
    const dailyPoints = logs.map(l => ({
      date: l.date,
      steps: l.steps || 0,
      sleepHours: l.sleepHours || 0,
      waterGlasses: l.waterGlasses || 0,
      stressScore: l.stressScore ?? null,
      sugaryDrinks: l.dietSignals?.sugaryDrinks ?? null,
      fastFood: l.dietSignals?.fastFood ?? null,
      activityMin: (l.physicalActivities || []).reduce((s, a) => s + (a.moderateEqMin || 0), 0),
    }));

    res.json({ weeks, dailyPoints, riskHistory: scores, heatmapData, totalDaysLogged: allLogs.length });
  } catch (err) { next(err); }
});

// GET /api/insights/correlations
router.get('/correlations', async (req, res, next) => {
  try {
    const snap = await CorrelationSnapshot.findOne({ userId: req.userId }).sort({ computedAt: -1 });
    if (!snap) {
      const daysLogged = await require('../models').DailyLog.countDocuments({ userId: req.userId });
      return res.json({ pairs: [], hasEnoughData: false, daysLogged, daysNeeded: Math.max(0, 14 - daysLogged) });
    }
    // Inject hasEnoughData — schema doesn't store it, derive it from pairs
    const hasEnoughData = Array.isArray(snap.pairs) && snap.pairs.length > 0;
    res.json({
      pairs: snap.pairs,
      hasEnoughData,
      windowDays: snap.windowDays,
      computedAt: snap.computedAt,
      daysNeeded: 0,
    });
  } catch (err) { next(err); }
});


// POST /api/insights/simulate
router.post('/simulate', simulateLimiter, async (req, res, next) => {
  try {
    const userId = req.userId;
    const changes = req.body;
    const profile = await Profile.findOne({ userId });
    const today = getTodayString();
    const thirtyAgo = addDays(today, -30);
    const logs = await DailyLog.find({ userId, date: { $gte: thirtyAgo, $lte: today } }).sort({ date: -1 });
    const measures = await WeeklyMeasure.find({ userId }).sort({ weekStartDate: -1 }).limit(12);

    const { computeMetrics, computeFamilyHistoryWeight, computeRiskIndex, mapToMeter } = require('../services/compute/pipeline');
    const realMetrics = computeMetrics({ profile, logs, measures, today });

    // Override with simulated values
    const simMetrics = { ...realMetrics };
    if (changes.avgSteps7d != null) simMetrics.avgSteps7d = changes.avgSteps7d;
    if (changes.moderateEqMin7d != null) simMetrics.moderateEqMin7d = changes.moderateEqMin7d;
    if (changes.avgSleepHours7d != null) simMetrics.avgSleepHours7d = changes.avgSleepHours7d;
    if (changes.sugaryDrinks7d != null) simMetrics.sugaryDrinks7d = changes.sugaryDrinks7d;
    if (changes.avgWaterGlasses7d != null) simMetrics.avgWaterGlasses7d = changes.avgWaterGlasses7d;
    if (changes.avgSedentaryHours7d != null) simMetrics.avgSedentaryHours7d = changes.avgSedentaryHours7d;
    if (changes.bmi != null) simMetrics.bmi = changes.bmi;

    const fhWeight = computeFamilyHistoryWeight(profile?.familyHistory);
    const { internalScore: simScore, breakdown: simBreakdown } = computeRiskIndex(simMetrics, fhWeight, profile);
    const realResult = computeRiskIndex(realMetrics, fhWeight, profile);

    res.json({
      currentScore: realResult.internalScore,
      currentLevel: mapToMeter(realResult.internalScore).meterLevel,
      simulatedScore: simScore,
      simulatedLevel: mapToMeter(simScore).meterLevel,
      currentBreakdown: realResult.breakdown,
      simulatedBreakdown: simBreakdown,
      delta: simScore - realResult.internalScore,
    });
  } catch (err) { next(err); }
});

module.exports = router;
