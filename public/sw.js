const CACHE_NAME = 'p2p-v6';
const STATIC_ASSETS = [
  '/app',
  '/css/main.css',
  '/css/mobile.css',
  '/css/auth.css',
  '/js/api.js',
  '/js/state.js',
  '/js/router.js',
  '/js/onboarding.js',
  '/js/dashboard.js',
  '/js/log.js',
  '/js/insights.js',
  '/js/settings.js',
  '/js/auth-login.js',
  '/js/auth-register.js',
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
  // Never cache API calls
  if (e.request.url.includes('/api/')) return; 

  // Network-First Strategy for all other assets
  e.respondWith(
    fetch(e.request).then(res => {
      // If network works, update the cache and return the fresh response
      if (res.ok) { 
        const clone = res.clone(); 
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); 
      }
      return res;
    }).catch(() => {
      // If offline, fallback to cache
      return caches.match(e.request);
    })
  );
});
