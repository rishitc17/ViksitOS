// ViksitOS Service Worker

const CACHE_NAME = 'viksitos-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/pages/login.html',
  '/pages/citizen.html',
  '/pages/government.html',
  '/css/styles.css',
  '/css/login.css',
  '/css/citizen.css',
  '/css/government.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/notifications.js',
  '/js/chatbot.js',
  '/js/pwa.js',
  '/js/citizen-home.js',
  '/js/citizen-apply.js',
  '/js/citizen-applications.js',
  '/js/citizen-documents.js',
  '/js/government.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/pages/login.html');
        }
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from ViksitOS',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23FF9933" width="100" height="33"/><rect fill="%23fff" y="33" width="100" height="34"/><rect fill="%23138808" y="67" width="100" height="33"/><circle cx="50" cy="50" r="12" fill="%23000080"/></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23FF9933" width="100" height="33"/><rect fill="%23fff" y="33" width="100" height="34"/><rect fill="%23138808" y="67" width="100" height="33"/><circle cx="50" cy="50" r="12" fill="%23000080"/></svg>',
    data: {
      url: data.url || '/pages/citizen.html'
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ViksitOS', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data.url || '/pages/citizen.html';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
    );
  }
});
