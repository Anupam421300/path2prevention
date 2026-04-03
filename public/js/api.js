// Path2Prevention — API Helper
const API_BASE = '/api';

function getToken() { return localStorage.getItem('p2p_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('p2p_user') || 'null'); } catch { return null; }
}
function logout() {
  localStorage.removeItem('p2p_token');
  localStorage.removeItem('p2p_user');
  window.location.href = '/login';
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const cacheBuster = path.includes('?') ? `&_t=${Date.now()}` : `?_t=${Date.now()}`;
  const fetchUrl = `${API_BASE}${path}${options.method && options.method !== 'GET' ? '' : cacheBuster}`;
  const res = await fetch(fetchUrl, { ...options, headers });

  if (res.status === 401) { logout(); throw new Error('Session expired'); }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/csv') || ct.includes('application/pdf') || ct.includes('text/html')) return res;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  get:    (path)        => apiFetch(path),
  post:   (path, body)  => apiFetch(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    (path, body)  => apiFetch(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  (path, body)  => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path)        => apiFetch(path, { method: 'DELETE' }),
};

// Toast — uses Material Symbols Outlined
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const iconMap = { success: 'check_circle', error: 'error', info: 'info' };
  toast.innerHTML = `<span class="material-symbols-outlined" style="font-size: 22px;flex-shrink:0;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">${iconMap[type] || 'info'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Sidebar risk update
function updateSidebarRisk(riskScore) {
  if (!riskScore) return;
  const badge = document.getElementById('sidebarRiskBadge');
  const levelEl = document.getElementById('sidebarRiskLevel');
  const scoreEl = document.getElementById('sidebarRiskScore');
  const fillEl = document.getElementById('sidebarRiskFill');
  if (!badge) return;
  badge.style.display = 'block';
  levelEl.textContent = riskScore.meterLevel || '—';
  scoreEl.textContent = `${riskScore.internalScore || 0}/100`;
  const colorMap = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', 'Very High': '#ef4444' };
  const c = colorMap[riskScore.meterLevel] || '#10b981';
  levelEl.style.color = c;
  if (fillEl) {
    fillEl.style.width = `${riskScore.internalScore || 0}%`;
    fillEl.style.background = c;
  }
}
