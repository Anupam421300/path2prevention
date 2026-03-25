// Path2Prevention — Router & App Init

function switchTab(tab, event) {
  if (event) event.preventDefault();
  state.currentTab = tab;

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  document.querySelectorAll('.slidebar-link').forEach(el =>
    el.classList.toggle('active', el.dataset.tab === tab));
    
  // Auto-close slidebar upon selection
  const backdrop = document.getElementById('slidebarBackdrop');
  const slidebar = document.getElementById('slidebar');
  if (backdrop && slidebar) {
    backdrop.classList.remove('open');
    slidebar.classList.remove('open');
  }

  if (tab === 'dashboard') loadDashboard();
  else if (tab === 'log') loadLogForm();
  else if (tab === 'insights') loadInsights();
  else if (tab === 'settings') loadSettings();
}

// Wire slidebar nav clicks
document.querySelectorAll('.slidebar-link').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = el.dataset.tab;
    if (tab) switchTab(tab, e);
  });
});

async function initApp() {
  const token = getToken();
  if (!token) { window.location.href = '/login'; return; }

  try {
    const user = await api.get('/auth/me');
    state.user = user;
    localStorage.setItem('p2p_user', JSON.stringify(user));

    const avatar = (user.firstName || 'U')[0].toUpperCase();
    document.getElementById('sidebarAvatar').textContent = avatar;
    document.getElementById('sidebarName').textContent = user.firstName || 'User';

    if (!user.onboardingComplete) {
      startOnboarding();
      return;
    }

    loadDashboard();
  } catch (err) {
    console.error('Init failed:', err);
    logout();
  }
}

initApp();
