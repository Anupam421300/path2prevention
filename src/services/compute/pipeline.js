'use strict';
const { Profile, DailyLog, WeeklyMeasure, RiskScore, Recommendation, Goal, StreakRecord, CorrelationSnapshot, RiskTrajectory, RuleVersion, Tip } = require('../../models');
const { getTodayString, addDays, daysDiff, getWeekStart, avg, sum, stdDev, computeBMI, pearsonR, scoreToGrade, getGreeting, getDayOfYear } = require('../../utils');

// ═══════════ Step 1: normalizeInputs ═══════════
async function normalizeInputs(userId) {
  const profile = await Profile.findOne({ userId });
  const today = getTodayString();
  const thirtyDaysAgo = addDays(today, -30);
  const logs = await DailyLog.find({ userId, date: { $gte: thirtyDaysAgo, $lte: today } }).sort({ date: -1 });
  const measures = await WeeklyMeasure.find({ userId }).sort({ weekStartDate: -1 }).limit(12);
  const activeRecs = await Recommendation.find({ userId, status: 'active' });

  return { profile, logs, measures, activeRecs, today };
}

// ═══════════ Step 2: computeMetrics ═══════════
function computeMetrics(facts) {
  const { logs, measures, profile } = facts;
  const today = facts.today;

  const logsInWindow = (days) => logs.filter(l => daysDiff(today, l.date) < days && daysDiff(today, l.date) >= 0);
  const last7 = logsInWindow(7);
  const last14 = logsInWindow(14);
  const last28 = logsInWindow(28);

  const stepsArr7 = last7.map(l => l.steps || 0);
  const sleepArr7 = last7.filter(l => l.sleepHours > 0).map(l => l.sleepHours);
  const waterArr7 = last7.map(l => l.waterGlasses || 0);
  const stressArr7 = last7.filter(l => l.stressScore).map(l => l.stressScore);
  const sedArr7 = last7.filter(l => l.sedentaryHours != null).map(l => l.sedentaryHours);

  const modEqMin7d = sum(last7.flatMap(l => (l.physicalActivities || []).map(a => a.moderateEqMin || 0)));
  const activityDays7d = last7.filter(l => (l.physicalActivities || []).length > 0).length;
  const sugaryDrinks7d = sum(last7.map(l => l.dietSignals?.sugaryDrinks || 0));
  const fastFood7d = sum(last7.map(l => l.dietSignals?.fastFood || 0));

  const latestWeight = measures.length > 0 ? measures[0].weightKg : profile?.baselineWeightKg;
  const bmi = computeBMI(latestWeight, profile?.heightCm);

  let weightTrend28dPct = 0;
  if (measures.length >= 2) {
    const oldest = measures[measures.length - 1].weightKg;
    const newest = measures[0].weightKg;
    weightTrend28dPct = oldest > 0 ? Math.round(((newest - oldest) / oldest) * 1000) / 10 : 0;
  }

  let weightFromBaselinePct = 0;
  if (profile?.baselineWeightKg && latestWeight) {
    weightFromBaselinePct = Math.round(((latestWeight - profile.baselineWeightKg) / profile.baselineWeightKg) * 1000) / 10;
  }

  // Latest lab and body composition values
  const latestFastingGlucose = logs.find(l => l.fastingGlucoseMmol != null)?.fastingGlucoseMmol || null;
  const latestHbA1c = facts.profile?.optionalLabs?.hba1cPct || null;
  const latestWaist = measures.find(m => m.waistCm != null);
  const latestWaistCm = latestWaist?.waistCm || null;

  // Lifestyle snapshot fallback for new users with no logs
  const snap = facts.profile?.lifestyleSnapshot;
  const hasAnyLogs = logs.length > 0;

  return {
    avgSteps7d: hasAnyLogs ? Math.round(avg(stepsArr7)) : (snap?.typicalSteps || 3000),
    avgSteps14d: Math.round(avg(logsInWindow(14).map(l => l.steps || 0))),
    moderateEqMin7d: hasAnyLogs ? Math.round(modEqMin7d) : (snap?.activityLevel === 'active' ? 180 : snap?.activityLevel === 'moderate' ? 90 : snap?.activityLevel === 'light' ? 30 : 0),
    activityDays7d,
    avgSleepHours7d: hasAnyLogs ? Math.round(avg(sleepArr7) * 10) / 10 : (snap?.typicalSleepHours || 6),
    sleepStdDev7d: Math.round(stdDev(sleepArr7) * 10) / 10,
    sugaryDrinks7d: hasAnyLogs ? sugaryDrinks7d : (snap?.typicalSugaryDrinks ? snap.typicalSugaryDrinks * 7 : 5),
    fastFood7d,
    avgWaterGlasses7d: Math.round(avg(waterArr7) * 10) / 10,
    avgStressScore7d: Math.round(avg(stressArr7) * 10) / 10,
    avgSedentaryHours7d: Math.round(avg(sedArr7) * 10) / 10,
    daysLogged7d: last7.length,
    daysLogged14d: last14.length,
    bmi,
    currentWeightKg: latestWeight || 0,
    weightTrend28dPct,
    weightFromBaselinePct,
    noWeightLogDays: measures.length === 0 ? 999 : daysDiff(today, measures[0].weekStartDate),
    latestFastingGlucose,
    latestHbA1c,
    waistCm: latestWaistCm,
    isOnboardingEstimate: !hasAnyLogs,
  };
}

// ═══════════ Step 3: computeFamilyHistoryWeight ═══════════
function computeFamilyHistoryWeight(familyHistory) {
  if (!familyHistory) return 0;
  let weight = 0;
  if (familyHistory.firstDegreeT2D === 'yes') {
    weight += familyHistory.firstDegreeT2DRelatives === 'both' ? 20 : 15;
  }
  if (familyHistory.firstDegreeT1D === 'yes') weight += 10;
  if (familyHistory.firstDegreeT2D !== 'yes' && familyHistory.secondDegree === 'yes') weight += 7;
  return Math.min(weight, 20);
}

// ═══════════ Step 4: computeRiskIndex ═══════════
function computeRiskIndex(metrics, fhWeight, profile) {
  const breakdown = [];
  let rawSum = 0;

  // Age factor
  let ageYears = profile?.ageYears || 0;
  if (!ageYears && profile?.dob) {
    const dob = new Date(profile.dob);
    const todayDate = new Date();
    ageYears = todayDate.getFullYear() - dob.getFullYear();
    const m = todayDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && todayDate.getDate() < dob.getDate())) {
      ageYears--;
    }
  }

  if (ageYears > 60) {
    rawSum += 1;
    breakdown.push({ factor: 'Age', contribution: 1, note: 'Age > 60 increases baseline risk marginally.' });
  }

  // Family history
  if (fhWeight > 0) {
    rawSum += fhWeight;
    breakdown.push({ factor: 'Family History', contribution: fhWeight, note: fhWeight >= 20 ? 'Both parent and sibling with T2D' : fhWeight >= 15 ? 'First-degree T2D' : fhWeight >= 10 ? 'First-degree T1D' : 'Second-degree relative' });
  }

  // Activity deficit (Stricter: max 25 pts)
  const actDef = Math.min(25, Math.round((1 - Math.min(metrics.moderateEqMin7d, 150) / 150) * 25));
  if (actDef > 0) { rawSum += actDef; breakdown.push({ factor: 'Physical Activity', contribution: actDef, note: `${metrics.moderateEqMin7d} min/week vs 150 target` }); }

  // BMI (Strict)
  let bmiPts = 0;
  if (metrics.bmi >= 30) bmiPts = 25;
  else if (metrics.bmi >= 28) bmiPts = 20;
  else if (metrics.bmi >= 25) bmiPts = 15;
  else if (metrics.bmi >= 23) bmiPts = 10;
  if (bmiPts > 0) { rawSum += bmiPts; breakdown.push({ factor: 'BMI', contribution: bmiPts, note: `BMI ${metrics.bmi}` }); }

  // Steps deficit (Stricter: max 20)
  const stepDef = Math.min(20, Math.round((1 - Math.min(metrics.avgSteps7d, 8000) / 8000) * 20));
  if (stepDef > 0) { rawSum += stepDef; breakdown.push({ factor: 'Steps', contribution: stepDef, note: `${metrics.avgSteps7d} avg/day vs 8,000 target` }); }

  // Sugary drinks (Stricter)
  let ssbPts = 0;
  if (metrics.sugaryDrinks7d >= 10) ssbPts = 20;
  else if (metrics.sugaryDrinks7d >= 5) ssbPts = 15;
  else if (metrics.sugaryDrinks7d >= 2) ssbPts = 8;
  if (ssbPts > 0) { rawSum += ssbPts; breakdown.push({ factor: 'Sugary Drinks', contribution: ssbPts, note: `${metrics.sugaryDrinks7d}/week` }); }

  // Sleep short (Stricter)
  let sleepPts = 0;
  if (metrics.avgSleepHours7d > 0 && metrics.avgSleepHours7d < 5) sleepPts = 15;
  else if (metrics.avgSleepHours7d > 0 && metrics.avgSleepHours7d < 6.5) sleepPts = 10;
  else if (metrics.avgSleepHours7d > 0 && metrics.avgSleepHours7d < 7) sleepPts = 5;
  if (sleepPts > 0) { rawSum += sleepPts; breakdown.push({ factor: 'Sleep', contribution: sleepPts, note: `${metrics.avgSleepHours7d}h avg` }); }

  // Fast food (Stricter)
  let ffPts = 0;
  if (metrics.fastFood7d >= 4) ffPts = 15;
  else if (metrics.fastFood7d >= 2) ffPts = 8;
  else if (metrics.fastFood7d >= 1) ffPts = 4;
  if (ffPts > 0) { rawSum += ffPts; breakdown.push({ factor: 'Fast Food', contribution: ffPts, note: `${metrics.fastFood7d}/week` }); }

  // Sedentary (Stricter)
  let sedPts = 0;
  if (metrics.avgSedentaryHours7d > 10) sedPts = 15;
  else if (metrics.avgSedentaryHours7d > 8) sedPts = 10;
  else if (metrics.avgSedentaryHours7d > 6) sedPts = 5;
  if (sedPts > 0) { rawSum += sedPts; breakdown.push({ factor: 'Sedentary Hours', contribution: sedPts, note: `${metrics.avgSedentaryHours7d}h avg` }); }

  // WAIST CIRCUMFERENCE (Stricter max 15 pts) — South Asian IDF thresholds
  let waistContrib = 0;
  const waist = metrics.waistCm;
  if (waist != null && profile?.sex) {
    const threshold = profile.sex === 'female' ? 80 : 90;
    if (waist >= threshold + 10) waistContrib = 15;
    else if (waist >= threshold + 5) waistContrib = 10;
    else if (waist >= threshold) waistContrib = 5;
    if (waistContrib > 0) { rawSum += waistContrib; breakdown.push({ factor: 'Waist Circumference', contribution: waistContrib, note: `${waist}cm — above IDF South Asian threshold (${threshold}cm)` }); }
  }

  // LAB VALUES (Stricter: Massive penalty for actual medical indicators)
  let labPts = 0;
  if (metrics.latestHbA1c >= 6.5) labPts += 50;
  else if (metrics.latestHbA1c >= 5.7) labPts += 25;
  if (metrics.latestFastingGlucose >= 7.0) labPts += 50;
  else if (metrics.latestFastingGlucose >= 5.6) labPts += 25;
  if (labPts > 0) {
    rawSum += labPts;
    breakdown.push({ factor: 'Lab Indicators', contribution: labPts, note: 'Glucose/HbA1c values are in clinical risk ranges.' });
  }

  // --- ROOT CAUSE PATTERN CO-RELATION (Rule Engine Base) ---
  let patternPts = 0;

  // Pattern 1: High Stress + Poor Sleep = Cortisol overload & insulin resistance
  if (metrics.avgStressScore7d > 3.5 && metrics.avgSleepHours7d < 6.5 && metrics.avgSleepHours7d > 0) {
    const p1 = 15; patternPts += p1;
    breakdown.push({ factor: 'Pattern: Stress & Sleep', contribution: p1, note: 'High stress + lack of sleep causes compounding insulin resistance.' });
  }

  // Pattern 2: Highly Sedentary + Zero Activity = Complete metabolic slowdown
  if (metrics.avgSedentaryHours7d > 9 && metrics.moderateEqMin7d < 30) {
    const p2 = 15; patternPts += p2;
    breakdown.push({ factor: 'Pattern: Extreme Sedentary', contribution: p2, note: 'High sitting + very low activity drastically reduces glucose uptake.' });
  }

  // Pattern 3: Poor Diet + Sugary Drinks = Blood sugar spikes
  if (metrics.sugaryDrinks7d > 5 && metrics.fastFood7d > 3) {
    const p3 = 15; patternPts += p3;
    breakdown.push({ factor: 'Pattern: Toxic Diet', contribution: p3, note: 'High sugar + high fast food severely impacts liver function.' });
  }
  
  rawSum += patternPts;

  // South Asian BMI thresholds (lower than Western):
  // IDF/WHO recommend 23 as the action point for South/East Asian populations
  const BMI_ACTION_POINT = 23; // not 25
  const BMI_OBESE = 28;

  // Max valid internal score approx 160~170. We scale out of 160.
  const internalScore = Math.min(Math.round((rawSum / 160) * 100), 100); 
  return { internalScore, breakdown, rawSum };
}

// ═══════════ Step 5: mapToMeter ═══════════
function mapToMeter(score) {
  const med = parseInt(process.env.RISK_THRESHOLD_MEDIUM) || 25;
  const high = parseInt(process.env.RISK_THRESHOLD_HIGH) || 50;
  const vhigh = parseInt(process.env.RISK_THRESHOLD_VERY_HIGH) || 75;

  if (score >= vhigh) return { meterLevel: 'Very High', meterColorKey: 'red' };
  if (score >= high) return { meterLevel: 'High', meterColorKey: 'orange' };
  if (score >= med) return { meterLevel: 'Medium', meterColorKey: 'amber' };
  return { meterLevel: 'Low', meterColorKey: 'green' };
}

// ═══════════ Step 6: buildRecommendations ═══════════
async function buildRecommendations(facts, metrics, familyHistory, userId) {
  const ruleDoc = await RuleVersion.findOne({ active: true });
  if (!ruleDoc) return [];

  const rules = ruleDoc.baseRules || [];
  const fhMods = ruleDoc.familyHistoryModifiers || {};
  const hasFH = familyHistory?.firstDegreeT2D === 'yes';
  const bothRelatives = familyHistory?.firstDegreeT2DRelatives === 'both';

  const candidates = [];

  for (const rule of rules) {
    // Check requires
    if (rule.requires) {
      const val = metrics[rule.requires.field];
      if (!evalOp(val, rule.requires.operator, rule.requires.value)) continue;
    }

    // Check trigger
    let triggered = false;
    if (rule.trigger.conditions) {
      triggered = rule.trigger.conditions.every(c => evalOp(metrics[c.field], c.operator, c.value));
    } else if (rule.trigger.field) {
      triggered = evalOp(metrics[rule.trigger.field], rule.trigger.operator, rule.trigger.value);
    }

    if (!triggered) continue;

    // Check resolve
    let resolved = false;
    if (rule.resolve) {
      if (rule.resolve.conditions) {
        resolved = rule.resolve.conditions.every(c => evalOp(metrics[c.field], c.operator, c.value));
      } else {
        resolved = evalOp(metrics[rule.resolve.field], rule.resolve.operator, rule.resolve.value);
      }
    }
    if (resolved) continue;

    let selScore = rule.basePriority;
    let fhContext = null;
    const modifiedBy = [];
    const evidenceRefs = [...(rule.evidenceRefs || [])];

    // Apply FH modifier
    if (hasFH && fhMods.affectedCategories?.includes(rule.category)) {
      const boost = bothRelatives ? fhMods.bothRelativesBoost : fhMods.standardBoost;
      selScore += boost;
      fhContext = bothRelatives ? fhMods.bothRelativesContext : fhMods.standardContext;
      modifiedBy.push({ source: 'FAMILY_HISTORY', changeSummary: `Priority boosted +${boost} due to family history. DPP evidence added.` });
      for (const ev of (fhMods.addedEvidence || [])) {
        if (!evidenceRefs.includes(ev)) evidenceRefs.push(ev);
      }
    }

    candidates.push({
      ruleId: rule.ruleId,
      category: rule.category,
      title: rule.title,
      why: rule.why,
      actions: rule.actions,
      familyHistoryContext: fhContext,
      basePriority: rule.basePriority,
      selectionScoreFinal: selScore,
      evidenceRefs,
      modifiedBy,
      warnings: [],
    });
  }

  // Sort by selection score desc
  candidates.sort((a, b) => b.selectionScoreFinal - a.selectionScoreFinal);

  // Category deduplication: only one per category
  const seen = new Set();
  const deduped = [];
  for (const c of candidates) {
    if (!seen.has(c.category)) {
      seen.add(c.category);
      deduped.push(c);
    }
  }

  // Max 5
  const top5 = deduped.slice(0, 5);

  // Track previously active recs to detect auto-resolutions
  const previouslyActiveIds = new Set(facts.activeRecs.map(r => r.ruleId));

  // Upsert each active rec
  for (const rec of top5) {
    await Recommendation.findOneAndUpdate(
      { userId, ruleId: rec.ruleId },
      { userId, ...rec, status: 'active', triggeredAt: new Date() },
      { upsert: true, new: true }
    );
  }

  // Auto-resolve recs no longer triggered — with resolution note
  const activeRuleIds = top5.map(r => r.ruleId);
  const toResolve = facts.activeRecs.filter(r => !activeRuleIds.includes(r.ruleId));
  for (const rec of toResolve) {
    const note = buildResolutionNote(rec, metrics);
    await Recommendation.findByIdAndUpdate(rec._id, {
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedNote: note,
    });
  }

  return top5;
}

function buildResolutionNote(rec, metrics) {
  const notes = {
    Steps:      () => `Your daily steps reached ${Math.round(metrics.avgSteps7d).toLocaleString()} — above target.`,
    Activity:   () => `Your weekly activity reached ${Math.round(metrics.moderateEqMin7d)} moderate-equivalent minutes.`,
    Sleep:      () => `Your average sleep improved to ${(metrics.avgSleepHours7d || 0).toFixed(1)} hours.`,
    Diet:       () => `Your sugary drinks dropped to ${metrics.sugaryDrinks7d} this week.`,
    Hydration:  () => `Your water intake averaged ${(metrics.avgWaterGlasses7d || 0).toFixed(1)} glasses per day.`,
    Sedentary:  () => `Your sitting hours dropped to ${(metrics.avgSedentaryHours7d || 0).toFixed(1)} per day.`,
    Stress:     () => `Your stress average dropped to ${(metrics.avgStressScore7d || 0).toFixed(1)}/5.`,
    Weight:     () => `Your weight trend is improving.`,
  };
  const fn = notes[rec.category];
  return fn ? fn() : 'Metric reached target.';
}

// Safety override: diabetes-range lab values
function checkSafetyOverride(metrics) {
  const fg    = metrics.latestFastingGlucose;
  const hba1c = metrics.latestHbA1c;
  const fgDiabetes    = fg    != null && fg    >= 7.0;
  const hba1cDiabetes = hba1c != null && hba1c >= 6.5;

  if (!fgDiabetes && !hba1cDiabetes) return { isSafetyOverride: false };

  let labDetail = '';
  if (fgDiabetes)    labDetail += `Fasting glucose: ${fg.toFixed(1)} mmol/L`;
  if (hba1cDiabetes) labDetail += (labDetail ? ' · ' : '') + `HbA1c: ${hba1c.toFixed(1)}%`;

  return {
    isSafetyOverride: true,
    safetyRec: {
      ruleId: 'SAFETY_LAB_OVERRIDE',
      category: 'Safety',
      title: 'Please consult a healthcare professional',
      why: `Your self-reported lab values (${labDetail}) are in the range that may indicate diabetes. Path2Prevention is a self-management tool and cannot assess your health. Please see a doctor or healthcare provider soon.`,
      actions: [
        'Book an appointment with your doctor or primary care physician',
        'Bring this app summary to your appointment',
        'Do not delay — early intervention significantly improves outcomes',
        'Continue logging your daily habits — this data is valuable for your doctor',
      ],
      selectionScoreFinal: 999,
      evidenceRefs: [],
      modifiedBy: [],
      warnings: ['Self-reported values only — clinical confirmation required'],
      status: 'active',
      isSafetyAlert: true,
    },
  };
}

function evalOp(val, op, target) {
  if (val == null) return false;
  switch (op) {
    case 'gte': return val >= target;
    case 'gt':  return val > target;
    case 'lte': return val <= target;
    case 'lt':  return val < target;
    case 'eq':  return val === target;
    default: return false;
  }
}

// ═══════════ Step 7: computeCorrelations ═══════════
async function computeCorrelations(userId, logs) {
  const recentLogs = logs.slice(0, 28);
  if (recentLogs.length < 14) {
    await CorrelationSnapshot.findOneAndUpdate(
      { userId },
      { userId, computedAt: new Date(), windowDays: 28, pairs: [] },
      { upsert: true }
    );
    return { hasEnoughData: false, pairs: [] };
  }

  const signalPairs = [
    ['sleepHours', 'steps', 'Sleep', 'Steps'],
    ['sleepHours', 'moderateEqMin', 'Sleep', 'Activity'],
    ['stressScore', 'steps', 'Stress', 'Steps'],
    ['stressScore', 'moderateEqMin', 'Stress', 'Activity'],
    ['sedentaryHours', 'steps', 'Sitting hours', 'Steps'],
    ['sedentaryHours', 'sleepHours', 'Sitting hours', 'Sleep'],
    ['sugaryDrinks', 'fastFood', 'Sugary drinks', 'Fast food'],
    ['stressScore', 'sugaryDrinks', 'Stress', 'Sugary drinks'],
    ['stressScore', 'fastFood', 'Stress', 'Fast food'],
    ['sleepHours', 'sugaryDrinks', 'Sleep', 'Sugary drinks'],
  ];

  const getVal = (log, field) => {
    if (field === 'moderateEqMin') return sum((log.physicalActivities || []).map(a => a.moderateEqMin || 0));
    if (field === 'sugaryDrinks') return log.dietSignals?.sugaryDrinks;
    if (field === 'fastFood') return log.dietSignals?.fastFood;
    return log[field];
  };

  const pairs = [];
  for (const [fieldA, fieldB, nameA, nameB] of signalPairs) {
    const xs = [], ys = [];
    for (const log of recentLogs) {
      const a = getVal(log, fieldA);
      const b = getVal(log, fieldB);
      if (a != null && b != null) { xs.push(a); ys.push(b); }
    }
    if (xs.length < 14) continue;
    const result = pearsonR(xs, ys);
    if (Math.abs(result.r) >= 0.3) {
      const relText = result.r > 0
        ? `On days you log more ${nameA.toLowerCase()}, you also tend to log more ${nameB.toLowerCase()}.`
        : `On days you log more ${nameA.toLowerCase()}, you tend to log less ${nameB.toLowerCase()}.`;

      pairs.push({
        label: `${nameA} & ${nameB}`,
        signalA: nameA, signalB: nameB,
        r: result.r, n: result.n,
        insight: relText,
        actionSuggestion: `Notice how your ${nameA.toLowerCase()} connects to your ${nameB.toLowerCase()}.`,
      });
    }
  }

  pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  const topPairs = pairs.slice(0, 3);

  await CorrelationSnapshot.findOneAndUpdate(
    { userId },
    { userId, computedAt: new Date(), windowDays: 28, pairs: topPairs, hasEnoughData: true },
    { upsert: true }
  );

  return { hasEnoughData: true, pairs: topPairs };
}

// ═══════════ Step 8: computeTrajectory ═══════════
async function computeTrajectory(userId, currentScore) {
  // Load last 14 risk scores — compare to 7+ days ago, not all-time oldest
  const recentScores = await RiskScore.find({ userId })
    .sort({ computedAt: -1 })
    .limit(14)
    .lean();

  if (recentScores.length < 2) {
    const traj = { userId, computedAt: new Date(), currentScore, currentLevel: mapToMeter(currentScore).meterLevel, insufficientData: true, message: 'Log for at least 7 days to see your trend.', direction: 'stable' };
    await RiskTrajectory.findOneAndUpdate({ userId }, traj, { upsert: true });
    return traj;
  }

  const newest = recentScores[0];
  const now = new Date(newest.computedAt);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  // Find a score approximately 7+ days ago (not the all-time oldest)
  const comparisonScore = recentScores.find(s => new Date(s.computedAt) <= sevenDaysAgo);

  if (!comparisonScore) {
    const traj = { userId, computedAt: new Date(), currentScore, currentLevel: mapToMeter(currentScore).meterLevel, insufficientData: true, message: 'Keep logging — your trend will appear after 7 more days of data.', direction: 'stable' };
    await RiskTrajectory.findOneAndUpdate({ userId }, traj, { upsert: true });
    return traj;
  }

  const daysApart = (now - new Date(comparisonScore.computedAt)) / 86400000;
  if (daysApart < 3) {
    const traj = { userId, computedAt: new Date(), currentScore, currentLevel: mapToMeter(currentScore).meterLevel, insufficientData: true, message: 'Insufficient temporal data for trend.', direction: 'stable' };
    await RiskTrajectory.findOneAndUpdate({ userId }, traj, { upsert: true });
    return traj;
  }

  const slope = (currentScore - comparisonScore.internalScore) / daysApart;
  const currentLevel = mapToMeter(currentScore).meterLevel;
  let direction = 'stable';
  if (slope < -0.3) direction = 'improving';
  else if (slope > 0.3) direction = 'worsening';

  let projectedLevel = currentLevel;
  let weeksAhead = null;
  const thresholds = [
    { level: 'Low', max: 24 },
    { level: 'Medium', max: 49 },
    { level: 'High', max: 74 },
    { level: 'Very High', max: 100 },
  ];

  if (direction !== 'stable') {
    for (let w = 1; w <= 16; w++) {
      const projected = Math.max(0, Math.min(100, currentScore + slope * w * 7));
      const { meterLevel } = mapToMeter(Math.round(projected));
      if (meterLevel !== currentLevel) {
        projectedLevel = meterLevel;
        weeksAhead = w;
        break;
      }
    }
  }

  const messages = {
    improving: weeksAhead > 0
      ? `At your current trend, your risk could improve from ${currentLevel} to ${projectedLevel} in about ${weeksAhead} week${weeksAhead > 1 ? 's' : ''}.`
      : 'Your risk is consistently improving — keep going!',
    worsening: weeksAhead > 0
      ? `Your recent habits suggest your risk could increase to ${projectedLevel} in about ${weeksAhead} week${weeksAhead > 1 ? 's' : ''}.`
      : 'Your risk has been trending upward this week. Focus on activity and diet first.',
    stable: 'Your risk level has been stable over the past week. Consistent habits will maintain your progress.',
  };

  const traj = {
    userId, computedAt: new Date(), currentScore, currentLevel, projectedLevel, weeksAhead,
    direction, message: messages[direction], insufficientData: false,
    comparedTo: { score: comparisonScore.internalScore, date: comparisonScore.computedAt, daysAgo: Math.round(daysApart) },
  };
  await RiskTrajectory.findOneAndUpdate({ userId }, traj, { upsert: true });
  return traj;
}

// ═══════════ Step 9: evaluateEngagement ═══════════
async function evaluateEngagement(userId, metrics, logs) {
  const today = getTodayString();

  // ── Streak ──
  let streak = await StreakRecord.findOne({ userId });
  if (!streak) streak = await StreakRecord.create({ userId, currentStreak: 0, personalBestStreak: 0 });

  const todayLogged = logs.some(l => l.date === today);
  if (todayLogged && streak.lastLoggedDate !== today) {
    if (!streak.lastLoggedDate) {
      streak.currentStreak = 1;
    } else {
      const diff = daysDiff(today, streak.lastLoggedDate);
      if (diff === 1) {
        streak.currentStreak++;
      } else if (diff === 2 && !streak.protectionUsedThisWindow) {
        streak.currentStreak++;
        streak.protectionUsedThisWindow = true;
      } else if (diff > 1) {
        streak.currentStreak = 1;
        streak.protectionUsedThisWindow = false;
      }
    }
    if (streak.currentStreak > streak.personalBestStreak) {
      streak.personalBestStreak = streak.currentStreak;
    }
    streak.lastLoggedDate = today;

    // Reset weekly window protection
    const weekStart = getWeekStart(today);
    if (streak.weekWindowStart !== weekStart) {
      streak.weekWindowStart = weekStart;
      streak.protectionUsedThisWindow = false;
      streak.missedDatesThisWindow = [];
    }

    await streak.save();
  }

  // ── Week dots ──
  const weekDots = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    weekDots.push(logs.some(l => l.date === d));
  }

  return {
    streak: { currentStreak: streak.currentStreak, personalBest: streak.personalBestStreak, protectionAvailable: !streak.protectionUsedThisWindow },
    weekDots,
  };
}

// ═══════════ MAIN PIPELINE ═══════════
async function run(userId) {
  // Step 1
  const facts = await normalizeInputs(userId);
  if (!facts.profile) return null;

  // Step 2
  const metrics = computeMetrics(facts);

  // Step 3
  const fhWeight = computeFamilyHistoryWeight(facts.profile.familyHistory);

  // Step 4
  const { internalScore, breakdown } = computeRiskIndex(metrics, fhWeight, facts.profile);

  // Step 5
  const { meterLevel, meterColorKey } = mapToMeter(internalScore);

  // Step 6
  const recs = await buildRecommendations(facts, metrics, facts.profile.familyHistory, userId);

  // Step 6: Check safety override (diabetes-range labs)
  const safety = checkSafetyOverride(metrics);
  let finalRecs = recs;
  let safetyOverrideFlag = false;
  if (safety.isSafetyOverride) {
    finalRecs = [safety.safetyRec];
    safetyOverrideFlag = true;
  }

  // Step 7
  const correlations = await computeCorrelations(userId, facts.logs);

  // Step 8
  const trajectory = await computeTrajectory(userId, internalScore);

  // Step 9
  const engagement = await evaluateEngagement(userId, metrics, facts.logs);

  // Step 10: Persist
  const riskScore = await RiskScore.create({
    userId, computedAt: new Date(), internalScore, meterLevel, meterColorKey,
    familyHistoryWeight: fhWeight, breakdown,
    safetyOverride: safetyOverrideFlag,
    isOnboardingEstimate: metrics.isOnboardingEstimate || false,
    metricsSnapshot: {
      avgSteps7d: metrics.avgSteps7d,
      moderateEqMin7d: metrics.moderateEqMin7d,
      avgSleepHours7d: metrics.avgSleepHours7d,
      avgSleepStdDev7d: metrics.sleepStdDev7d,
      bmi: metrics.bmi,
      sugaryDrinks7d: metrics.sugaryDrinks7d,
      fastFood7d: metrics.fastFood7d,
      avgWaterGlasses7d: metrics.avgWaterGlasses7d,
      avgStressScore7d: metrics.avgStressScore7d,
      avgSedentaryHours7d: metrics.avgSedentaryHours7d,
      daysLogged7d: metrics.daysLogged7d,
      daysLogged14d: metrics.daysLogged14d,
      activityDays7d: metrics.activityDays7d,
      waistCm: metrics.waistCm,
      latestFastingGlucose: metrics.latestFastingGlucose,
      latestHbA1c: metrics.latestHbA1c,
      weightFromBaselinePct: metrics.weightFromBaselinePct,
    },
  });

  // Dynamic Goals Generation based on health condition & profile
  const hasFH = facts.profile.familyHistory?.firstDegreeT2D === 'yes' || facts.profile.familyHistory?.secondDegree === 'yes';
  
  let stepsGoal = 6000;
  let activityMin = 150;
  let weightGoalPct = null;

  if (metrics.bmi >= 30) {
    stepsGoal = 8000;
    weightGoalPct = 7;
  } else if (metrics.bmi >= 25) {
    stepsGoal = 7000;
    weightGoalPct = 5;
  }

  if (hasFH) {
    activityMin = 200;
    if (stepsGoal < 7000) stepsGoal = 7000;
  }

  if (metrics.latestHbA1c >= 6.0 || metrics.latestFastingGlucose >= 6.0) {
    activityMin = Math.max(activityMin, 200);
    stepsGoal = Math.max(stepsGoal, 8000);
    if (!weightGoalPct && metrics.bmi >= 25) weightGoalPct = 5;
  }

  await Goal.findOneAndUpdate(
    { userId },
    {
      userId,
      stepsGoalDaily: stepsGoal,
      activityGoalWeeklyMin: activityMin,
      sleepGoalHours: 7.5,
      waterGoalGlasses: 8,
      weightGoalPct: weightGoalPct,
      familyHistoryAdjusted: hasFH,
      updatedAt: new Date(),
    },
    { upsert: true }
  );

  // Step 11: Return
  return {
    riskScore: { internalScore, meterLevel, meterColorKey, familyHistoryWeight: fhWeight, breakdown, computedAt: riskScore.computedAt },
    metrics,
    recommendations: recs,
    correlations,
    trajectory,
    engagement,
  };
}

module.exports = { run, computeFamilyHistoryWeight, computeRiskIndex, mapToMeter, computeMetrics, normalizeInputs };
