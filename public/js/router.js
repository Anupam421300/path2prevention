// Path2Prevention — Router & App Init

let tabCache = {};

function switchTab(tab, event, forceRefresh = false) {
  if (event) event.preventDefault();
  state.currentTab = tab;

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  document.querySelectorAll('.slidebar-link, .mobile-nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.tab === tab));
    
  // Auto-close slidebar upon selection
  const backdrop = document.getElementById('slidebarBackdrop');
  const slidebar = document.getElementById('slidebar');
  if (backdrop && slidebar) {
    backdrop.classList.remove('open');
    slidebar.classList.remove('open');
  }

  if (!tabCache[tab] || forceRefresh) {
    tabCache[tab] = true;
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'log') loadLogForm();
    else if (tab === 'insights') loadInsights();
    else if (tab === 'settings') loadSettings();
  }
}

// Helper to flush cache when data changes (e.g. after logging)
window.forceTabRefresh = function(tabName) {
  tabCache[tabName] = false;
  if (state.currentTab === tabName) switchTab(tabName, null, true);
};

// Wire nav clicks for desktop and mobile
document.querySelectorAll('.slidebar-link, .mobile-nav-item').forEach(el => {
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

    // Load initial tab
    switchTab('dashboard');

    // Eagerly preload remaining tabs in the background after a slight delay
    // This warms up Vercel serverless functions and pre-renders the DOM,
    // making standard tab switching completely instantaneous for the user.
    setTimeout(() => {
      if (!tabCache['log']) { tabCache['log'] = true; loadLogForm(); }
      if (!tabCache['insights']) { tabCache['insights'] = true; loadInsights(); }
      if (!tabCache['settings']) { tabCache['settings'] = true; loadSettings(); }
    }, 500);

  } catch (err) {
    console.error('Init failed:', err);
    logout();
  }
}

initApp();
