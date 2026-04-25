// Path2Prevention — Register Page Controller

const API_BASE = '/api';
const form = document.getElementById('registerForm');
const firstNameInput = document.getElementById('firstNameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const confirmInput = document.getElementById('confirmPasswordInput');
const termsCheck = document.getElementById('termsCheck');
const errorBox = document.getElementById('errorBox');
const errorMsg = document.getElementById('errorMsg');
const registerBtn = document.getElementById('registerBtn');
const btnText = document.getElementById('btnText');

// Password strength
const bars = ['sb1', 'sb2', 'sb3', 'sb4'].map(id => document.getElementById(id));
const strengthLabel = document.getElementById('strengthLabel');
const levels = [
  { color: '#ba1a1a', label: 'Too weak' },
  { color: '#f59e0b', label: 'Weak' },
  { color: '#10b981', label: 'Good' },
  { color: '#006c49', label: 'Strong' },
];

function calcStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

passwordInput.addEventListener('input', () => {
  const score = calcStrength(passwordInput.value);
  bars.forEach((bar, i) => {
    bar.style.background = i < score ? levels[Math.max(0, score - 1)].color : '#e7e8e9';
  });
  strengthLabel.textContent = passwordInput.value ? levels[Math.max(0, Math.min(3, score - 1))].label : '';
  strengthLabel.style.color = score > 0 ? levels[score - 1].color : '#6c7a71';
});

function showError(msg) { errorMsg.textContent = msg; errorBox.classList.add('visible'); }
function hideError() { errorBox.classList.remove('visible'); }

function setLoading(loading) {
  registerBtn.disabled = loading;
  btnText.innerHTML = loading
    ? '<span class="loading-spinner"></span> Creating account…'
    : 'Create account';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const firstName = firstNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmInput.value;

  if (!firstName) return showError('Please enter your first name.');
  if (!email) return showError('Please enter a valid email address.');
  if (password.length < 8) return showError('Password must be at least 8 characters.');
  if (password !== confirmPassword) return showError('Passwords do not match.');
  if (!termsCheck.checked) return showError('Please accept the Terms of Service to continue.');

  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    localStorage.setItem('p2p_token', data.token);
    localStorage.setItem('p2p_user', JSON.stringify(data.user));
    window.location.href = '/app';
  } catch (err) {
    showError(err.message || 'Something went wrong. Please try again.');
    setLoading(false);
  }
});

if (localStorage.getItem('p2p_token')) {
  window.location.href = '/app';
}

function openAuthModal(id, e) {
  if (e) e.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => el.classList.add('open'), 10);
}

function closeAuthModal(id, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => el.classList.add('hidden'), 250);
}
