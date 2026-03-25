'use strict';
const express = require('express');
const router = express.Router();
const { DailyLog, RiskScore, WeeklyMeasure, Profile, Recommendation } = require('../models');
const { getTodayString, addDays, escapeHTML } = require('../utils');

// GET /api/export/csv — Download all user health data as CSV
router.get('/csv', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = getTodayString();
    const ninetyAgo = addDays(today, -89);

    const logs = await DailyLog.find({ userId, date: { $gte: ninetyAgo } }).sort({ date: 1 });
    const riskScores = await RiskScore.find({ userId }).sort({ computedAt: 1 });
    const profile = await Profile.findOne({ userId });

    // Build CSV
    const headers = [
      'Stress (1-5)', 'Diet Score', 'Sugary Drinks',
      'Fast Food Days', 'Activity (min)', 'Risk Score', 'Risk Level'
    ];

    // Create a map of risk scores by date for joining
    const riskMap = {};
    for (const r of riskScores) {
      const dateKey = r.computedAt ? new Date(r.computedAt).toISOString().split('T')[0] : null;
      if (dateKey) riskMap[dateKey] = r;
    }

    const rows = logs.map(l => {
      const activityMin = (l.physicalActivities || []).reduce((s, a) => s + (a.moderateEqMin || 0), 0);
      const risk = riskMap[l.date];
      return [
        l.date,
        l.steps || 0,
        l.sleepHours || 0,
        l.waterGlasses || 0,
        l.sedentaryHours || 0,
        l.stressScore || '',
        l.dietSignals?.dietScore || '',
        l.dietSignals?.sugaryDrinks || '',
        l.dietSignals?.fastFoodDays || '',
        activityMin,
        risk?.internalScore || '',
        risk?.meterLevel || '',
      ].join(',');
    });

    const metaComment = [
      `# Path2Prevention — Health Data Export`,
      `# User: ${profile?.firstName || ''} ${profile?.lastName || ''}`,
      `# Exported: ${new Date().toLocaleDateString('en-AU')}`,
      `# Period: Last 90 days`,
      ``,
    ].join('\n');

    const csv = metaComment + [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="path2prevention-data-${today}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/export/pdf — Returns a simple HTML report that the browser can print as PDF
router.get('/pdf', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = getTodayString();
    const thirtyAgo = addDays(today, -29);

    const profile = await Profile.findOne({ userId });
    const logs = await DailyLog.find({ userId, date: { $gte: thirtyAgo } }).sort({ date: 1 });
    const latestRisk = await RiskScore.findOne({ userId }).sort({ computedAt: -1 });
    const recs = await Recommendation.find({ userId, status: 'active' }).limit(5);

    const avgSteps = logs.length ? Math.round(logs.reduce((s, l) => s + (l.steps || 0), 0) / logs.length) : 0;
    const avgSleep = logs.length ? (logs.reduce((s, l) => s + (l.sleepHours || 0), 0) / logs.length).toFixed(1) : 0;
    const daysLogged = logs.length;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Path2Prevention Health Report</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0" rel="stylesheet">
<style>
  :root {
    --primary: #006c49;
    --primary-light: #10b981;
    --bg-light: #f8f9fa;
    --text-main: #191c1d;
    --text-muted: #6c7a71;
    --border: rgba(187,202,191,0.3);
  }
  body { 
    font-family: 'Inter', sans-serif; 
    max-width: 850px; 
    margin: 0 auto; 
    padding: 40px; 
    color: var(--text-main); 
    background-color: #ffffff;
    line-height: 1.5;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid var(--primary);
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
  .header-left .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--primary);
    font-weight: 800;
    font-size: 24px;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .header-left .tagline {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
  }
  .header-right {
    text-align: right;
    font-size: 13px;
    color: var(--text-muted);
  }
  .header-right strong { color: var(--text-main); }
  
  .patient-card {
    background: var(--bg-light);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  .patient-info h1 {
    margin: 0 0 4px 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .patient-sub {
    font-size: 14px;
    color: var(--text-muted);
  }
  
  .risk-gauge {
    text-align: right;
  }
  .risk-badge {
    background: rgba(0, 108, 73, 0.1);
    color: var(--primary);
    padding: 6px 16px;
    border-radius: 100px;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-block;
    margin-bottom: 8px;
  }
  .risk-score {
    font-size: 36px;
    font-weight: 900;
    color: var(--primary);
    line-height: 1;
  }
  .risk-score span {
    font-size: 16px;
    color: var(--text-muted);
    font-weight: 600;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title .material-symbols-outlined {
    color: var(--primary);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  .metric-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }
  .metric-card .value {
    font-size: 32px;
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 4px;
  }
  .metric-card .label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .recs-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 40px;
  }
  .rec-card {
    background: #ffffff;
    border: 1px solid var(--border);
    border-left: 4px solid var(--primary-light);
    border-radius: 12px;
    padding: 20px;
  }
  .rec-card h3 {
    margin: 0 0 6px 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
  }
  .rec-card p {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  .footer {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    text-align: center;
  }
  .footer-text {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
    margin-bottom: 8px;
  }
  .disclaimer {
    font-size: 10px;
    color: #9ca3af;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.4;
  }

  @media print {
    body { padding: 0; background-color: white; }
    .patient-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .risk-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="logo">
        <span class="material-symbols-outlined">health_and_safety</span>
        Path2Prevention
      </div>
      <div class="tagline">Clinical Serenity System</div>
    </div>
    <div class="header-right">
      <div><strong>Report Date:</strong> ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div style="margin-top:4px;"><strong>Period:</strong> ${thirtyAgo} &rarr; ${today}</div>
    </div>
  </div>

  <div class="patient-card">
    <div class="patient-info">
      <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Patient Summary</div>
      <h1>${escapeHTML(profile?.firstName || 'Unknown')} ${escapeHTML(profile?.lastName || 'Patient')}</h1>
      <div class="patient-sub">Generated from authenticated health telemetry logs over the past 30 days.</div>
    </div>
    <div class="risk-gauge">
      <div class="risk-badge">${latestRisk?.meterLevel || 'Unknown'} Risk</div>
      <div class="risk-score">${latestRisk?.internalScore ?? '—'} <span>/100</span></div>
    </div>
  </div>

  <h2 class="section-title"><span class="material-symbols-outlined">monitoring</span> 30-Day Averages</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="value">${daysLogged}</div>
      <div class="label">Days Logged</div>
    </div>
    <div class="metric-card">
      <div class="value">${avgSteps.toLocaleString()}</div>
      <div class="label">Avg Steps / Day</div>
    </div>
    <div class="metric-card">
      <div class="value">${avgSleep}</div>
      <div class="label">Avg Sleep (hrs)</div>
    </div>
  </div>

  ${recs.length ? `
  <h2 class="section-title"><span class="material-symbols-outlined">prescriptions</span> Active Recommendations</h2>
  <div class="recs-container">
    ${recs.map(r => `
      <div class="rec-card">
        <h3>${r.title}</h3>
        <p>${r.why || 'Based on your specific health logs and indicators.'}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <div class="footer-text">Path2Prevention &bull; Lifestyle Recommendation System for Diabetes Prevention</div>
    <div class="disclaimer">Disclaimer: This report is for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare professional before making any decisions related to your health or treatment.</div>
  </div>

</body>
</html>`;

    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="path2prevention-report-${today}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) { next(err); }
});

module.exports = router;
