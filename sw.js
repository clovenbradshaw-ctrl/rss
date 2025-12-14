// BURSST Service Worker - Offline caching and performance optimization
const CACHE_NAME = 'bursst-v1';
const RUNTIME_CACHE = 'bursst-runtime';

// Resources to cache immediately on install
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
  'https://unpkg.com/@phosphor-icons/web'
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS.map(url => {
          return new Request(url, { mode: 'no-cors' });
        })).catch(err => {
          console.log('[SW] Precache failed for some assets:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network-first with cache fallback for HTML/API
// Cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // For images - cache first, then network
  if (event.request.destination === 'image' ||
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            // Return cached image, refresh in background
            fetch(event.request).then(networkResponse => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {});
            return cachedResponse;
          }

          // Not in cache, fetch from network
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return placeholder for failed images
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#1a1a1a" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="#666" font-size="12">Image</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }

  // For fonts and icons - cache first
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('unpkg.com')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // For RSS feed proxies - network first with stale-while-revalidate
  if (url.hostname.includes('allorigins') ||
      url.hostname.includes('corsproxy') ||
      url.hostname.includes('codetabs')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful responses for 5 minutes
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed, try cache
            return cache.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                console.log('[SW] Returning cached feed:', url.href);
                return cachedResponse;
              }
              throw new Error('No cached response available');
            });
          });
      })
    );
    return;
  }

  // For the main app - network first
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Cache the latest version
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => {
          // Offline - serve from cache
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache non-successful responses
        if (!response.ok) {
          return response;
        }

        // Clone and cache
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Background sync for pending operations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-state') {
    event.waitUntil(syncState());
  }
});

async function syncState() {
  // Get pending sync data from IndexedDB
  try {
    const db = await openDB('feedr_sync', 1);
    const tx = db.transaction('pending', 'readonly');
    const pending = await tx.store.getAll();

    for (const item of pending) {
      await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
      });
    }

    // Clear pending items
    const clearTx = db.transaction('pending', 'readwrite');
    await clearTx.store.clear();
  } catch (e) {
    console.log('[SW] Background sync failed:', e);
  }
}

// Periodic background sync for feed updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-feeds') {
    event.waitUntil(refreshFeeds());
  }
});

async function refreshFeeds() {
  // Notify clients to refresh feeds
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'REFRESH_FEEDS' });
  });
}

// Message handling
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CACHE_URLS') {
    caches.open(RUNTIME_CACHE).then(cache => {
      cache.addAll(event.data.urls.map(url => new Request(url, { mode: 'no-cors' })));
    });
  }
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE);
  }
});

console.log('[SW] Service Worker loaded');
