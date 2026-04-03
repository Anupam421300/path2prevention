// Path2Prevention — Insights Tab

let insightsChart = null;
let simDebounce = null;
let currentPeriod = '30';
let currentCategory = 'activity';

async function loadInsights() {
  const container = document.getElementById('tab-insights');
  container.innerHTML = insightsSkeleton();
  try {
    const [analytics, correlations, recs] = await Promise.all([
      api.get(`/insights/analytics?period=${currentPeriod}`),
      api.get('/insights/correlations'),
      api.get('/recommendations'),
    ]);
    state.recs = recs;
    window._insAnalytics = analytics;
    container.innerHTML = buildInsightsHTML(analytics, correlations, recs);
    renderInsightsChart(analytics, currentCategory);
    bindInsightsEvents(analytics);
  } catch (err) {
    container.innerHTML = errorState('Could not load insights.', () => loadInsights());
  }
}

function buildInsightsHTML(analytics, correlations, recs) {
  const activeRecs = (recs || []).filter(r => r.status === 'active');
  const snoozedRecs = (recs || []).filter(r => r.status === 'snoozed');
  const resolvedRecs = (recs || []).filter(r => r.status === 'resolved');

  const catButtons = ['activity', 'sleep', 'hydration', 'stress', 'sugar', 'fastfood'].map(c => `
    <button class="insight-tab ${c === currentCategory ? 'active' : ''}" data-cat="${c}" onclick="switchInsightCategory('${c}')">
      ${c === 'sugar' ? 'Sugary Drinks' : c === 'fastfood' ? 'Fast Food' : c.charAt(0).toUpperCase() + c.slice(1)}
    </button>
  `).join('');

  const periodButtons = ['7', '14', '30', '90'].map(p => `
    <button class="chart-tab ${p === currentPeriod ? 'active' : ''}" data-period="${p}" onclick="switchInsightPeriod('${p}')">
      ${p}d
    </button>
  `).join('');

  const correlationHTML = (correlations?.hasEnoughData || (correlations?.pairs?.length > 0))
    ? (correlations.pairs || []).slice(0, 4).map(pair => {
      // Build label from signalA/signalB since seeded data may not have a `label` field
      const labelMap = { steps: 'Step count', sleepHours: 'Sleep', stressScore: 'Stress', sedentaryHours: 'Sitting hours', sugaryDrinks: 'Sugary drinks', fastFood: 'Fast food', waterGlasses: 'Water intake' };
      const labelA = labelMap[pair.signalA] || pair.signalA || '';
      const labelB = labelMap[pair.signalB] || pair.signalB || '';
      const displayLabel = pair.label || `${labelA} ↔ ${labelB}`;
      return `
      <div style="padding:16px;border-radius:14px;background:#f8f9fa;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size: 17px;font-weight:700;">${displayLabel}</span>
        </div>
        <p style="font-size: 16px;color:#3c4a42;">${pair.insight || ''}</p>
        ${pair.actionSuggestion ? `<p style="font-size: 15px;color:#006c49;font-weight:600;margin-top:6px;">→ ${pair.actionSuggestion}</p>` : ''}
      </div>
    `}).join('')
    : `
      <div style="padding:26px;text-align:center;border-radius:14px;background:#f8f9fa;border:1px dashed #e7e8e9;">
        <span class="material-symbols-outlined" style="font-size:34px;color:#bbcabf;margin-bottom:10px;display:block;">lock</span>
        <p style="font-size: 17px;font-weight:700;margin-bottom:6px;">Not enough data</p>
        <p style="font-size: 16px;color:#6c7a71;">Log for ${correlations?.daysNeeded || 9} more days to unlock correlations between your health signals.</p>
        <p style="font-size: 15px;color:#bbcabf;margin-top:8px;">Requires minimum 14 days of logs</p>
      </div>
    `;

  return `
    <div style="margin-bottom:26px;">
      <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px;">Insights</h1>
      <p style="font-size: 17px;color:#6c7a71;">Trends, correlations, and personalised recommendations.</p>
    </div>

    <div class="ins-bento-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

      <!-- Chart Card (col 1-2 full width) -->
      <div class="card ins-card-span-2" style="grid-column:span 2;padding:26px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:18px;">
          <div style="display:flex;gap:6px;overflow-x:auto;flex-wrap:wrap;">${catButtons}</div>
          <div style="display:flex;gap:6px;">${periodButtons}</div>
        </div>
        <div class="chart-container" style="height:360px;"><canvas id="insightsChartCanvas"></canvas></div>
      </div>

      <!-- Correlations -->
      <div class="card" style="padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
          <span class="material-symbols-outlined" style="font-size: 24px;color:#006c49;">hub</span>
          <h3 style="font-size: 19px;font-weight:700;">Pattern Correlations</h3>
        </div>
        ${correlationHTML}
      </div>

      <!-- What-If Simulator -->
      <div class="card" style="padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
          <span class="material-symbols-outlined" style="font-size: 24px;color:#8b5cf6;">science</span>
          <h3 style="font-size: 19px;font-weight:700;">What-If Simulator</h3>
        </div>
        <p style="font-size: 16px;color:#6c7a71;margin-bottom:18px;">Adjust sliders to see your projected risk score change.</p>

        ${simSlider('simActivity', 'Daily activity (min)', 0, 120, 30, 'min')}
        ${simSlider('simSteps', 'Daily steps', 0, 15000, 5000, 'steps', 500)}
        ${simSlider('simSleep', 'Sleep hours', 4, 10, 7, 'h', 0.5)}
        ${simSlider('simSitting', 'Sitting hours/day', 0, 14, 6, 'h', 0.5)}
        ${simSlider('simSugary', 'Sugary drinks / week', 0, 30, state.analytics?.avgSugaryDrinks7d || 5, 'drinks', 1)}
        ${simSlider('simFastFood', 'Fast food / week', 0, 14, state.analytics?.avgFastFood7d || 2, 'meals', 1)}

        <div id="simResult" style="margin-top:18px;padding:22px;border-radius:14px;background:#f8f9fa;text-align:center;transition:all 0.3s;">
          <p style="font-size: 16px;color:#6c7a71;">Move sliders to see projection</p>
        </div>
      </div>

      <!-- Recommendations (full width) -->
      <div class="card ins-card-span-2" style="grid-column:span 2;padding:26px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
          <h3 style="font-size: 19px;font-weight:700;">My Recommendations</h3>
          <div style="display:flex;gap:4px;" id="recTabs">
            <button class="chart-tab active" data-tab="active" onclick="switchRecTab('active')">Active (${activeRecs.length})</button>
            <button class="chart-tab" data-tab="snoozed" onclick="switchRecTab('snoozed')">Snoozed (${snoozedRecs.length})</button>
            <button class="chart-tab" data-tab="resolved" onclick="switchRecTab('resolved')">Done (${resolvedRecs.length})</button>
          </div>
        </div>
        <div id="recListContainer">${renderRecList(activeRecs)}</div>
      </div>
    </div>
  `;
}

function simSlider(id, label, min, max, val, unit, step = 1) {
  return `
    <div class="sim-slider-group">
      <label style="display:flex;justify-content:space-between;font-size: 17px;font-weight:600;">
        <span>${label}</span>
        <span id="${id}Display" style="color:#006c49;">${val} ${unit}</span>
      </label>
      <input type="range" class="slider-input" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="document.getElementById('${id}Display').textContent=this.value+' ${unit}';runSimulation()">
    </div>
  `;
}

function renderRecList(recs) {
  if (!recs.length) return `
    <div class="empty-state" style="padding:34px 0;">
      <span class="material-symbols-outlined" style="font-size:42px;color:#bbcabf;display:block;margin-bottom:14px;">recommend</span>
      <h3>Looking good!</h3>
      <p>No recommendations in this category.</p>
    </div>
  `;

  return recs.map(r => {
    const priorityColors = { high: '#ef4444', moderate: '#f59e0b', low: '#10b981' };
    const pc = priorityColors[r.priority] || '#6c7a71';
    const catIcon = { LIFESTYLE: 'directions_run', GENETICS: 'family_history', MEDICAL: 'local_hospital' };

    return `
      <div class="card rec-card" style="padding:20px;margin-bottom:14px;border-left:4px solid ${pc};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="material-symbols-outlined" style="font-size: 22px;color:${pc};">${catIcon[r.category] || 'recommend'}</span>
            <span style="font-size: 15px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${pc};">${r.category} · ${r.priority || 'moderate'}</span>
          </div>
          <div style="display:flex;gap:6px;">
            ${r.status === 'active' ? `
              <button onclick="snoozeRec('${r._id}')" class="btn btn-sm btn-ghost" style="padding:6px 10px;min-height:auto;font-size: 16px;color:#6c7a71;">Snooze 7d</button>
              <button onclick="resolveRec('${r._id}')" class="btn btn-sm btn-ghost" style="padding:6px 10px;min-height:auto;font-size: 16px;color:#006c49;">Done ✓</button>
            ` : ''}
          </div>
        </div>
        <h4 style="font-size: 19px;font-weight:700;margin-bottom:10px;">${r.title}</h4>
        <p style="font-size: 17px;color:#3c4a42;line-height:1.5;margin-bottom:12px;">${r.why}</p>
        ${r.familyHistoryNote ? `<div style="padding:12px 12px;border-radius:10px;background:#fef3c7;font-size: 16px;color:#92400e;margin-bottom:12px;"><span class="material-symbols-outlined" style="font-size: 18px;vertical-align:middle;">family_history</span> ${r.familyHistoryNote}</div>` : ''}
        <ul style="list-style:none;padding:0;margin-bottom:14px;">
          ${(r.actions || []).map(a => `<li style="font-size: 16px;color:#3c4a42;padding:3px 0;display:flex;gap:6px;"><span style="color:#006c49;">→</span>${a}</li>`).join('')}
        </ul>

      </div>
    `;
  }).join('');
}

function switchRecTab(tab) {
  document.querySelectorAll('#recTabs .chart-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  const recs = state.recs || [];
  const filtered = recs.filter(r => r.status === tab);
  document.getElementById('recListContainer').innerHTML = renderRecList(filtered);
}

async function snoozeRec(id) {
  try {
    await api.patch(`/recommendations/${id}/snooze`, { days: 7 });
    showToast('Recommendation snoozed for 7 days.', 'info');
    loadInsights();
  } catch { showToast('Could not snooze. Try again.', 'error'); }
}

async function resolveRec(id) {
  try {
    await api.patch(`/recommendations/${id}/resolve`, {});
    showToast('Marked as done! Great work.', 'success');
    loadInsights();
  } catch { showToast('Could not update. Try again.', 'error'); }
}

function renderInsightsChart(analytics, category) {
  const canvas = document.getElementById('insightsChartCanvas');
  if (!canvas) return;
  if (insightsChart) { insightsChart.destroy(); insightsChart = null; }

  const isWeekly = parseInt(currentPeriod || 30) > 14;

  let labels, values;

  const metricMapWeekly = {
    activity: { key: 'totalActivityMin', label: 'Activity min', color: '#10b981' },
    sleep: { key: 'avgSleepHours', label: 'Sleep hrs', color: '#8b5cf6' },
    hydration: { key: 'avgWaterGlasses', label: 'Water glasses', color: '#0ea5e9' },
    stress: { key: 'avgStressScore', label: 'Stress (1-5)', color: '#ec4899' },
    sugar: { key: 'avgSugaryDrinks', label: 'Sugary Drinks', color: '#f59e0b' },
    fastfood: { key: 'avgFastFood', label: 'Fast Food', color: '#f97316' },
  };

  const metricMapDaily = {
    activity: { key: 'activityMin', label: 'Activity min', color: '#10b981' },
    sleep: { key: 'sleepHours', label: 'Sleep hrs', color: '#8b5cf6' },
    hydration: { key: 'waterGlasses', label: 'Water glasses', color: '#0ea5e9' },
    stress: { key: 'stressScore', label: 'Stress (1-5)', color: '#ec4899' },
    sugar: { key: 'sugaryDrinks', label: 'Sugary Drinks', color: '#f59e0b' },
    fastfood: { key: 'fastFood', label: 'Fast Food', color: '#f97316' },
  };

  const m = isWeekly ? (metricMapWeekly[category] || metricMapWeekly.activity) : (metricMapDaily[category] || metricMapDaily.activity);

  if (isWeekly) {
    const weeks = analytics?.weeks || [];
    labels = weeks.map(w => `W${w.weekNum || ''}`);
    values = weeks.map(w => w[m.key] == null ? null : w[m.key]);
  } else {
    // 7 or 14 days => daily plotting
    const days = analytics?.dailyPoints || [];
    labels = days.map(d => {
      const parts = d.date.split('-');
      return `${parts[2]}/${parts[1]}`; // DD/MM format
    });
    values = days.map(d => d[m.key] == null || d[m.key] === 0 ? null : d[m.key]); // Treat 0 as unlogged to maintain gaps, unless steps

    // For absolute metrics, allow plotting 0 if the backend explicitly provided it.
    if (['steps', 'activityMin', 'sugaryDrinks', 'fastFood', 'stressScore', 'waterGlasses'].includes(m.key)) {
      values = days.map(d => d[m.key] == null ? null : d[m.key]);
    }
  }

  insightsChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: m.label,
        data: values,
        borderColor: m.color,
        backgroundColor: `${m.color}15`,
        borderWidth: 2.5,
        pointBackgroundColor: m.color,
        pointRadius: 4,
        fill: true,
        tension: 0.4,
        spanGaps: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#191c1d', padding: 10, cornerRadius: 10 } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 13 }, color: '#6c7a71' } },
        y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 13 }, color: '#6c7a71' } }
      }
    }
  });
}

function switchInsightCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('[data-cat]').forEach(el => el.classList.toggle('active', el.dataset.cat === cat));
  renderInsightsChart(window._insAnalytics, cat);
}

function switchInsightPeriod(period) {
  currentPeriod = period;
  document.querySelectorAll('[data-period]').forEach(el => el.classList.toggle('active', el.dataset.period === period));
  loadInsights();
}

function runSimulation() {
  clearTimeout(simDebounce);
  simDebounce = setTimeout(async () => {
    const payload = {
      // Map slider values to the names the backend /insights/simulate expects
      moderateEqMin7d: parseInt(document.getElementById('simActivity')?.value || 30) * 7, // weekly
      avgSteps7d: parseInt(document.getElementById('simSteps')?.value || 5000),
      avgSleepHours7d: parseFloat(document.getElementById('simSleep')?.value || 7),
      avgSedentaryHours7d: parseFloat(document.getElementById('simSitting')?.value || 6),
      sugaryDrinks7d: parseInt(document.getElementById('simSugary')?.value || 5),
      fastFood7d: parseInt(document.getElementById('simFastFood')?.value || 2),
    };

    const simResult = document.getElementById('simResult');
    simResult.innerHTML = `<div class="skeleton" style="height:60px;border-radius:10px;"></div>`;

    try {
      const result = await api.post('/insights/simulate', payload);
      const delta = result.delta || 0;
      const projectedScore = result.simulatedScore ?? result.projectedScore ?? 0;
      const projectedLevel = result.simulatedLevel || result.projectedLevel || '';
      const color = delta < 0 ? '#006c49' : delta > 0 ? '#ba1a1a' : '#6c7a71';
      const sign = delta < 0 ? '↓' : delta > 0 ? '↑' : '→';
      simResult.innerHTML = `
        <div style="font-size:30px;font-weight:900;color:${color};">${sign} ${Math.abs(delta)} pts</div>
        <div style="font-size: 17px;color:#6c7a71;margin-top:6px;">Projected score: <strong style="color:${color};">${projectedScore}/100</strong> · ${projectedLevel}</div>
        <div style="height:4px;background:#e7e8e9;border-radius:4px;margin-top:12px;overflow:hidden;">
          <div style="height:100%;background:${color};width:${projectedScore}%;transition:width 0.5s;border-radius:4px;"></div>
        </div>
      `;
    } catch {
      simResult.innerHTML = `<p style="font-size: 16px;color:#6c7a71;">Could not run simulation. Please log some data first.</p>`;
    }
  }, 500);
}

function bindInsightsEvents(analytics) {
  window._insAnalytics = analytics;
}

function insightsSkeleton() {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div class="skeleton skeleton-card" style="height:280px;border-radius:20px;grid-column:span 2;"></div>
    <div class="skeleton skeleton-card" style="height:320px;border-radius:20px;"></div>
    <div class="skeleton skeleton-card" style="height:320px;border-radius:20px;"></div>
  </div>`;
}
