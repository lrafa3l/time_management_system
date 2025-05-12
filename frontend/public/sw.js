const CACHE_NAME = 'sgh-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/pagina-inicial.html', // Add other .html files here
  '/conta.html',          // Example; adjust based on your files
  '/styles/general.css',
  '/styles/auth.css',
  '/styles/transitions.css',
  '/js/auth.js',
  '/js/page-transitions.js',
  '/js/logOut.js',
  '/assets/images/ipikk-logo-bg.png',
  '/assets/icons/favicon.ico',
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/apple-touch-icon.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});