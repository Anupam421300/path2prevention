// Path2Prevention — Log Today Tab

let activityGuides = [];
let todayLogData = {};

async function loadLogForm() {
  const container = document.getElementById('tab-log');
  container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">${[1, 2, 3].map(() => '<div class="skeleton skeleton-card" style="height:300px;border-radius:20px;"></div>').join('')}</div>`;

  try {
    const today = getTodayStr();
    const [existingLog, guides] = await Promise.all([
      api.get(`/logs/daily/${today}`).catch(() => ({})),
      activityGuides.length ? Promise.resolve(activityGuides) : api.get('/activity-guides').catch(() => [])
    ]);

    activityGuides = guides;
    todayLogData = existingLog?.empty ? {} : (existingLog || {});
    container.innerHTML = buildLogHTML(todayLogData);
    bindLogEvents();

    // B1: show locked state if log already saved today
    if (todayLogData.lockedAt) {
      showLockedState(todayLogData);
    }
  } catch (err) {
    container.innerHTML = errorState('Could not load log form.', () => loadLogForm());
  }
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function buildLogHTML(log) {
  const steps = log.steps || 0;
  const water = log.waterGlasses || 0;
  const sugary = log.dietSignals?.sugaryDrinks || 0;
  const fastFood = log.dietSignals?.fastFood || 0;
  const sleep = log.sleepHours || 7;
  const stress = log.stressScore || 0;
  const sedentary = log.sedentaryHours || 0;
  const glucose = log.fastingGlucoseMmol ? Math.round(log.fastingGlucoseMmol * 18) : '';

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return `
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;flex-wrap:wrap;gap:12px;">
      <div>
        <p style="font-size: 17px;color:#6c7a71;font-weight:500;margin-bottom:6px;">${today}</p>
        <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;">Log Today</h1>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="sameAsYesterdayBtn" class="btn btn-secondary btn-sm">
          <span class="material-symbols-outlined" style="font-size: 20px;">content_copy</span> Same as yesterday
        </button>
      </div>
    </div>

    <div class="log-bento-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

      <!-- Movement Card -->
      <div class="card" style="padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:22px;">
          <span class="material-symbols-outlined" style="font-size: 26px;color:#006c49;">directions_run</span>
          <h3 style="font-size: 20px;font-weight:700;">Movement</h3>
        </div>

        <div class="input-group">
          <label>Steps today</label>
          <div style="display:flex;align-items:center;gap:8px;">
            <button type="button" class="counter-btn" onclick="adjustStepsFree(-1000)">−1k</button>
            <input
              type="number"
              id="stepsVal"
              class="input-field"
              value="${steps}"
              min="0"
              max="50000"
              inputmode="numeric"
              placeholder="e.g. 6842"
              style="flex:1;height:48px;text-align:center;font-size: 24px;font-weight:700;"
            >
            <button type="button" class="counter-btn" onclick="adjustStepsFree(1000)">+1k</button>
          </div>
          <p style="font-size: 15px;color:#6c7a71;margin-top:6px;">Enter exact step count or tap ±1k to adjust</p>
        </div>

        <div class="input-group" style="margin-top:18px;">
          <label>Physical Activities</label>
          <div id="activitiesList">
            ${(log.physicalActivities || []).map((a, i) => activityRow(a, i)).join('')}
          </div>
          <button onclick="addActivityRow()" class="btn btn-secondary btn-sm" style="margin-top:10px;width:100%;">
            <span class="material-symbols-outlined" style="font-size: 20px;">add</span> Add activity
          </button>
        </div>

        <div class="log-mobile-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px;">
          <div class="input-group" style="margin-bottom:0;">
            <label>Weight (kg)</label>
            <input class="input-field" type="number" id="weightInput" placeholder="e.g. 72.5" min="20" max="300" step="0.1" value="${log.weightKg || ''}">
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>Waist (cm)</label>
            <input class="input-field" type="number" id="waistInput" placeholder="e.g. 88" min="40" max="200" value="${log.waistCm || ''}">
          </div>
        </div>
      </div>

      <!-- Nutrition Card -->
      <div class="card" style="padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:22px;">
          <span class="material-symbols-outlined" style="font-size: 26px;color:#10b981;">restaurant</span>
          <h3 style="font-size: 20px;font-weight:700;">Nutrition</h3>
        </div>

        <div class="input-group">
          <label>Water (glasses)</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            ${[...Array(8)].map((_, i) => `
              <button class="water-drop ${i < water ? 'filled' : ''}" data-index="${i}" onclick="toggleWater(${i})" title="Glass ${i + 1}">
                <span class="material-symbols-outlined" style="font-size: 26px;font-variation-settings:'FILL' ${i < water ? 1 : 0},'wght' 400,'GRAD' 0,'opsz' 24;">water_drop</span>
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="waterVal" value="${water}">
          <style>
            .water-drop { background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;transition:all 0.2s; }
            .water-drop .material-symbols-outlined { color:#e7e8e9; transition:color 0.2s; }
            .water-drop.filled .material-symbols-outlined { color:#0ea5e9; }
            .water-drop:hover .material-symbols-outlined { color:#0ea5e9; opacity:0.7; }
          </style>
        </div>

        <div class="log-mobile-col" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
          <div class="input-group" style="margin-bottom:0;">
            <label>Sugary drinks today</label>
          <p style="font-size: 15px;color:#6c7a71;margin-bottom:8px;">Sweet chai, soft drink, packaged juice, etc.</p>
            <div class="counter-input" style="justify-content:center;">
              <button class="counter-btn" onclick="adjustCounter('sugaryVal', -1)">−</button>
              <span class="counter-value" id="sugaryValDisplay">${sugary}</span>
              <input type="hidden" id="sugaryVal" value="${sugary}">
              <button class="counter-btn" onclick="adjustCounter('sugaryVal', 1)">+</button>
            </div>
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>Fried / processed</label>
          <p style="font-size: 15px;color:#6c7a71;margin-bottom:8px;">Samosa, chips, burger, pizza, takeout</p>
            <div class="counter-input" style="justify-content:center;">
              <button class="counter-btn" onclick="adjustCounter('fastFoodVal', -1)">−</button>
              <span class="counter-value" id="fastFoodValDisplay">${fastFood}</span>
              <input type="hidden" id="fastFoodVal" value="${fastFood}">
              <button class="counter-btn" onclick="adjustCounter('fastFoodVal', 1)">+</button>
            </div>
          </div>
        </div>

      </div>

      <!-- Rest & Wellbeing Card -->
      <div class="card" style="padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:22px;">
          <span class="material-symbols-outlined" style="font-size: 26px;color:#8b5cf6;">bedtime</span>
          <h3 style="font-size: 20px;font-weight:700;">Rest & Wellbeing</h3>
        </div>

        <div class="input-group">
          <label style="display:flex;justify-content:space-between;">
            Sleep last night
            <span style="color:#006c49;font-weight:600;" id="sleepDisplay">${sleep}h</span>
          </label>
          <input type="range" class="slider-input" id="sleepSlider" min="4" max="11" step="0.5" value="${sleep}" oninput="document.getElementById('sleepDisplay').textContent=this.value+'h'">
          <div style="display:flex;justify-content:space-between;font-size: 15px;color:#bbcabf;margin-top:6px;"><span>4h</span><span>7.5h ✓</span><span>11h</span></div>
        </div>


        <div class="input-group" style="margin-top:18px;">
          <label>Stress level today</label>
          <div style="display:flex;gap:8px;">
            ${[1, 2, 3, 4, 5].map(v => `
              <button data-stress="${v}" style="flex:1;padding:12px 4px;border-radius:10px;border:2px solid ${stress === v ? '#006c49' : '#e7e8e9'};background:${stress === v ? 'rgba(0,108,73,0.08)' : 'transparent'};font-size: 17px;font-weight:700;color:${stress === v ? '#006c49' : '#6c7a71'};cursor:pointer;transition:all 0.2s;"
                    onclick="selectStress(${v})">${v}</button>
            `).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;font-size: 14px;color:#bbcabf;margin-top:6px;"><span>Calm</span><span>Highly stressed</span></div>
          <input type="hidden" id="stressVal" value="${stress}">
        </div>
      </div>

      <!-- Sitting & Lab Values Card -->
      <div class="card" style="padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:22px;">
          <span class="material-symbols-outlined" style="font-size: 26px;color:#f59e0b;">chair</span>
          <h3 style="font-size: 20px;font-weight:700;">Sitting Time & Labs</h3>
        </div>

        <div class="input-group">
          <label style="display:flex;justify-content:space-between;">
            Sedentary hours
            <span style="color:#006c49;font-weight:600;" id="sedDisplay">${sedentary}h</span>
          </label>
          <input type="range" class="slider-input" id="sedSlider" min="0" max="16" step="0.5" value="${sedentary}" oninput="document.getElementById('sedDisplay').textContent=this.value+'h'">
          <div style="display:flex;justify-content:space-between;font-size: 15px;color:#bbcabf;margin-top:6px;"><span>0h</span><span>8h</span><span>16h</span></div>
        </div>

        <div style="margin-top:22px;padding-top:18px;border-top:1px solid rgba(187,202,191,0.2);">
          <p style="font-size: 16px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6c7a71;margin-bottom:14px;">Lab Values (optional)</p>
          <div class="log-mobile-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="input-group" style="margin-bottom:0;">
              <label>Fasting Glucose (mg/dL)</label>
              <input class="input-field" type="number" id="glucoseInput" placeholder="e.g. 95" min="50" max="400" value="${glucose}">
              <p style="font-size: 15px;color:#6c7a71;margin-top:6px;">Normal: 70–99</p>
            </div>
            <div class="input-group" style="margin-bottom:0;">
              <label>HbA1c (%)</label>
              <input class="input-field" type="number" id="hba1cInput" placeholder="e.g. 5.4" min="3" max="15" step="0.1" value="${log.hba1cPct || ''}">
              <p style="font-size: 15px;color:#6c7a71;margin-top:6px;">Normal: &lt;5.7%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="log-save-sticky" style="position:sticky;bottom:0;background:rgba(248,249,250,0.9);backdrop-filter:blur(12px);padding:18px 0;margin-top:22px;border-top:1px solid rgba(187,202,191,0.15);z-index:100;">
      <button id="saveLogBtn" onclick="saveLog()" class="btn btn-primary btn-full" style="max-width:400px;margin:0 auto;display:flex;">
        <span class="material-symbols-outlined" style="font-size: 22px;">save</span> Save today's log
      </button>
    </div>
  `;
}

function activityRow(a, i) {
  const types = activityGuides.length ? activityGuides.map(g => `<option value="${g.type}" ${a.type === g.type ? 'selected' : ''}>${g.displayName}</option>`).join('') :
    `<option value="walking" ${a.type === 'walking' ? 'selected' : ''}>Walking</option>
     <option value="cycling" ${a.type === 'cycling' ? 'selected' : ''}>Cycling</option>
     <option value="running" ${a.type === 'running' ? 'selected' : ''}>Running</option>
     <option value="swimming" ${a.type === 'swimming' ? 'selected' : ''}>Swimming</option>
     <option value="yoga" ${a.type === 'yoga' ? 'selected' : ''}>Yoga</option>`;

  return `
    <div class="activity-row" data-idx="${i}" style="display:flex;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(187,202,191,0.15);">
      <select class="input-field" style="flex:2;padding:10px 10px;font-size: 17px;" name="actType">${types}</select>
      <select class="input-field" style="flex:1;padding:10px 10px;font-size: 17px;" name="actIntensity">
        <option value="light" ${a.intensity === 'light' ? 'selected' : ''}>Light</option>
        <option value="moderate" ${a.intensity === 'moderate' ? 'selected' : ''}>Moderate</option>
        <option value="vigorous" ${a.intensity === 'vigorous' ? 'selected' : ''}>Vigorous</option>
      </select>
      <input class="input-field" type="number" placeholder="min" name="actMin" value="${a.minutes || ''}" min="1" max="300"
             style="width:70px;padding:10px 10px;font-size: 17px;">
      <button onclick="this.closest('.activity-row').remove()" style="background:none;border:none;cursor:pointer;color:#6c7a71;padding:6px;">
        <span class="material-symbols-outlined" style="font-size: 22px;">close</span>
      </button>
    </div>
  `;
}

let activityRowCount = 0;
function addActivityRow() {
  const list = document.getElementById('activitiesList');
  const div = document.createElement('div');
  div.innerHTML = activityRow({ type: 'walking', intensity: 'moderate', minutes: '' }, activityRowCount++);
  list.appendChild(div.firstElementChild);
}

function adjustStepsFree(delta) {
  const input = document.getElementById('stepsVal');
  const newVal = Math.max(0, Math.min(50000, parseInt(input.value || 0) + delta));
  input.value = newVal;
}

function adjustCounter(id, delta) {
  const input = document.getElementById(id);
  const min = parseInt(input.min || 0);
  const max = parseInt(input.max || 999999);
  const newVal = Math.max(min, Math.min(max, parseInt(input.value || 0) + delta));
  input.value = newVal;
  const display = document.getElementById(id + 'Display');
  if (display) display.textContent = newVal.toLocaleString();
}

function toggleWater(idx) {
  const current = parseInt(document.getElementById('waterVal').value || 0);
  const newVal = idx < current ? idx : idx + 1;
  document.getElementById('waterVal').value = Math.min(8, newVal);
  document.querySelectorAll('.water-drop').forEach((btn, i) => {
    const filled = i < Math.min(8, newVal);
    btn.classList.toggle('filled', filled);
    btn.querySelector('.material-symbols-outlined').style.fontVariationSettings = `'FILL' ${filled ? 1 : 0},'wght' 400,'GRAD' 0,'opsz' 24`;
  });
}
function selectStress(val) {
  document.getElementById('stressVal').value = val;
  document.querySelectorAll('[data-stress]').forEach(el => {
    const isSelected = parseInt(el.dataset.stress) === val;
    el.style.borderColor = isSelected ? '#006c49' : '#e7e8e9';
    el.style.background = isSelected ? 'rgba(0,108,73,0.08)' : 'transparent';
    el.style.color = isSelected ? '#006c49' : '#6c7a71';
  });
}



function collectActivities() {
  const rows = document.querySelectorAll('#activitiesList .activity-row');
  const activities = [];
  rows.forEach(row => {
    const type = row.querySelector('[name=actType]')?.value;
    const intensity = row.querySelector('[name=actIntensity]')?.value;
    const minutes = parseInt(row.querySelector('[name=actMin]')?.value || 0);
    if (type && intensity && minutes > 0) activities.push({ type, intensity, minutes });
  });
  return activities;
}

async function saveLog() {
  const btn = document.getElementById('saveLogBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Saving…';

  try {
    const glucoseVal = parseFloat(document.getElementById('glucoseInput')?.value || 0);
    const payload = {
      date: getTodayStr(),
      steps: parseInt(document.getElementById('stepsVal')?.value || 0),
      sleepHours: parseFloat(document.getElementById('sleepSlider')?.value || 0),
      waterGlasses: parseInt(document.getElementById('waterVal')?.value || 0),
      sedentaryHours: parseFloat(document.getElementById('sedSlider')?.value || 0),
      stressScore: parseInt(document.getElementById('stressVal')?.value || 0) || undefined,
      dietSignals: {
        sugaryDrinks: parseInt(document.getElementById('sugaryVal')?.value || 0),
        fastFood: parseInt(document.getElementById('fastFoodVal')?.value || 0),
      },
      physicalActivities: collectActivities(),
      fastingGlucoseMmol: glucoseVal > 0 ? +(glucoseVal / 18).toFixed(2) : undefined,
    };

    // Remove undefined fields
    Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
    if (!payload.stressScore) delete payload.stressScore;
    if (!payload.fastingGlucoseMmol) delete payload.fastingGlucoseMmol;

    const result = await api.post('/logs/daily', payload);

    // Save weekly measure if weight was entered
    const weight = parseFloat(document.getElementById('weightInput')?.value || 0);
    if (weight > 0) {
      const waist = parseFloat(document.getElementById('waistInput')?.value || 0);
      await api.post('/logs/weekly', { weightKg: weight, ...(waist > 0 ? { waistCm: waist } : {}) }).catch(() => { });
    }

    // Update sidebar risk
    if (result.riskScore) updateSidebarRisk(result.riskScore);



    // M8: show risk score delta
    const newScore = result.riskScore?.internalScore;
    const prevScore = window.APP?.lastRiskScore;
    if (newScore != null && prevScore != null) {
      const delta = newScore - prevScore;
      const sign = delta < 0 ? '−' : '+';
      const type = delta < 0 ? 'success' : delta > 0 ? 'warning' : 'info';
      const label = delta < 0 ? 'improvement' : delta > 0 ? 'increase' : 'no change';
      const msg = delta !== 0
        ? `Score ${sign}${Math.abs(delta)} pts (${label}) → ${result.riskScore.meterLevel}`
        : `Score unchanged at ${newScore} (${result.riskScore.meterLevel})`;
      showToast(msg, type, 5000);
    } else {
      showToast("Today's log saved! Risk score updated.", 'success');
    }
    if (window.APP) window.APP.lastRiskScore = newScore;

    // U4: Show log summary card
    showLogSummary(payload);

    // Show locked state
    showLockedState(payload);

    // Refresh dashboard and insights cache
    if (typeof window.forceTabRefresh === 'function') {
      window.forceTabRefresh('dashboard');
      window.forceTabRefresh('insights');
    } else {
      setTimeout(() => { if (typeof loadDashboard === 'function') loadDashboard(); }, 1500);
    }

  } catch (err) {
    // Handle log already locked
    if (err.code === 'LOG_LOCKED') {
      showToast('Today already logged — see you tomorrow! 🌟', 'info');
      showLockedState(todayLogData);
      // Still refresh dashboard so any previously saved data is visible
      if (typeof window.forceTabRefresh === 'function') {
        window.forceTabRefresh('dashboard');
        window.forceTabRefresh('insights');
      }
      return;
    }
    showToast(err.message || 'Save failed. Please try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 22px;">save</span> Save today\'s log';
  }
}

// B1: Show locked/saved state
function showLockedState(log) {
  document.querySelectorAll('#tab-log input, #tab-log select, #tab-log button:not(.close-locked)')
    .forEach(el => el.disabled = true);

  const existing = document.querySelector('.log-locked-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.className = 'log-locked-banner';
  banner.style.cssText = 'display:flex;align-items:center;gap:10px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 18px;color:#1A5C35;font-weight:500;font-size: 19px;margin-bottom:22px;';
  banner.innerHTML = '<span class="material-symbols-outlined" style="color:#27AE60;font-size: 26px;">check_circle</span> Today\'s log is saved — see you tomorrow!';
  document.getElementById('tab-log').prepend(banner);

  const saveBtn = document.getElementById('saveLogBtn');
  if (saveBtn) saveBtn.style.display = 'none';
}

// U4: Log summary card
function showLogSummary(log) {
  const activities = (log.physicalActivities || []);
  const totalModEq = activities.reduce((s, a) => s + (a.moderateEqMin || 0), 0);
  const items = [
    log.steps > 0 ? `🚶 ${parseInt(log.steps).toLocaleString()} steps` : null,
    log.sleepHours > 0 ? `😴 ${log.sleepHours}h sleep` : null,
    activities.length > 0 ? `💪 ${totalModEq} mod-eq min activity` : null,
    log.waterGlasses > 0 ? `💧 ${log.waterGlasses} glasses water` : null,
    log.stressScore ? `😤 Stress: ${log.stressScore}/5` : null,
  ].filter(Boolean);

  const summary = document.createElement('div');
  summary.style.cssText = 'background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:18px;margin-bottom:18px;transition:opacity 0.3s ease;';
  summary.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size: 19px;color:#1A5C35;margin-bottom:12px;">
      <span class="material-symbols-outlined" style="color:#27AE60;">check_circle</span>
      Log saved!
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${items.map(i => `<span style="background:white;border:1px solid #BBF7D0;border-radius:100px;padding:6px 12px;font-size: 17px;color:#1A5C35;">${i}</span>`).join('')}
    </div>
  `;
  document.getElementById('tab-log').prepend(summary);
  setTimeout(() => { summary.style.opacity = '0'; setTimeout(() => summary.remove(), 300); }, 8000);
}

function bindLogEvents() {
  document.getElementById('sameAsYesterdayBtn')?.addEventListener('click', async () => {
    try {
      const yesterday = getYesterdayStr();
      const log = await api.get(`/logs/daily/${yesterday}`);
      if (!log || log.empty) { showToast('No log found for yesterday.', 'info'); return; }
      todayLogData = log;
      document.getElementById('tab-log').innerHTML = buildLogHTML(log);
      bindLogEvents();
      showToast('Pre-filled with yesterday\'s data.', 'info');
    } catch { showToast('Could not load yesterday\'s log.', 'error'); }
  });
}
