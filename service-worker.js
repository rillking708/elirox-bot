const CACHE_NAME = 'elirox-bot-v1';
const urlsToCache = [
  '/',
  '/dashboard.html',
  '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {
        // Fail silently if offline during install
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(response => {
        // Don't cache non-GET requests
        if (event.request.method !== 'GET') {
          return response;
        }
        // Clone and cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache).catch(() => {});
        });
        return response;
      }).catch(() => {
        // Return cached fallback or offline page
        return caches.match('/dashboard.html');
      });
    })
  );
});

// Background sync for notifications
self.addEventListener('sync', event => {
  if (event.tag === 'sync-trades') {
    event.waitUntil(
      fetch('/api/trades').then(response => response.json()).catch(() => {})
    );
  }
});
