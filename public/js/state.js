// Path2Prevention — Global State
window.state = {
  currentTab: 'dashboard',
  user: null,
  dashboardData: null,
  todayLog: null,
  goals: null,
  recs: [],
  settings: null,
  lastFetched: {},
};

window.escapeHTML = function(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
