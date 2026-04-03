'use strict';
const express = require('express');
const router = express.Router();
const { DailyLog, RiskScore, WeeklyMeasure, Profile, Recommendation, User } = require('../models');
const { getTodayString, addDays, escapeHTML } = require('../utils');

// GET /api/export/csv — Download all user health data as CSV
router.get('/csv', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = getTodayString();

    const logs = await DailyLog.find({ userId }).sort({ date: 1 });
    const riskScores = await RiskScore.find({ userId }).sort({ computedAt: 1 });
    const weeklyMeasures = await WeeklyMeasure.find({ userId }).sort({ weekStartDate: 1 });
    const profile = await Profile.findOne({ userId });

    // Build CSV
    const headers = [
      'Date', 'Steps', 'Sleep (hrs)', 'Water (glasses)', 'Sedentary (hrs)', 
      'Stress (1-5)', 'Diet Score', 'Sugary Drinks', 'Fast Food', 
      'Activity (min)', 'Fasting Glucose (mmol)', 'Risk Score', 'Risk Level', 
      'Weight (kg)', 'Waist (cm)'
    ];

    // Create a map of risk scores by date for joining
    const riskMap = {};
    for (const r of riskScores) {
      const dateKey = r.computedAt ? new Date(r.computedAt).toISOString().split('T')[0] : null;
      if (dateKey) riskMap[dateKey] = r;
    }

    const weeklyMap = {};
    for (const w of weeklyMeasures) {
      if(w.weekStartDate) weeklyMap[w.weekStartDate] = w;
    }

    const rows = logs.map(l => {
      const activityMin = (l.physicalActivities || []).reduce((s, a) => s + (a.moderateEqMin || 0), 0);
      const risk = riskMap[l.date];
      const weekly = weeklyMap[l.date];
      return [
        l.date,
        l.steps || 0,
        l.sleepHours || 0,
        l.waterGlasses || 0,
        l.sedentaryHours || 0,
        l.stressScore || '',
        l.dietSignals?.dietScore || '',
        l.dietSignals?.sugaryDrinks || '',
        l.dietSignals?.fastFood || '',
        activityMin,
        l.fastingGlucoseMmol || '',
        risk?.internalScore || '',
        risk?.meterLevel || '',
        weekly?.weightKg || '',
        weekly?.waistCm || ''
      ].join(',');
    });

    const metaComment = [
      `# Path2Prevention — Comprehensive Health Data Export`,
      `# User: ${profile?.firstName || ''} ${profile?.lastName || ''}`,
      `# Exported: ${new Date().toLocaleDateString('en-AU')}`,
      `# Period: All Time`,
      ``,
    ].join('\n');

    const csv = metaComment + [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="path2prevention-data-${today}.csv"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/export/pdf — Returns a comprehensive HTML report that the browser can print as A4 PDF
router.get('/pdf', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = getTodayString();
    // Pull full history for PDF as per user request
    const user = await User.findById(userId);
    const profile = await Profile.findOne({ userId });
    const logs = await DailyLog.find({ userId }).sort({ date: 1 });
    const latestRisk = await RiskScore.findOne({ userId }).sort({ computedAt: -1 });
    const recs = await Recommendation.find({ userId, status: 'active' }).limit(10);
    const firstLogDate = logs[0]?.date || today;

    const avgSteps = logs.length ? Math.round(logs.reduce((s, l) => s + (l.steps || 0), 0) / logs.length) : 0;
    const avgSleep = logs.length ? (logs.reduce((s, l) => s + (l.sleepHours || 0), 0) / logs.length).toFixed(1) : 0;
    const daysLogged = logs.length;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Clinical Health Report</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { 
    --primary: #006c49; 
    --primary-light: #10b981; 
    --bg-light: #f8f9fa; 
    --text-main: #191c1d; 
    --text-muted: #6c7a71; 
    --border: #cbd5e1; 
  }
  * { box-sizing: border-box; }
  body { 
    font-family: 'Inter', sans-serif; 
    color: var(--text-main); 
    margin: 0; 
    background: #fff; 
    line-height: 1.5; 
  }
  @page { size: A4 portrait; margin: 15mm; }
  .page { 
    page-break-after: always; 
    position: relative; 
    min-height: 250mm; 
    padding: 10px;
  }
  .page:last-child { page-break-after: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid var(--primary); padding-bottom: 12px; margin-bottom: 24px; }
  .header h1 { margin: 0; font-size: 24px; color: var(--primary); }
  .header .meta { text-align: right; font-size: 11px; color: var(--text-muted); }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { border: 1px solid var(--border); border-radius: 8px; padding: 16px; background: #fafafa; }
  h2 { font-size: 18px; margin-top: 0; border-bottom: 1px solid var(--border); padding-bottom: 8px; color: var(--primary); }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
  th, td { border: 1px solid var(--border); padding: 8px; text-align: center; }
  th { background: var(--primary); color: white; font-weight: 600; }
  tr:nth-child(even) { background: #f1f5f9; }
  .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; color: white; font-weight: bold; background: var(--primary); }
  .breakdown-row { text-align: left; }
  
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card { background: #fafafa; }
    th { background: var(--primary) !important; color: white !important; }
    tr:nth-child(even) { background-color: #f1f5f9 !important; }
    .page { min-height: auto; padding: 0; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Path2Prevention &mdash; Clinical Telemetry Report</h1>
      <div class="meta">
        Generated: ${new Date().toLocaleDateString('en-AU')}<br>
        Period: ${firstLogDate} &rarr; ${today}
      </div>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <h2>Patient Profile</h2>
        <p style="margin: 0 0 4px 0;"><strong>Name:</strong> ${escapeHTML(profile?.firstName || 'Unknown')} ${escapeHTML(profile?.lastName || 'Patient')}</p>
        <p style="margin: 0 0 4px 0; font-size: 10px; color: var(--text-muted);"><strong>Email:</strong> ${escapeHTML(user?.email || 'N/A')}</p>
        <p style="margin: 4px 0;"><strong>Age:</strong> ${profile?.ageYears || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Sex:</strong> ${profile?.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Baseline Weight:</strong> ${profile?.baselineWeightKg || 'N/A'} kg</p>
        <p style="margin: 4px 0;"><strong>Height:</strong> ${profile?.heightCm || 'N/A'} cm</p>
        <p style="margin: 4px 0;"><strong>Main Goal:</strong> ${escapeHTML(profile?.preferences?.mainGoal?.replace('_', ' ') || 'N/A')}</p>
        <p style="margin: 4px 0;"><strong>Family History (T2D):</strong> ${profile?.familyHistory?.firstDegreeT2D === 'yes' ? 'Yes (1st Degree)' : (profile?.familyHistory?.firstDegreeT2D || 'None')}</p>
        ${profile?.optionalLabs?.hba1cPct ? `<p style="margin: 4px 0;"><strong>Latest HbA1c:</strong> ${profile.optionalLabs.hba1cPct}%</p>` : ''}
        ${profile?.optionalLabs?.fastingGlucoseMmol ? `<p style="margin: 4px 0;"><strong>Fasting Glucose:</strong> ${profile.optionalLabs.fastingGlucoseMmol} mmol/L</p>` : ''}
      </div>
      <div class="card">
        <h2>Risk Assessment</h2>
        <p><strong>Current Risk Level:</strong> <span class="risk-badge">${latestRisk?.meterLevel || 'N/A'}</span></p>
        <p style="font-size:42px;font-weight:900;color:var(--primary);margin:0;line-height:1;">${latestRisk?.internalScore ?? '—'} <span style="font-size:16px;color:var(--text-muted);font-weight:600;">/100</span></p>
        <p style="font-size:11px;color:var(--text-muted);margin-top:8px;">Calculated on ${latestRisk?.computedAt ? new Date(latestRisk.computedAt).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>

    <div class="card" style="margin-top:24px;">
      <h2>Clinical Averages (All Time)</h2>
      <div style="font-size: 15px; display:flex; gap:32px; justify-content: space-around; padding: 12px 0;">
          <div style="text-align:center;">
             <div style="font-size:24px;font-weight:800;color:var(--primary);">${avgSteps.toLocaleString()}</div>
             <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Avg Steps / Day</div>
          </div>
          <div style="text-align:center;">
             <div style="font-size:24px;font-weight:800;color:var(--primary);">${avgSleep}h</div>
             <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Avg Sleep</div>
          </div>
          <div style="text-align:center;">
             <div style="font-size:24px;font-weight:800;color:var(--primary);">${daysLogged}</div>
             <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Days Logged</div>
          </div>
      </div>
    </div>


    <div class="card" style="margin-top:24px;">
      <h2>Risk Score Breakdown Analysis</h2>
      <table>
        <thead>
          <tr>
            <th class="breakdown-row">Factor Analyzed</th>
            <th>Impact</th>
            <th class="breakdown-row">Clinical Detail</th>
          </tr>
        </thead>
        <tbody>
          ${latestRisk?.breakdown?.map(b => `
          <tr>
            <td class="breakdown-row" style="font-weight:600;">${escapeHTML(b.factor)}</td>
            <td style="font-weight:bold;color:${b.contribution > 0 ? '#b91c1c' : '#15803d'};">${b.contribution > 0 ? '+' : ''}${b.contribution.toFixed(1)}</td>
            <td class="breakdown-row">${escapeHTML(b.note || '')}</td>
          </tr>
          `).join('') || '<tr><td colspan="3">No breakdown metrics recorded.</td></tr>'}
        </tbody>
      </table>
    </div>
    
    ${recs.length ? `
    <div class="card" style="margin-top:24px;">
      <h2>Active Prescriptive Interventions</h2>
      <ul style="font-size:13px; margin:0; padding-left: 20px;">
      ${recs.map(r => `
        <li style="margin-bottom:8px;">
           <strong style="color:var(--text-main); font-size:14px;">${escapeHTML(r.title)}</strong><br>
           <span style="color:var(--text-muted);">${escapeHTML(r.why || '')}</span>
        </li>
      `).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
  
  <div class="page">
    <div class="header">
      <h1>Daily Telemetry Logs</h1>
      <div class="meta">Comprehensive Data Set</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Steps</th>
          <th>Sleep (hrs)</th>
          <th>Sedentary (hrs)</th>
          <th>Water (glass)</th>
          <th>Activity (MEQ)</th>
          <th>Stress (1-5)</th>
          <th>Sweet Drinks</th>
          <th>Fast Food</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(l => {
          const mEq = (l.physicalActivities || []).reduce((acc, a) => acc + (a.moderateEqMin || 0), 0);
          return `
          <tr>
            <td>${l.date}</td>
            <td>${l.steps || 0}</td>
            <td>${l.sleepHours || 0}</td>
            <td>${l.sedentaryHours || 0}</td>
            <td>${l.waterGlasses || 0}</td>
            <td>${mEq}</td>
            <td>${l.stressScore || '-'}</td>
            <td>${l.dietSignals?.sugaryDrinks ?? '-'}</td>
            <td>${l.dietSignals?.fastFood ?? '-'}</td>
          </tr>
          `;
        }).join('') || '<tr><td colspan="9">No daily logs recorded in timeline.</td></tr>'}
      </tbody>
    </table>
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); }, 800);
    };
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(html);
  } catch (err) { next(err); }
});

module.exports = router;
