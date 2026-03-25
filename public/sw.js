const CACHE_NAME = 'p2p-v3';
const STATIC_ASSETS = [
  '/app',
  '/css/main.css',
  '/js/api.js',
  '/js/state.js',
  '/js/router.js',
  '/js/onboarding.js',
  '/js/dashboard.js',
  '/js/log.js',
  '/js/insights.js',
  '/js/settings.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) return; // Never cache API
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); }
      return res;
    }).catch(() => cached))
  );
});
