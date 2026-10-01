const CACHE_NAME = 'tanggamus-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/destinasi',
  '/peta',
  '/cuaca',
  '/kuliner',
  '/biaya',
  '/game',
  '/faq',
  '/ulasan',
  '/css/style.css',
  '/js/script.js',
  '/Gambar/logo-eksplor-tanggamus.png',
  '/Gambar/batutegi.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('PWA Cache error:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(res => {
        return res;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
