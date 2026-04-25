// Path2Prevention — Settings Tab

async function loadSettings() {
  const container = document.getElementById('tab-settings');
  container.innerHTML = '<div class="skeleton skeleton-card" style="height:500px;border-radius:20px;"></div>';
  try {
    const [profile, program] = await Promise.all([
      api.get('/profile'),
      api.get('/engagement/program').catch(() => ({ enrolled: false })),
    ]);
    container.innerHTML = buildSettingsHTML(profile, program);
  } catch (err) {
    console.error('Error loading settings:', err);
    container.innerHTML = errorState('Could not load settings.', () => loadSettings());
  }
}

function buildSettingsHTML(profile, program) {
  const initials = [(profile.firstName || '')[0], (profile.lastName || '')[0]].filter(Boolean).join('').toUpperCase() || 'U';
  const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  const fh = profile.familyHistory || {};
  let fhConditions = [];
  if (fh.firstDegreeT2D === 'yes') fhConditions.push('Type 2 Diabetes (First-degree: ' + (fh.firstDegreeT2DRelatives || 'Relative') + ')');
  if (fh.firstDegreeT1D === 'yes') fhConditions.push('Type 1 Diabetes (First-degree)');
  if (fh.secondDegree === 'yes') fhConditions.push('Diabetes (Second-degree relative)');

  return `
    <div style="margin-bottom:26px;">
      <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;">Settings</h1>
      <p style="font-size: 17px;color:#6c7a71;">Manage your profile, preferences, and data.</p>
    </div>

    <div class="set-bento-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

      <!-- Profile Card -->
      <div class="card set-card-span-2" style="padding:30px;grid-column:span 2;">
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:30px;flex-wrap:wrap;">
          <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#006c49,#10b981);display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:white;flex-shrink:0;">${initials}</div>
          <div>
            <h2 style="font-size: 24px;font-weight:800;margin-bottom:2px;">${escapeHTML(profile.firstName)} ${escapeHTML(profile.lastName)}</h2>
            <p style="font-size: 17px;color:#6c7a71;">Member since ${joinDate}</p>
          </div>
        </div>

        <div class="set-mobile-col" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;">
          <div class="input-group" style="margin-bottom:0; grid-column: span 2;">
            <label>Email</label>
            <input class="input-field" type="email" value="${escapeHTML(profile.email || '')}" disabled style="background:var(--bg-surface-low);cursor:not-allowed;color:#6c7a71;opacity:0.8;">
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>First name</label>
            <input class="input-field" type="text" id="setFirstName" value="${escapeHTML(profile.firstName)}">
          </div>
          <div class="input-group">
            <label>Last name</label>
            <input class="input-field" type="text" id="setLastName" value="${escapeHTML(profile.lastName)}">
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>Date of birth</label>
            <input class="input-field" type="date" id="setDob" value="${profile.dob ? profile.dob.split('T')[0] : ''}" disabled style="background:var(--bg-surface-low);cursor:not-allowed;color:#6c7a71;opacity:0.8;">
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>Sex</label>
            <select class="input-field" id="setSex" disabled style="background:var(--bg-surface-low);cursor:not-allowed;color:#6c7a71;opacity:0.8;">
              <option value="">Select</option>
              <option value="male" ${profile.sex === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${profile.sex === 'female' ? 'selected' : ''}>Female</option>
              <option value="other" ${profile.sex === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>Height (cm)</label>
            <input class="input-field" type="number" id="setHeight" value="${profile.heightCm || ''}" disabled style="background:var(--bg-surface-low);cursor:not-allowed;color:#6c7a71;opacity:0.8;">
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label>Current Weight (kg)</label>
            <input class="input-field" type="number" id="setWeight" value="${profile.currentWeightKg || ''}" disabled style="background:var(--bg-surface-low);cursor:not-allowed;color:#6c7a71;opacity:0.8;">
          </div>
        </div>

        <button onclick="saveProfile()" class="btn btn-primary btn-sm">
          <span class="material-symbols-outlined" style="font-size: 20px;">save</span> Save profile
        </button>
      </div>

      <!-- Family History (locked) -->
      <div class="card fh-lock-card" style="padding:26px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <h3 style="font-size: 19px;font-weight:700;">Family History</h3>
          <span class="material-symbols-outlined" style="font-size: 22px;color:#6c7a71;">lock</span>
        </div>
        ${profile.consentAccepted
      ? `<div style="display:flex;flex-direction:column;gap:8px;">
              ${(fhConditions).map(c => `
                <div style="display:flex;align-items:center;gap:8px;font-size: 15px;color:#3c4a42;font-weight:600;">
                  <span class="material-symbols-outlined" style="font-size: 20px;color:#006c49;">check_circle</span>${c}
                </div>
              `).join('') || '<p style="color:#6c7a71;font-size: 17px;">No conditions recorded.</p>'}
              <p style="font-size: 15px;color:#6c7a71;font-style:italic;margin-top:10px;">Locked after consent — cannot be edited for data integrity.</p>
            </div>`
      : `<p style="font-size: 17px;color:#6c7a71;font-style:italic;">Family history not yet entered or consent not given.</p>`
    }
      </div>


      <!-- 30-day Challenge -->
      <div class="card" style="padding:26px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
          <span style="font-size: 24px;">🏃</span>
          <h3 style="font-size: 19px;font-weight:700;">30-Day Challenge</h3>
        </div>
        ${(program?.status === 'active' || program?.currentWeek)
      ? `<div>
              <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size: 17px;">
                <span>Week ${program.currentWeek || 1}/4</span><span style="color:#006c49;font-weight:700;">${((program.currentWeek || 1)) * 25}% complete</span>
              </div>
              <div style="height:8px;background:#e7e8e9;border-radius:8px;overflow:hidden;">
                <div style="height:100%;background:#006c49;width:${(program.currentWeek || 1) * 25}%;border-radius:8px;"></div>
              </div>
              <p style="font-size: 16px;color:#6c7a71;margin-top:10px;">Started ${program.startedAt ? new Date(program.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
              ${(program.completedWeeks || []).length > 0 ? `<p style="font-size: 15px;color:#006c49;font-weight:600;margin-top:6px;">✓ Weeks ${(program.completedWeeks || []).join(', ')} completed</p>` : ''}
            </div>`
      : `<div>
              <p style="font-size: 17px;color:#3c4a42;margin-bottom:18px;line-height:1.5;">Build transformative health habits with our 4-week structured path.</p>
              <button onclick="enrollProgram()" class="btn btn-primary btn-sm" style="width:100%;">Start my 30-day challenge</button>
            </div>`
    }
      </div>

      <!-- Data Export -->
      <div class="card set-card-span-2" style="grid-column:span 2;padding:26px;">
        <h3 style="font-size: 19px;font-weight:700;margin-bottom:18px;">Export My Data</h3>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <button onclick="downloadCSV()" class="btn btn-secondary btn-sm" style="flex:1;min-width:200px;">
            <span class="material-symbols-outlined" style="font-size: 20px;">download</span> Download CSV
          </button>
          <button onclick="downloadPDF()" class="btn btn-secondary btn-sm" style="flex:1;min-width:200px;">
            <span class="material-symbols-outlined" style="font-size: 20px;">picture_as_pdf</span> Download PDF Report
          </button>
        </div>
        <p style="font-size: 15px;color:#6c7a71;margin-top:14px;line-height:1.5;">All your health logs and risk assessments exported in a single file.</p>
      </div>

      <!-- Security -->
      <div class="card set-card-span-2" style="padding:26px; grid-column: span 2;">
        <h3 style="font-size: 19px;font-weight:700;margin-bottom:18px;">Security</h3>
        <div class="set-mobile-col" style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
          <div>
            <div class="input-group">
              <label>Current password</label>
              <input class="input-field" type="password" id="currentPwd" placeholder="Enter current password">
            </div>
            <div class="input-group">
              <label>New password</label>
              <input class="input-field" type="password" id="newPwd" placeholder="At least 8 characters">
            </div>
            <button onclick="changePassword()" class="btn btn-secondary btn-sm" style="width:100%;">Update password</button>
          </div>
          <div style="padding:22px;border:1px solid rgba(186,26,26,0.2);border-radius:14px;background:rgba(186,26,26,0.03);display:flex;flex-direction:column;">
            <h4 style="font-size: 18px;font-weight:700;color:#ba1a1a;margin-bottom:8px;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:22px;">warning</span> Danger Zone</h4>
            <p style="font-size: 15px;color:#6c7a71;margin-bottom:20px;line-height:1.5;">This will permanently delete all your data and cannot be undone. Please be absolutely certain before proceeding.</p>
            <button onclick="confirmDeleteAccount()" class="btn btn-danger btn-sm" style="width:100%;margin-top:auto;">Delete my account</button>
          </div>
        </div>
      </div>

      <!-- Mobile Sign Out Button -->
      <div class="card set-card-span-2 hide-on-desktop" style="display: flex; justify-content: center; padding: 16px;">
        <button onclick="logout()" class="btn btn-secondary btn-full" style="color: #ba1a1a; border-color: rgba(186, 26, 26, 0.3);">
          <span class="material-symbols-outlined">logout</span> Sign out securely
        </button>
      </div>

    </div>
  `;
}

async function saveProfile() {
  try {
    const payload = {
      firstName: document.getElementById('setFirstName')?.value.trim(),
      lastName: document.getElementById('setLastName')?.value.trim(),
      dob: document.getElementById('setDob')?.value,
      sex: document.getElementById('setSex')?.value,
      heightCm: parseFloat(document.getElementById('setHeight')?.value) || undefined,
    };
    Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
    await api.put('/profile', payload);
    showToast('Profile saved!', 'success');
    const name = document.getElementById('sidebarName');
    if (name && payload.firstName) name.textContent = payload.firstName;
    const avatar = document.getElementById('sidebarAvatar');
    if (avatar && payload.firstName) avatar.textContent = payload.firstName[0].toUpperCase();
  } catch (err) {
    showToast(err.message || 'Save failed.', 'error');
  }
}




async function downloadCSV() {
  try {
    showToast('Preparing your CSV export…', 'info');
    const res = await apiFetch('/export/csv');
    if (!res || !res.blob) { showToast('Export failed — no data returned.', 'error'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'path2prevention-data.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded!', 'success');
  } catch (err) { showToast(err.message || 'Could not export CSV.', 'error'); }
}

async function downloadPDF() {
  try {
    showToast('Generating your PDF report…', 'info');
    const res = await apiFetch('/export/pdf');
    if (!res) { showToast('Report generation failed — no data returned.', 'error'); return; }

    const htmlText = await res.text();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocked. Please allow popups for this site.', 'error');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlText);
    printWindow.document.close();

    showToast('Report opened! You can now print/save it as PDF.', 'success');
  } catch (err) { showToast(err.message || 'Could not generate report.', 'error'); }
}

async function changePassword() {
  const currentPwd = document.getElementById('currentPwd')?.value;
  const newPwd = document.getElementById('newPwd')?.value;
  if (!currentPwd || !newPwd || newPwd.length < 8) {
    showToast('New password must be at least 8 characters.', 'error'); return;
  }
  try {
    await api.patch('/auth/password', { currentPassword: currentPwd, newPassword: newPwd });
    document.getElementById('currentPwd').value = '';
    document.getElementById('newPwd').value = '';
    showToast('Password updated!', 'success');
  } catch (err) { showToast(err.message || 'Password update failed.', 'error'); }
}

async function enrollProgram() {
  try {
    await api.post('/engagement/program/enroll', {});
    showToast('You\'re enrolled! Your 30-day challenge has begun. 🏃', 'success');
    loadSettings();
  } catch { showToast('Could not enroll. Try again.', 'error'); }
}

function confirmDeleteAccount() {
  const confirmed = window.confirm('Are you absolutely sure? This will permanently delete ALL your data and cannot be undone.');
  if (!confirmed) return;
  const doubleConfirm = window.prompt('Type DELETE to confirm account deletion:');
  if (doubleConfirm !== 'DELETE') { showToast('Account deletion cancelled.', 'info'); return; }
  api.delete('/account').then(() => {
    showToast('Account deleted. Redirecting…', 'info');
    setTimeout(() => logout(), 1500);
  }).catch(() => showToast('Deletion failed. Please try again.', 'error'));
}

