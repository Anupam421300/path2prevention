// Path2Prevention — Dashboard Tab



async function loadDashboard() {
  const container = document.getElementById('tab-dashboard');
  container.innerHTML = dashboardSkeleton();

  try {
    const data = await api.get('/dashboard');
    state.dashboardData = data;

    if (data.onboardingRequired) { startOnboarding(); return; }

    // Store risk score for delta calculation after log save (M8)
    if (window.APP) window.APP.lastRiskScore = data.riskScore?.internalScore;

    updateSidebarRisk(data.riskScore);

    // Check very high risk — only show for real scores, not onboarding estimates
    if (data.riskScore?.internalScore >= 75 && !data.riskScore?.isOnboardingEstimate) {
      showVeryHighRiskWarning();
    }



    container.innerHTML = buildDashboardHTML(data);
    renderRiskGauge(data.riskScore);
    renderDashboardChart(data.chartData);
    bindDashboardEvents(data);


    // Show recently resolved rec banner (U5)
    if (data.recentlyResolved?.length > 0) {
      const rec = data.recentlyResolved[0];
      const banner = document.createElement('div');
      banner.className = 'resolved-rec-banner';
      banner.innerHTML = `
        <span class="material-symbols-outlined" style="color:#22C55E;font-size: 24px;">trophy</span>
        <div><strong>Goal reached: ${rec.title}</strong><p style="font-size: 16px;color:#6B7280;margin:2px 0 0;">${rec.resolvedNote || 'Your habit improved to reach the target.'}</p></div>
        <button onclick="this.closest('.resolved-rec-banner').remove()" style="background:none;border:none;cursor:pointer;color:#6c7a71;font-size: 22px;margin-left:auto;">×</button>
      `;
      container.prepend(banner);
    }
  } catch (err) {
    container.innerHTML = errorState('Could not load dashboard.', () => loadDashboard());
  }
}

function buildDashboardHTML(data) {
  const { greeting, riskScore, metrics, goals, recommendations, engagement, trajectory, tips } = data;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const recs = (recommendations || []).slice(0, 2);
  const colorMap = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', 'Very High': '#ef4444' };
  const riskColor = colorMap[riskScore?.meterLevel] || '#006c49';

  // U2: quality-coded week dots (0-8 signals)
  const weekDots = (engagement?.weekDots || []);
  const getQualityColor = (dot) => {
    if (!dot.hasLog || dot.signalCount === 0) return '#e7e8e9';
    if (dot.signalCount <= 2) return '#a7f3d0';
    if (dot.signalCount <= 4) return '#6ee7b7';
    if (dot.signalCount <= 6) return '#34d399';
    return '#10b981';
  };

  // M9: starting score delta
  const startingScore = riskScore?.startingScore;
  const scoreDelta = startingScore != null && startingScore !== riskScore?.internalScore
    ? riskScore.internalScore - startingScore : null;

  // B4: safety override
  const isSafetyAlert = riskScore?.safetyOverride || recs.some(r => r.isSafetyAlert);

  // U6: new user check — rely solely on the isOnboardingEstimate flag
  const isNewUser = riskScore?.isOnboardingEstimate === true;

  // M7: 30-day challenge card
  const program = engagement?.program;

  return `

    <!-- Header -->
    <div style="margin-bottom:30px;">
      <p style="font-size: 17px;color:#6c7a71;font-weight:500;margin-bottom:6px;">${escapeHTML(today)}</p>
      <h1 style="font-size:30px;font-weight:800;letter-spacing:-0.5px;color:#191c1d;">${escapeHTML(greeting || 'Hello!')}</h1>
    </div>

    <!-- 30-Day Challenge Card -->
    ${program ? `
    <div class="card" style="padding:22px;margin-bottom:18px;border-left:4px solid #27AE60;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <span style="font-size: 17px;font-weight:700;color:#006c49;">🏃 Week ${program.currentWeek} of 4 · 30-Day Challenge</span>
        <span style="font-size: 16px;color:#6c7a71;">${program.progressPct}% complete</span>
      </div>
      <div style="height:4px;background:#E5E7EB;border-radius:2px;margin-bottom:14px;"><div style="height:100%;background:#27AE60;width:${program.progressPct}%;border-radius:2px;"></div></div>
      <p style="font-size: 17px;color:#191c1d;"><strong>Today's task:</strong> ${program.dailyTask}</p>
    </div>` : ''}

    <!-- Bento Grid -->
    <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:16px;">

      <!-- Risk Score Card -->
      <div class="card" style="grid-column:span 5;padding:30px;text-align:center;position:relative;">
        ${isNewUser ? `
          <!-- New user — no real score yet -->
          <div style="padding:10px 0 6px;">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);margin:0 auto 18px;display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined" style="font-size:34px;color:#059669;">monitoring</span>
            </div>
            <h3 style="font-size:20px;font-weight:800;color:#0c1e1a;margin-bottom:8px;">Your score is ready to track</h3>
            <p style="font-size:16px;color:#5c7068;line-height:1.6;margin-bottom:20px;">Log your first daily entry to get your real diabetes risk score. It only takes 2 minutes.</p>
            <button class="btn btn-primary" onclick="switchTab('log')" style="width:100%;max-width:220px;">
              <span class="material-symbols-outlined" style="font-size:20px;">edit_note</span> Log today's data
            </button>
            <p style="font-size:14px;color:#9CA3AF;margin-top:14px;font-style:italic;">Score unlocks after your first log</p>
          </div>
        ` : `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <span style="font-size: 16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6c7a71;">Diabetes Risk</span>
            <button onclick="showRiskBreakdown(state.dashboardData?.riskScore)" style="font-size: 15px;color:#006c49;font-weight:600;background:rgba(0,108,73,0.06);border:none;cursor:pointer;padding:6px 8px;border-radius:8px;">
              Why this level?
            </button>
          </div>
          <canvas id="riskGaugeCanvas" width="200" height="120" style="max-width:200px;margin:0 auto 12px;display:block;"></canvas>
          <div style="font-size:38px;font-weight:900;letter-spacing:-1px;color:${riskColor};">${riskScore?.internalScore ?? '—'}</div>
          <div style="font-size: 17px;color:#6c7a71;">out of 100</div>
          <div style="margin-top:10px;">
            <span style="padding:6px 14px;border-radius:99px;font-size: 16px;font-weight:700;background:${riskColor}18;color:${riskColor};">${riskScore?.meterLevel || '—'}</span>
          </div>
          ${scoreDelta !== null ? `
          <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
            <span style="color:#9CA3AF;font-size: 16px;">Started at ${startingScore}</span>
            <span style="color:${scoreDelta < 0 ? '#22C55E' : '#EF4444'};font-size: 16px;font-weight:600;">${scoreDelta < 0 ? '−' : '+'}${Math.abs(scoreDelta)} pts</span>
          </div>` : ''}
        `}
      </div>

      <!-- Goals Card -->
      <div class="card" style="grid-column:span 7;padding:26px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
          <h3 style="font-size: 19px;font-weight:700;">This Week's Goals</h3>
          <span style="font-size: 16px;color:#6c7a71;">${metrics?.daysLogged7d || 0}/7 days logged</span>
        </div>
        ${goalRow('directions_run', 'Activity', metrics?.moderateEqMin7d || 0, goals?.activityGoalWeeklyMin || 150, 'min')}
        ${activityFreqPill(metrics?.activityDays7d)}
        ${goalRow('footprint', 'Steps (avg)', metrics?.avgSteps7d || 0, goals?.stepsGoalDaily || 6000, '/day')}
        ${goalRow('bedtime', 'Sleep (avg)', metrics?.avgSleepHours7d || 0, goals?.sleepGoalHours || 7.5, 'hrs')}
        ${goalRow('local_drink', 'Water (avg)', metrics?.avgWaterGlasses7d || 0, goals?.waterGoalGlasses || 8, 'glasses')}
        ${data.familyHistoryPersonalised && goals?.weightGoalPct && metrics?.weightFromBaselinePct != null
      ? goalRow('monitor_weight', 'Weight goal', Math.abs(metrics.weightFromBaselinePct), goals.weightGoalPct, '% lost') : ''}
      </div>

      <!-- Safety Alert Card (replaces recs when safety override) -->
      ${isSafetyAlert ? `
      <div class="card" style="grid-column:span 12;padding:22px;border:2px solid #EF4444;background:#FEF2F2;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span class="material-symbols-outlined" style="color:#EF4444;font-size:26px;">warning</span>
          <span style="font-weight:700;font-size: 20px;color:#991B1B;">Important — Please See a Doctor</span>
        </div>
        <p style="font-size: 18px;color:#7F1D1D;margin-bottom:14px;line-height:1.6;">${recs[0]?.why || 'Your lab values may indicate diabetes. Please consult a healthcare professional.'}</p>
        <ul style="padding-left:22px;color:#7F1D1D;font-size: 18px;">
          ${(recs[0]?.actions || []).map(a => `<li style="margin-bottom:8px;">${a}</li>`).join('')}
        </ul>
      </div>` : `

      <!-- Streak Card -->
      <div class="card" style="grid-column:span 4;padding:26px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
          <div>
            <span style="font-size: 15px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6c7a71;">Current Streak</span>
            <div style="font-size:38px;font-weight:900;letter-spacing:-1px;color:#006c49;">${engagement?.streak?.currentStreak ?? 0}<span style="font-size: 20px;font-weight:600;color:#6c7a71;"> days</span></div>
          </div>
          <span style="font-size:30px;">🔥</span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:14px;" id="weekDotsRow">
          ${weekDots.map(dot => `
            <div style="flex:1;text-align:center;">
              <div style="width:28px;height:28px;border-radius:50%;background:${getQualityColor(dot)};margin:0 auto 4px;" title="${dot.date}: ${dot.signalCount || 0}/8 signals"></div>
              <span style="font-size: 13px;color:#6c7a71;font-weight:600;">${dot.dayLabel || ''}</span>
            </div>
          `).join('')}
        </div>
        <p style="font-size: 15px;color:#6c7a71;">Best: ${engagement?.streak?.personalBest ?? 0} days</p>
      </div>

      <!-- Trajectory Card -->
      <div class="card" style="grid-column:span 4;padding:26px;">
        <span style="font-size: 15px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6c7a71;display:block;margin-bottom:14px;">Risk Trajectory</span>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span class="material-symbols-outlined" style="font-size: 26px;color:${trajectory?.direction === 'improving' ? '#006c49' : trajectory?.direction === 'worsening' ? '#ba1a1a' : '#f59e0b'};">
            ${trajectory?.direction === 'improving' ? 'trending_down' : trajectory?.direction === 'worsening' ? 'trending_up' : 'trending_flat'}
          </span>
          <span style="font-size: 18px;font-weight:700;color:#191c1d;">${trajectory?.direction === 'improving' ? 'Improving' : trajectory?.direction === 'worsening' ? 'Worsening' : 'Stable'}</span>
        </div>
        <p style="font-size: 17px;color:#3c4a42;line-height:1.5;">${trajectory?.message || 'Keep logging to see your trajectory.'}</p>
      </div>

      <!-- Focus Areas (top 2 recs) -->
      <div class="card" style="grid-column:span 4;padding:26px;">
        <span style="font-size: 15px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6c7a71;display:block;margin-bottom:16px;">Top Focus Areas</span>
        ${recs.length ? recs.map((r, i) => `
          <div style="padding:14px;border-radius:12px;background:#f8f9fa;margin-bottom:10px;border-left:3px solid ${i === 0 ? '#ba1a1a' : '#f59e0b'};">
            <div style="font-size: 17px;font-weight:700;margin-bottom:3px;">${r.title}</div>
            <div style="font-size: 15px;color:#6c7a71;">${r.category}</div>
          </div>
        `).join('') : `<p style="font-size: 17px;color:#6c7a71;">Keep logging to unlock personalised focus areas.</p>`}
        <button onclick="switchTab('insights')" style="font-size: 16px;color:#006c49;font-weight:600;background:none;border:none;cursor:pointer;padding:8px 0;margin-top:6px;">
          View all recommendations →
        </button>
      </div>`}

      <!-- 7-Day Trends — 4 Chart Grid -->
      <div style="grid-column:span 8;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="card" style="padding:22px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;border-radius:10px;background:rgba(0,108,73,0.08);display:flex;align-items:center;justify-content:center;">
                <span class="material-symbols-outlined" style="font-size: 22px;color:#006c49;">footprint</span>
              </div>
              <span style="font-size: 17px;font-weight:700;color:#3c4a42;">Steps</span>
            </div>
            <span style="font-size: 22px;font-weight:800;color:#006c49;" id="stepsAvgLabel">—</span>
          </div>
          <div style="height:200px;"><canvas id="chartSteps"></canvas></div>
        </div>
        <div class="card" style="padding:22px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;border-radius:10px;background:rgba(139,92,246,0.08);display:flex;align-items:center;justify-content:center;">
                <span class="material-symbols-outlined" style="font-size: 22px;color:#8b5cf6;">bedtime</span>
              </div>
              <span style="font-size: 17px;font-weight:700;color:#3c4a42;">Sleep</span>
            </div>
            <span style="font-size: 22px;font-weight:800;color:#8b5cf6;" id="sleepAvgLabel">—</span>
          </div>
          <div style="height:200px;"><canvas id="chartSleep"></canvas></div>
        </div>
        <div class="card" style="padding:22px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;border-radius:10px;background:rgba(16,185,129,0.08);display:flex;align-items:center;justify-content:center;">
                <span class="material-symbols-outlined" style="font-size: 22px;color:#10b981;">fitness_center</span>
              </div>
              <span style="font-size: 17px;font-weight:700;color:#3c4a42;">Activity</span>
            </div>
            <span style="font-size: 22px;font-weight:800;color:#10b981;" id="activityAvgLabel">—</span>
          </div>
          <div style="height:200px;"><canvas id="chartActivity"></canvas></div>
        </div>
        <div class="card" style="padding:22px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;border-radius:10px;background:rgba(245,158,11,0.08);display:flex;align-items:center;justify-content:center;">
                <span class="material-symbols-outlined" style="font-size: 22px;color:#f59e0b;">monitor_weight</span>
              </div>
              <span style="font-size: 17px;font-weight:700;color:#3c4a42;">Weight</span>
            </div>
            <span style="font-size: 22px;font-weight:800;color:#f59e0b;" id="weightAvgLabel">—</span>
          </div>
          <div style="height:200px;"><canvas id="chartWeight"></canvas></div>
        </div>
      </div>

      <!-- Today's Tips -->
      <div class="card" style="grid-column:span 4;padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
          <span class="material-symbols-outlined" style="font-size: 22px;color:#006c49;">lightbulb</span>
          <span style="font-size: 15px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6c7a71;">Top Tips</span>
        </div>
        ${tips?.length ? tips.map(t => `
          <div style="margin-bottom:14px;">
            <p style="font-size: 18px;color:#3c4a42;line-height:1.6;border-left:3px solid #006c49;padding-left:16px;">
              ${t.text}
            </p>
            ${t.category ? `<span style="margin-top:8px;display:inline-block;padding:3px 10px;border-radius:99px;font-size: 15px;font-weight:600;background:rgba(0,108,73,0.08);color:#006c49;">${t.category}</span>` : ''}
          </div>
        `).join('') : '<p style="font-size: 18px;color:#3c4a42;line-height:1.6;border-left:3px solid #006c49;padding-left:16px;">Log your daily vitals to receive personalised health tips.</p>'}
      </div>
      
      <!-- Deep Analysis (Pattern Correlations) -->
      ${data.correlations && data.correlations.pairs && data.correlations.pairs.length > 0 ? `
      <div class="card" style="grid-column:span 12;padding:26px;background:linear-gradient(to right, #ffffff, #f8f9fa);border-left:4px solid #8b5cf6;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
          <span class="material-symbols-outlined" style="font-size: 26px;color:#8b5cf6;">psychology</span>
          <h3 style="font-size: 20px;font-weight:800;color:#191c1d;">Deep Analysis: Your Lifestyle Patterns</h3>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:16px;">
          ${data.correlations.pairs.map(p => `
            <div style="padding:18px;background:white;border:1px solid #e7e8e9;border-radius:12px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 16px;font-weight:700;color:#8b5cf6;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">${p.signalA} ⟷ ${p.signalB}</div>
              <p style="font-size: 18px;color:#3c4a42;margin-bottom:10px;font-weight:500;">${p.insight}</p>
              <p style="font-size: 17px;color:#6c7a71;line-height:1.5;">💡 ${p.actionSuggestion}</p>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    </div>
  `;
}

// D4: Activity frequency pill
function activityFreqPill(activityDays7d) {
  if (activityDays7d == null) return '';
  const colour = activityDays7d >= 5 ? '#22C55E' : activityDays7d >= 3 ? '#F59E0B' : '#EF4444';
  return `<div style="display:inline-flex;align-items:center;gap:4px;border:1px solid ${colour};border-radius:100px;padding:3px 10px;font-size: 16px;font-weight:500;color:${colour};margin-bottom:10px;">
    <span class="material-symbols-outlined" style="font-size: 18px;">calendar_today</span>
    Active ${activityDays7d} of 7 days
  </div>`;
}


function goalRow(icon, label, value, goal, unit) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  const c = pct >= 100 ? '#006c49' : pct >= 60 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#f97316';
  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:32px;height:32px;border-radius:10px;background:rgba(0,108,73,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-symbols-outlined" style="font-size: 22px;color:#006c49;">${icon}</span>
      </div>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;font-size: 16px;font-weight:600;margin-bottom:7px;">
          <span>${label}</span>
          <span style="color:${c};">${typeof value === 'number' ? value.toLocaleString() : value} <span style="color:#bbcabf;font-weight:400;">(${goal.toLocaleString()} ${unit.replace('/', '')})</span></span>
        </div>
        <div style="height:6px;background:#e7e8e9;border-radius:6px;overflow:hidden;">
          <div style="height:100%;background:${c};width:${pct}%;border-radius:6px;transition:width 0.8s ease;"></div>
        </div>
      </div>
    </div>
  `;
}

function renderRiskGauge(riskScore) {
  const canvas = document.getElementById('riskGaugeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const score = riskScore?.internalScore ?? 0;
  const colorMap = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', 'Very High': '#ef4444' };
  const color = colorMap[riskScore?.meterLevel] || '#006c49';

  canvas.width = 200; canvas.height = 110;
  const cx = 100, cy = 100, r = 80;

  ctx.clearRect(0, 0, 200, 110);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0, false);
  ctx.lineWidth = 14; ctx.strokeStyle = '#e7e8e9'; ctx.lineCap = 'round';
  ctx.stroke();

  // Fill
  const angle = Math.PI * (score / 100);
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI + angle, false);
  ctx.lineWidth = 14; ctx.strokeStyle = color; ctx.lineCap = 'round';
  ctx.stroke();
}

let dashCharts = {};

function renderDashboardChart(chartData, metric) {
  // Destroy any existing charts
  Object.values(dashCharts).forEach(c => { if (c) c.destroy(); });
  dashCharts = {};

  const labels = (chartData || []).map(d => {
    const parts = d.date.split('-');
    return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
  });

  const configs = [
    { id: 'chartSteps', key: 'steps', color: '#006c49', label: 'Steps', avgId: 'stepsAvgLabel', suffix: '' },
    { id: 'chartSleep', key: 'sleepHours', color: '#8b5cf6', label: 'Sleep (h)', avgId: 'sleepAvgLabel', suffix: 'h' },
    { id: 'chartActivity', key: 'activityMin', color: '#10b981', label: 'Activity (min)', avgId: 'activityAvgLabel', suffix: ' min' },
  ];

  configs.forEach(cfg => {
    const canvas = document.getElementById(cfg.id);
    if (!canvas) return;
    const values = (chartData || []).map(d => d[cfg.key] || 0);
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const el = document.getElementById(cfg.avgId);
    if (el) el.textContent = `${avg.toLocaleString()}${cfg.suffix}`;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 120);
    gradient.addColorStop(0, cfg.color + '30');
    gradient.addColorStop(1, cfg.color + '05');

    dashCharts[cfg.id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: cfg.color,
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: cfg.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 5,
          spanGaps: true,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#191c1d', padding: 8, cornerRadius: 8, titleFont: { size: 13 }, bodyFont: { size: 14, weight: '700' }, displayColors: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#bbcabf', maxRotation: 0 }, border: { display: false } },
          y: { grid: { color: '#f5f5f5', drawBorder: false }, ticks: { font: { size: 12 }, color: '#bbcabf', maxTicksLimit: 4 }, border: { display: false } },
        },
        interaction: { intersect: false, mode: 'index' },
      }
    });
  });

  // Weight chart — uses weights array (weekly measures)
  renderWeightChart();
}


function renderWeightChart() {
  const canvas = document.getElementById('chartWeight');
  if (!canvas) return;
  const weights = state.dashboardData?.weights || [];
  const labels = weights.map(w => {
    if (!w.date) return '';
    const parts = w.date.split('-');
    return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
  }).reverse();
  const values = weights.map(w => w.weight || null).reverse();

  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
  const el = document.getElementById('weightAvgLabel');
  if (el) el.textContent = values.length ? `${avg} kg` : '—';

  if (!values.length || values.every(v => v === 0)) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#bbcabf';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No weight data yet', canvas.width / 2, canvas.height / 2);
    return;
  }

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 120);
  gradient.addColorStop(0, '#f59e0b30');
  gradient.addColorStop(1, '#f59e0b05');

  dashCharts.chartWeight = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#f59e0b',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 5,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#191c1d', padding: 8, cornerRadius: 8, titleFont: { size: 13 }, bodyFont: { size: 14, weight: '700' }, displayColors: false, callbacks: { label: (ctx) => ctx.parsed.y + ' kg' } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#bbcabf', maxRotation: 0 }, border: { display: false } },
        y: { grid: { color: '#f5f5f5', drawBorder: false }, ticks: { font: { size: 12 }, color: '#bbcabf', maxTicksLimit: 4 }, border: { display: false } },
      },
      interaction: { intersect: false, mode: 'index' },
    }
  });
}

function switchChartMetric(metric) {
  // No longer needed — all charts visible at once
}

function bindDashboardEvents(data) { }

function dashboardSkeleton() {
  return `
    <div style="margin-bottom:30px;">
      <div class="skeleton skeleton-text" style="width:200px;height:14px;margin-bottom:10px;border-radius:8px;"></div>
      <div class="skeleton skeleton-title" style="width:300px;height:30px;border-radius:10px;"></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
      <div class="skeleton skeleton-card" style="height:220px;border-radius:20px;"></div>
      <div class="skeleton skeleton-card" style="height:220px;border-radius:20px;"></div>
      <div class="skeleton skeleton-card" style="height:220px;border-radius:20px;"></div>
      <div class="skeleton skeleton-card" style="height:240px;border-radius:20px;grid-column:span 2;"></div>
      <div class="skeleton skeleton-card" style="height:240px;border-radius:20px;"></div>
    </div>
  `;
}

function errorState(msg, retry) {
  return `
    <div class="empty-state">
      <div class="empty-icon"><span class="material-symbols-outlined" style="font-size:42px;color:#bbcabf;">wifi_off</span></div>
      <h3>Something went wrong</h3>
      <p>${msg}</p>
      <button onclick="(${retry.toString()})()" class="btn btn-primary btn-sm" style="margin-top:18px;">Retry</button>
    </div>
  `;
}
