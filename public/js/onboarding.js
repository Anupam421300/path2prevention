// Path2Prevention — Onboarding Wizard (4-step)

let onboardingStep = 1;
let onboardingData = {};

function startOnboarding() {
  onboardingStep = 1;
  onboardingData = {};
  const overlay = document.getElementById('onboardingOverlay');
  overlay.classList.remove('hidden');
  renderOnboardingStep();
}

function renderOnboardingStep() {
  updateStepDots();
  const content = document.getElementById('onboardingContent');
  document.getElementById('stepLabel').textContent = `Step ${onboardingStep} of 4`;

  const stepRenderers = { 1: ob_step1, 2: ob_step2, 3: ob_step3, 4: ob_step4 };
  
  // Slide out to left
  content.style.opacity = '0';
  content.style.transform = 'translateX(-20px)';
  content.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  
  setTimeout(() => {
    content.innerHTML = (stepRenderers[onboardingStep] || ob_step1)();
    
    // Position for slide in from right
    content.style.transition = 'none';
    content.style.transform = 'translateX(20px)';
    
    // Force reflow
    void content.offsetWidth;
    
    // Execute slide in
    content.style.transition = 'opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    content.style.opacity = '1';
    content.style.transform = 'translateX(0)';
  }, 200);
}

function updateStepDots() {
  const container = document.getElementById('stepDots');
  container.innerHTML = [1, 2, 3, 4].map(i => `
    <div style="
      width:${i === onboardingStep ? '28px' : '8px'};height:8px;border-radius:4px;
      background:${i <= onboardingStep ? 'var(--green-primary)' : 'var(--bg-surface-high)'};
      transition:all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    "></div>
  `).join('');
}

// ── Step 1: Personal Profile ──
function ob_step1() {
  const d = onboardingData;
  return `
    <div style="width:100%; flex:1; display:flex; flex-direction:column;">
      <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--green-light);border-radius:99px;font-size: 16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--green-darker);margin-bottom:22px;width:max-content;">
        <span class="material-symbols-outlined" style="font-size: 20px;">person</span> Personal Profile
      </div>
      <h2 style="font-size:34px;font-weight:800;letter-spacing:-1px;margin-bottom:14px;line-height:1.2;color:var(--text-primary);">Let's get to know you</h2>
      <p style="font-size: 19px;color:var(--text-muted);margin-bottom:34px;line-height:1.6;">We'll use these details to personalise your risk assessment and recommendations.</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
        <div class="input-group" style="margin-bottom:0;">
          <label>First name</label>
          <input class="input-field" type="text" id="ob1FirstName" placeholder="e.g. Priya" value="${escapeHTML(d.firstName)}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Last name</label>
          <input class="input-field" type="text" id="ob1LastName" placeholder="e.g. Sharma" value="${escapeHTML(d.lastName)}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Date of birth</label>
          <input class="input-field" type="date" id="ob1Dob" value="${d.dob || ''}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Biological sex</label>
          <select class="input-field" id="ob1Sex">
            <option value="">Select</option>
            <option value="male" ${d.sex === 'male' ? 'selected' : ''}>Male</option>
            <option value="female" ${d.sex === 'female' ? 'selected' : ''}>Female</option>
            <option value="other" ${d.sex === 'other' ? 'selected' : ''}>Other / Prefer not to say</option>
          </select>
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Height (cm)</label>
          <input class="input-field" type="number" id="ob1Height" placeholder="e.g. 165" min="50" max="250" value="${d.heightCm || ''}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
          <label>Weight (kg)</label>
          <input class="input-field" type="number" id="ob1Weight" placeholder="e.g. 70.5" min="20" max="300" step="0.1" value="${d.weightKg || ''}">
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:auto;padding-top:30px;">
        <button onclick="ob_step1_next()" class="btn btn-primary">
          Continue <span class="material-symbols-outlined" style="font-size: 22px;vertical-align:middle;">arrow_forward</span>
        </button>
      </div>
    </div>
  `;
}

function ob_step1_next() {
  const fn = document.getElementById('ob1FirstName')?.value.trim();
  const ln = document.getElementById('ob1LastName')?.value.trim();
  const dob = document.getElementById('ob1Dob')?.value;
  const sex = document.getElementById('ob1Sex')?.value;
  const height = document.getElementById('ob1Height')?.value;
  const weight = document.getElementById('ob1Weight')?.value;

  if (!fn || !ln || !dob || !sex || !height || !weight) {
    showToast('Please fill out all fields to continue.', 'error');
    return;
  }

  onboardingData.firstName = fn;
  onboardingData.lastName = ln;
  onboardingData.dob = dob;
  onboardingData.sex = sex;
  onboardingData.heightCm = parseFloat(height);
  onboardingData.weightKg = parseFloat(weight);
  onboardingStep = 2;
  renderOnboardingStep();
}

// ── Step 2: Health Data ──
function ob_step2() {
  const d = onboardingData;
  const conditions = ['Type 2 Diabetes', 'None'];
  return `
    <div style="width:100%; flex:1; display:flex; flex-direction:column;">
      <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f3e8ff;border-radius:99px;font-size: 16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b21a8;margin-bottom:22px;width:max-content;">
        <span class="material-symbols-outlined" style="font-size: 20px;">biotech</span> Biometric Vitality
      </div>
      <h2 style="font-size:34px;font-weight:800;letter-spacing:-1px;margin-bottom:14px;line-height:1.2;color:var(--text-primary);">Your health baseline</h2>
      <p style="font-size: 19px;color:var(--text-muted);margin-bottom:34px;line-height:1.6;">These critical measurements help us calculate your diabetes risk accurately.</p>

      <div style="padding:22px;background:rgba(245,158,11,0.06);border-radius:14px;border:1px solid rgba(245,158,11,0.15);margin-bottom:22px;">
        <p style="font-size: 15px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#92400e;margin-bottom:14px;">Lab Values (from your last check-up)</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="input-group" style="margin-bottom:0;">
            <label>Fasting Glucose (mg/dL)</label>
            <input class="input-field" type="number" id="ob2Glucose" placeholder="e.g. 95" min="50" max="400">
            <p style="font-size: 15px;color:#6c7a71;margin-top:6px;">Normal: 70–99</p>
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>HbA1c (%)</label>
            <input class="input-field" type="number" id="ob2HbA1c" placeholder="e.g. 5.4" min="3" max="15" step="0.1">
            <p style="font-size: 15px;color:#6c7a71;margin-top:6px;">Normal: &lt;5.7%</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom:22px;">
        <p style="font-size: 17px;font-weight:700;margin-bottom:14px;">Family history of (select all that apply):</p>
        <div style="display:flex;flex-direction:column;gap:8px;" id="conditionList">
          ${conditions.map(c => `
            <label style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;border:1.5px solid #e7e8e9;cursor:pointer;transition:all 0.2s;"
                   onclick="toggleFHCondition(this,'${c}')">
              <div style="width:18px;height:18px;border-radius:4px;border:2px solid #e7e8e9;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s;" class="fh-check">
              </div>
              <span style="font-size: 18px;font-weight:500;">${c}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:30px;">
        <button onclick="ob_back()" class="btn btn-ghost">
          <span class="material-symbols-outlined" style="font-size: 22px;vertical-align:middle;">arrow_back</span> Back
        </button>
        <button onclick="ob_step2_next()" class="btn btn-primary">
          Continue <span class="material-symbols-outlined" style="font-size: 22px;vertical-align:middle;">arrow_forward</span>
        </button>
      </div>
    </div>
  `;
}

const selectedConditions = new Set();
function toggleFHCondition(label, condition) {
  if (condition === 'None') {
    selectedConditions.clear();
    selectedConditions.add('None');
  } else {
    selectedConditions.delete('None');
    if (selectedConditions.has(condition)) selectedConditions.delete(condition);
    else selectedConditions.add(condition);
  }
  document.querySelectorAll('#conditionList label').forEach(el => {
    const c = el.querySelector('span').textContent;
    const active = selectedConditions.has(c);
    el.style.borderColor = active ? 'var(--green-primary)' : 'var(--border-card)';
    el.style.background = active ? 'var(--green-light)' : 'transparent';
    const check = el.querySelector('.fh-check');
    check.style.background = active ? 'var(--green-primary)' : 'transparent';
    check.style.borderColor = active ? 'var(--green-primary)' : 'var(--border-card)';
    check.innerHTML = active ? '<span class="material-symbols-outlined" style="font-size: 17px;color:white;font-variation-settings:\'FILL\' 1,\'wght\' 700,\'GRAD\' 0,\'opsz\' 24;">check</span>' : '';
  });
}

function ob_step2_next() {
  const glucoseVal = document.getElementById('ob2Glucose')?.value;
  const hba1cVal = document.getElementById('ob2HbA1c')?.value;

  if (!glucoseVal || !hba1cVal) {
    showToast('Please fill out all lab values to continue.', 'error');
    return;
  }

  if (selectedConditions.size === 0) {
    showToast('Please select a family history option to continue.', 'error');
    return;
  }

  const glucose = parseFloat(glucoseVal);
  const hba1c = parseFloat(hba1cVal);

  if (glucose > 0) onboardingData.fastingGlucoseMmol = +(glucose / 18).toFixed(2);
  if (hba1c > 0) onboardingData.hba1cPct = hba1c;
  onboardingData.familyHistory = {
    firstDegreeT2D: selectedConditions.has('Type 2 Diabetes') ? 'yes' : 'no',
  };
  onboardingStep = 3;
  renderOnboardingStep();
}

// ── Step 3: Lifestyle Scan ──
function ob_step3() {
  return `
    <div style="width:100%; flex:1; display:flex; flex-direction:column;">
      <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#fef3c7;border-radius:99px;font-size: 16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#92400e;margin-bottom:22px;width:max-content;">
        <span class="material-symbols-outlined" style="font-size: 20px;">directions_run</span> Lifestyle Scan
      </div>
      <h2 style="font-size:34px;font-weight:800;letter-spacing:-1px;margin-bottom:14px;line-height:1.2;color:var(--text-primary);">Your typical week</h2>
      <p style="font-size: 19px;color:var(--text-muted);margin-bottom:34px;line-height:1.6;">A quick snapshot of your daily habits to build your initial risk profile.</p>

      <div style="margin-bottom:26px;">
        <label style="display:flex;justify-content:space-between;font-size: 18px;font-weight:600;margin-bottom:14px;">
          Typical daily steps <span id="ob3StepsDisplay" style="color:var(--green-darker);font-weight:800;font-size: 22px;">5,000</span>
        </label>
        <input type="range" style="width:100%;" id="ob3Steps" min="1000" max="20000" step="500" value="5000"
               oninput="document.getElementById('ob3StepsDisplay').textContent=parseInt(this.value).toLocaleString()">
        <div style="display:flex;justify-content:space-between;font-size: 15px;color:#bbcabf;margin-top:6px;"><span>Sedentary</span><span>Very active</span></div>
      </div>

      <div style="margin-bottom:26px;">
        <label style="display:flex;justify-content:space-between;font-size: 18px;font-weight:600;margin-bottom:14px;">
          Typical sleep <span id="ob3SleepDisplay" style="color:var(--green-darker);font-weight:800;font-size: 22px;">7h</span>
        </label>
        <input type="range" style="width:100%;" id="ob3Sleep" min="4" max="11" step="0.5" value="7"
               oninput="document.getElementById('ob3SleepDisplay').textContent=this.value+'h'">
        <div style="display:flex;justify-content:space-between;font-size: 15px;color:#bbcabf;margin-top:6px;"><span>4h</span><span>11h</span></div>
      </div>

      <div style="margin-bottom:26px;">
        <label style="display:flex;justify-content:space-between;font-size: 18px;font-weight:600;margin-bottom:14px;">
          Sugary drinks per day <span id="ob3SugaryDisplay" style="color:var(--green-darker);font-weight:800;font-size: 22px;">1</span>
        </label>
        <input type="range" style="width:100%;" id="ob3Sugary" min="0" max="8" step="1" value="1"
               oninput="document.getElementById('ob3SugaryDisplay').textContent=this.value">
      </div>



      <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:30px;">
        <button onclick="ob_back()" class="btn btn-ghost">
          <span class="material-symbols-outlined" style="font-size: 22px;vertical-align:middle;">arrow_back</span> Back
        </button>
        <button onclick="ob_step3_next()" class="btn btn-primary">
          Build my roadmap <span class="material-symbols-outlined" style="font-size: 22px;vertical-align:middle;">auto_awesome</span>
        </button>
      </div>
    </div>
  `;
}

async function ob_step3_next() {
  onboardingData.lifestyleSnapshot = {
    typicalSteps: parseInt(document.getElementById('ob3Steps')?.value || 5000),
    typicalSleepHours: parseFloat(document.getElementById('ob3Sleep')?.value || 7),
    typicalSugaryDrinks: parseInt(document.getElementById('ob3Sugary')?.value || 1),
  };

  // Show analyzing screen
  document.getElementById('onboardingContent').innerHTML = `
    <div style="text-align:center;max-width:400px;margin:0 auto;padding:42px 0;">
      <div style="width:80px;height:80px;border-radius:50%;background:rgba(0,108,73,0.08);margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
        <span class="material-symbols-outlined" style="font-size:38px;color:#006c49;animation:spin 2s linear infinite;">sync</span>
      </div>
      <h2 style="font-size:26px;font-weight:800;margin-bottom:10px;">Building your roadmap…</h2>
      <p style="font-size: 18px;color:#6c7a71;line-height:1.6;margin-bottom:34px;">We're computing your personalised risk score and creating targeted recommendations for you.</p>
      <div style="display:flex;flex-direction:column;gap:10px;text-align:left;">
        ${['Analysing health profile', 'Computing risk score (8 factors)', 'Generating personalised recommendations', 'Building your prevention timeline'].map((s, i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:12px;background:#f8f9fa;opacity:${1 - i * 0.15};">
            <span class="material-symbols-outlined" style="font-size: 20px;color:#006c49;">check_circle</span>
            <span style="font-size: 17px;font-weight:500;">${s}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('stepLabel').textContent = 'Analysing…';

  try {
    const payload = {
      firstName: onboardingData.firstName || undefined,
      lastName: onboardingData.lastName || undefined,
      dob: onboardingData.dob || undefined,
      sex: onboardingData.sex === 'other' ? 'prefer_not_to_say' : (onboardingData.sex || undefined),
      heightCm: onboardingData.heightCm || undefined,
      baselineWeightKg: onboardingData.weightKg || undefined,
      familyHistory: onboardingData.familyHistory,
      optionalLabs: {
        fastingGlucoseMmol: onboardingData.fastingGlucoseMmol || undefined,
        hba1cPct: onboardingData.hba1cPct || undefined
      },
      lifestyleSnapshot: onboardingData.lifestyleSnapshot,
    };
    
    // Save all profile data
    await api.put('/profile', payload);

    // Trigger pipeline purely to estimate risk (no daily log saved!)
    const pipelineResult = await api.post('/profile/estimate-risk', {});

    onboardingData._riskResult = pipelineResult?.riskScore;
    onboardingStep = 4;
    renderOnboardingStep();
  } catch (err) {
    console.error("ONBOARDING API ERROR:", err);
    alert("System API Error: " + (err.message || err.error || "Unknown error"));
    showToast(err.message || 'Setup error. Please try again.', 'error');
    onboardingStep = 3;
    renderOnboardingStep();
  }
}

// ── Step 4: Your Roadmap ──
function ob_step4() {
  const risk = onboardingData._riskResult;
  const colorMap = { Low: '#006c49', Medium: '#f59e0b', High: '#f97316', 'Very High': '#ba1a1a' };
  const color = colorMap[risk?.meterLevel] || '#006c49';
  const score = risk?.internalScore ?? '?';
  const level = risk?.meterLevel ?? '—';

  return `
    <div style="width:100%; flex:1; display:flex; flex-direction:column;">
      <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--green-light);border-radius:99px;font-size: 16px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--green-darker);margin-bottom:22px;width:max-content;">
        <span class="material-symbols-outlined" style="font-size: 20px;">route</span> Your Path to Vitality
      </div>
      <h2 style="font-size:34px;font-weight:800;letter-spacing:-1px;margin-bottom:14px;line-height:1.2;color:var(--text-primary);">Your roadmap is ready</h2>
      <p style="font-size: 19px;color:var(--text-muted);margin-bottom:30px;line-height:1.6;">Based on your health profile, here's your personalised prevention journey.</p>

      <!-- Welcome summary -->
      <div style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1px solid #BBF7D0;margin-bottom:26px;display:flex;align-items:center;gap:18px;">
        <div style="text-align:center;flex-shrink:0;width:60px;height:60px;background:#27AE60;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(39,174,96,0.3);">
          <span class="material-symbols-outlined" style="font-size:32px;color:white;">task_alt</span>
        </div>
        <div>
          <div style="font-size: 19px;font-weight:800;color:#0c1e1a;margin-bottom:4px;">Your profile is complete!</div>
          <div style="font-size: 16px;color:#3c4a42;line-height:1.4;">Head to your dashboard to log your first daily entry and unlock your personalized risk score.</div>
        </div>
      </div>
      <!-- Timeline -->
      <div style="position:relative;padding-left:26px;margin-bottom:26px;">
        <div style="position:absolute;left:7px;top:12px;bottom:12px;width:2px;background:linear-gradient(to bottom,#006c49,#e7e8e9);"></div>

        ${[
      { icon: 'check_circle', color: '#006c49', label: 'Today', status: 'complete', desc: 'Initial assessment complete — your baseline is set.' },
      { icon: 'radio_button_unchecked', color: '#006c49', label: 'Days 1–14', status: 'next', desc: 'Daily logging unlocks pattern correlations and sharpens recommendations.' },
      { icon: 'radio_button_unchecked', color: '#bbcabf', label: 'First 30 days', status: 'future', desc: 'Lifestyle habits begin to show measurable risk reduction.' },
      { icon: 'flag', color: '#bbcabf', label: '3 months', status: 'future', desc: 'Aim for a risk score drop of 10–20 points through consistency.' },
    ].map(t => `
          <div style="display:flex;gap:14px;margin-bottom:22px;position:relative;">
            <span class="material-symbols-outlined" style="font-size: 20px;color:${t.color};flex-shrink:0;margin-top:2px;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">${t.icon}</span>
            <div>
              <div style="font-size: 16px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${t.color};">${t.label}</div>
              <p style="font-size: 17px;color:#3c4a42;line-height:1.5;margin-top:2px;">${t.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:auto;padding-top:26px;">
        <button onclick="finishOnboarding()" class="btn btn-primary btn-full" style="font-size: 20px;">
        Enter my dashboard <span class="material-symbols-outlined" style="font-size: 22px;vertical-align:middle;">arrow_forward</span>
      </button>
      <p style="font-size: 15px;color:#bbcabf;text-align:center;margin-top:16px;line-height:1.5;">
        Path2Prevention is for self-management and is not a substitute for professional medical advice.
      </p>
    </div>
  `;
}

async function finishOnboarding() {
  try {
    await api.post('/profile/consent', {});
    document.getElementById('onboardingOverlay').classList.add('hidden');
    const name = document.getElementById('sidebarName');
    if (name && onboardingData.firstName) name.textContent = onboardingData.firstName;
    const avatar = document.getElementById('sidebarAvatar');
    if (avatar && onboardingData.firstName) avatar.textContent = onboardingData.firstName[0].toUpperCase();
    loadDashboard();
  } catch (err) {
    showToast('Could not complete setup. Please try again.', 'error');
  }
}

function ob_back() {
  if (onboardingStep > 1) {
    onboardingStep--;
    renderOnboardingStep();
  }
}
