const CACHE_NAME = 'axionvera-static-v1';
const DYNAMIC_CACHE_NAME = 'axionvera-dynamic-v1';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/axionvera.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching static assets');
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) => {
            return cache.add(asset).catch((err) => {
              console.warn(`[Service Worker] Failed to precache ${asset}:`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Exclude external origins (e.g. extension requests, Stellar APIs, mock backend if different)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Next.js development hot reload requests should not be cached
  if (url.pathname.includes('/_next/webpack-hmr') || url.pathname.includes('webpack') || url.pathname.includes('hot-update')) {
    return;
  }

  const isStaticAsset = 
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico');

  if (isStaticAsset) {
    // Cache First Strategy
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
  } else {
    // Network First Strategy for navigation pages and dynamic data requests
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful GET requests to dynamic cache
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Falling back to cache when offline
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Navigate fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Network error occurred', {
              status: 408,
              statusText: 'Network error occurred',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
        })
    );
  }
});

// Update listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
