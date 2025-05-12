const CACHE_NAME = 'sgh-pwa-v5'; // Changed to force cache refresh

// Cache all .html files and assets
const urlsToCache = [
  '/',
  '/index.html',
  '/main.html',
  '/calendar.html',
  '/classes.html',
  '/help.html',
  '/prof.html',
  '/setting.html',
  '/view.html',
  '/schedule.html',
  '/admin.html',
  '/perfil.html',
  '/statistics.html',
  '/src/styles/general.css',
  '/src/styles/auth.css',
  '/src/styles/transitions.css',
  '/src/js/auth.js',
  '/src/js/page-transitions.js',
  '/src/js/logOut.js',
  '/assets/images/ipikk-logo-bg.png',
  '/assets/icons/favicon.ico',
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/apple-touch-icon.png',
  '/manifest.json'
];

// Map custom routes to .html files (mirrors server.js)
const routeMap = {
  '/login': '/index.html',
  '/pagina-inicial': '/main.html',
  '/calendario': '/calendar.html',
  '/turmas': '/classes.html',
  '/ajuda': '/help.html',
  '/docentes': '/prof.html',
  '/definicoes': '/setting.html',
  '/horario': '/view.html',
  '/horarios-feitos': '/schedule.html',
  '/admin': '/admin.html',
  '/conta': '/perfil.html',
  '/estatisticas': '/statistics.html'
};

// Install event: Cache all specified files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event: Serve cached files or map custom routes
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const pathname = requestUrl.pathname;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Check if the request is for a custom route
        if (routeMap[pathname]) {
          return caches.match(routeMap[pathname])
            .then(cachedResponse => {
              // Return the corresponding .html file or fetch it
              return cachedResponse || fetch(event.request).catch(() => {
                // Fallback to index.html if fetch fails and no cache
                return caches.match('/index.html');
              });
            });
        }

        // For other requests, try to fetch or fallback to index.html
        return fetch(event.request).catch(() => {
          return caches.match('/index.html');
        });
      })
  );
});

// Activate event: Clean up old caches
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