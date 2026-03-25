// Path2Prevention — Popups & Modals (All use real API data)

// ── Generic modal helpers ──
function openModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => el.classList.add('open'), 10);
}
function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => el.classList.add('hidden'), 250);
}
function openDrawer() {
  const el = document.getElementById('evidenceDrawerBackdrop');
  el.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => el.classList.add('open'), 10);
}
function closeDrawer() {
  const el = document.getElementById('evidenceDrawerBackdrop');
  el.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => el.classList.add('hidden'), 400);
}

// Click outside modal to close
document.querySelectorAll('.modal-backdrop').forEach(el => {
  el.addEventListener('click', (e) => {
    if (e.target === el) closeModal(el.id);
  });
});
document.getElementById('evidenceDrawerBackdrop')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('evidenceDrawerBackdrop')) closeDrawer();
});

// ── 1. Risk Breakdown Modal ──
function showRiskBreakdown(riskScore) {
  if (!riskScore) return;
  const { internalScore, meterLevel, breakdown = [] } = riskScore;
  const colorMap = { Low: '#006c49', Medium: '#f59e0b', High: '#f97316', 'Very High': '#ba1a1a' };
  const color = colorMap[meterLevel] || '#006c49';

  const container = document.getElementById('riskBreakdownContent');
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
      <span style="padding:6px 12px;background:${color}18;color:${color};font-size: 15px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;border-radius:99px;">${meterLevel} · ${internalScore} / 100</span>
    </div>
    <div style="height:8px;background:#e7e8e9;border-radius:8px;overflow:hidden;margin-bottom:26px;">
      <div style="height:100%;background:${color};width:${internalScore}%;border-radius:8px;transition:width 0.8s ease;"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:22px;">
      ${breakdown.map(b => `
        <div style="padding:16px;border-radius:14px;background:#f8f9fa;display:flex;gap:14px;align-items:flex-start;">
          <div style="width:36px;height:36px;border-radius:50%;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <span class="material-symbols-outlined" style="font-size: 22px;color:${color};">${getFactorIcon(b.factor)}</span>
          </div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size: 18px;font-weight:600;">${b.factor}</span>
              <span style="font-size: 17px;font-weight:700;color:${color};">+${b.contribution} pts</span>
            </div>
            <p style="font-size: 16px;color:#3c4a42;line-height:1.5;">${b.note}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="padding:16px;background:#006c49/5%;border-radius:14px;display:flex;gap:10px;border:1px solid rgba(0,108,73,0.1);background:rgba(0,108,73,0.04);">
      <span class="material-symbols-outlined" style="font-size: 22px;color:#006c49;flex-shrink:0;">info</span>
      <p style="font-size: 16px;color:#3c4a42;line-height:1.5;">Based on the <strong>National Diabetes Prevention Program (DPP)</strong>. Small lifestyle changes can reduce risk by up to 58%.</p>
    </div>
  `;
  openModal('riskBreakdownBackdrop');
}

function getFactorIcon(factor) {
  const icons = {
    'Family History': 'family_history', 'Physical Activity': 'directions_run',
    'BMI': 'monitor_weight', 'Steps': 'footprint', 'Sugary Drinks': 'local_drink',
    'Sleep': 'bedtime', 'Fast Food': 'restaurant', 'Sedentary Hours': 'chair',
    'Activity': 'fitness_center',
  };
  return icons[factor] || 'health_metrics';
}

// ── 2. Evidence Panel (Drawer) ──
async function showEvidencePanel(evidenceRefs) {
  const content = document.getElementById('evidencePanelContent');
  content.innerHTML = `
    <div class="skeleton skeleton-card" style="height:110px;margin-bottom:14px;border-radius:14px;"></div>
    <div class="skeleton skeleton-card" style="height:110px;margin-bottom:14px;border-radius:14px;"></div>
  `;
  openDrawer();

  try {
    const idsParam = (evidenceRefs || []).join(',');
    const sources = idsParam
      ? await api.get(`/content/evidence?ids=${encodeURIComponent(idsParam)}`)
      : [];

    if (!sources.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><span class="material-symbols-outlined" style="font-size:42px;color:#bbcabf;">science</span></div>
          <h3>No studies linked</h3>
          <p>This recommendation is based on general clinical guidelines from WHO and ADA.</p>
        </div>
        ${defaultEvidenceSources()}
      `;
      return;
    }

    content.innerHTML = sources.map(s => `
      <div style="padding:20px;background:#f8f9fa;border-radius:16px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <div style="padding:2px 8px;background:#191c1d;color:white;border-radius:4px;font-size: 14px;font-weight:700;">${s.publisher || 'Study'}</div>
          <span style="font-size: 14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6c7a71;">${s.publisher || ''}</span>
        </div>
        <h4 style="font-size: 18px;font-weight:700;margin-bottom:10px;color:#191c1d;line-height:1.4;">${s.title}</h4>
        <p style="font-size: 16px;color:#3c4a42;line-height:1.5;margin-bottom:12px;">${s.snippet || ''}</p>
        ${s.url ? `<a href="${s.url}" target="_blank" rel="noopener" style="font-size: 16px;font-weight:700;color:#006c49;display:flex;align-items:center;gap:4px;">Read study <span class="material-symbols-outlined" style="font-size: 18px;">open_in_new</span></a>` : ''}
      </div>
    `).join('');
  } catch {
    content.innerHTML = defaultEvidenceSources();
  }
}

function defaultEvidenceSources() {
  const defaults = [
    { pub: 'WHO', color: '#1565c0', title: 'Global guidelines on physical activity and sedentary behaviour.', snippet: 'Systematic review confirming 58% risk reduction in pre-diabetic patients through structured 150min/week activity.' },
    { pub: 'ADA', color: '#006c49', title: 'Standards of Medical Care in Diabetes — 2024.', snippet: 'Updated clinical pathways for glycaemic management and lifestyle interventions.' },
    { pub: 'NEJM', color: '#333', title: 'Reduction in the Incidence of Type 2 Diabetes with Lifestyle Intervention.', snippet: 'The foundational clinical trial proving lifestyle efficacy over pharmaceutical intervention.' },
  ];
  return defaults.map(d => `
    <div style="padding:20px;background:#f8f9fa;border-radius:16px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <div style="padding:2px 8px;background:${d.color};color:white;border-radius:4px;font-size: 14px;font-weight:700;">${d.pub}</div>
      </div>
      <h4 style="font-size: 18px;font-weight:700;margin-bottom:10px;color:#191c1d;line-height:1.4;">${d.title}</h4>
      <p style="font-size: 16px;color:#3c4a42;line-height:1.5;">${d.snippet}</p>
    </div>
  `).join('');
}


// ── 5. Very High Risk Warning ──
function showVeryHighRiskWarning() {
  openModal('riskWarningBackdrop');
}
