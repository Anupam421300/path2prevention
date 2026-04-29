// Path2Prevention — Login Page Controller

const API_BASE = '/api';

const form = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const errorBox = document.getElementById('errorBox');
const errorMsg = document.getElementById('errorMsg');
const signInBtn = document.getElementById('signInBtn');
const btnText = document.getElementById('btnText');

function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.add('visible');
}
function hideError() { errorBox.classList.remove('visible'); }

function setLoading(loading) {
  signInBtn.disabled = loading;
  btnText.innerHTML = loading
    ? '<span class="loading-spinner"></span> Signing in…'
    : 'Sign in';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('p2p_token', data.token);
    localStorage.setItem('p2p_user', JSON.stringify(data.user));
    window.location.href = '/app';
  } catch (err) {
    showError(err.message || 'Something went wrong. Please try again.');
    setLoading(false);
  }
});

// If already logged in, redirect
if (localStorage.getItem('p2p_token')) {
  window.location.href = '/app';
}

// ── Forgot Password Modal ── 
let fpVerifiedEmail = '';
let fpVerifiedDob = '';

document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
  e.preventDefault();
  openForgotModal();
});

function openForgotModal() {
  const backdrop = document.getElementById('forgotPwdBackdrop');
  // Reset to step 1
  document.getElementById('fpStep1').style.display = 'block';
  document.getElementById('fpStep2').style.display = 'none';
  document.getElementById('fpStep3').style.display = 'none';
  document.getElementById('fpErrorBox').style.display = 'none';
  document.getElementById('fpEmail').value = '';
  document.getElementById('fpDob').value = '';
  fpVerifiedEmail = '';
  fpVerifiedDob = '';
  backdrop.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    backdrop.style.opacity = '1';
    document.getElementById('forgotPwdPanel').style.transform = 'scale(1)';
  }, 10);
}

function closeForgotModal() {
  const backdrop = document.getElementById('forgotPwdBackdrop');
  backdrop.style.opacity = '0';
  document.getElementById('forgotPwdPanel').style.transform = 'scale(0.94)';
  document.body.style.overflow = '';
  setTimeout(() => { backdrop.style.display = 'none'; }, 220);
}

// Click backdrop to close
document.getElementById('forgotPwdBackdrop').addEventListener('click', (e) => {
  if (e.target === document.getElementById('forgotPwdBackdrop')) closeForgotModal();
});

async function fpVerifyIdentity() {
  const email = document.getElementById('fpEmail').value.trim();
  const dob = document.getElementById('fpDob').value;
  const errBox = document.getElementById('fpErrorBox');
  const errMsg = document.getElementById('fpErrorMsg');
  const btn = document.getElementById('fpVerifyBtn');
  const btnTxt = document.getElementById('fpVerifyText');

  errBox.style.display = 'none';

  if (!email || !dob) {
    errMsg.textContent = 'Please enter your email and date of birth.';
    errBox.style.display = 'flex';
    return;
  }

  btn.disabled = true;
  btnTxt.innerHTML = '<span class="loading-spinner"></span> Verifying…';

  try {
    const res = await fetch(`${API_BASE}/auth/verify-dob`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, dob })
    });
    const data = await res.json();

    if (!res.ok) {
      errMsg.textContent = data.error || 'Date of birth does not match. Please enter the correct date of birth.';
      errBox.style.display = 'flex';
      btn.disabled = false;
      btnTxt.textContent = 'Verify Identity';
      return;
    }

    // DOB verified — proceed to step 2
    fpVerifiedEmail = email;
    fpVerifiedDob = dob;
    document.getElementById('fpStep1').style.display = 'none';
    document.getElementById('fpStep2').style.display = 'block';

  } catch (err) {
    errMsg.textContent = 'Connection error. Please try again.';
    errBox.style.display = 'flex';
    btn.disabled = false;
    btnTxt.textContent = 'Verify Identity';
  }
}

async function fpResetPassword() {
  const newPwd = document.getElementById('fpNewPwd').value;
  const confirmPwd = document.getElementById('fpConfirmPwd').value;
  const errBox = document.getElementById('fpStep2Error');
  const errMsg = document.getElementById('fpStep2ErrorMsg');
  const btn = document.getElementById('fpResetBtn');
  const btnTxt = document.getElementById('fpResetText');

  errBox.style.display = 'none';

  if (!newPwd || newPwd.length < 8) {
    errMsg.textContent = 'Password must be at least 8 characters.';
    errBox.style.display = 'flex';
    return;
  }
  if (newPwd !== confirmPwd) {
    errMsg.textContent = 'Passwords do not match. Please re-enter.';
    errBox.style.display = 'flex';
    return;
  }

  btn.disabled = true;
  btnTxt.innerHTML = '<span class="loading-spinner"></span> Resetting…';

  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fpVerifiedEmail, dob: fpVerifiedDob, newPassword: newPwd })
    });
    const data = await res.json();

    if (!res.ok) {
      errMsg.textContent = data.error || 'Reset failed. Please start over.';
      errBox.style.display = 'flex';
      btn.disabled = false;
      btnTxt.textContent = 'Reset Password';
      return;
    }

    // Success!
    document.getElementById('fpStep2').style.display = 'none';
    document.getElementById('fpStep3').style.display = 'block';

  } catch (err) {
    errMsg.textContent = 'Connection error. Please try again.';
    errBox.style.display = 'flex';
    btn.disabled = false;
    btnTxt.textContent = 'Reset Password';
  }
}
