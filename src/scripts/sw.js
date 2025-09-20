/* src/scripts/sw.js
   Service Worker for Story App V2
   - Precache minimal shell (offline page, root, favicon)
   - Runtime caching:
     * Images -> cache-first (fast)
     * API -> network-first with cache fallback
     * Navigation (HTML) -> network-first fallback to offline.html
   - Push & notificationclick handling
*/

const CACHE_NAME = 'story-app-shell-v1';
const RUNTIME_CACHE = 'story-app-runtime-v1';
const IMAGE_CACHE = 'story-app-images-v1';
const API_CACHE = 'story-app-api-v1';
const PRECACHE_URLS = ['/', '/index.html', '/offline.html', '/favicon.png', '/styles.bundle.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).catch((e) => {
          console.warn('Precaching failed for some assets:', e);
        }),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (![CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE].includes(key)) {
              return caches.delete(key);
            }
            return null;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, cacheName = RUNTIME_CACHE) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
      return response;
    }

    const cached = await caches.match(request);
    if (cached) return cached;
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName = IMAGE_CACHE) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
    }
    return response;
  } catch (err) {
    return null;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      networkFirst(request)
        .then((r) => {
          if (!r || (r.status && r.status >= 400)) {
            return caches.match('/offline.html');
          }
          return r;
        })
        .catch(() => caches.match('/offline.html')),
    );
    return;
  }

  if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(url.pathname)) {
    event.respondWith(
      cacheFirst(request).then(
        (r) => r || fetch(request).catch(() => caches.match('/favicon.png')),
      ),
    );
    return;
  }

  if (url.origin.includes('story-api.dicoding.dev')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const clone = response.clone();
            const cache = await caches.open(API_CACHE);
            cache.put(request, clone);
            return response;
          }
          const cached = await caches.match(request);
          if (cached) return cached;
          return response;
        } catch (err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: true, message: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (
            response &&
            response.ok &&
            (request.destination === 'script' || request.destination === 'style')
          ) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return null;
        });
    }),
  );
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Story App',
    options: { body: 'You have a new message', icon: '/favicon.png' },
  };
  try {
    if (event.data) {
      const json = event.data.json ? event.data.json() : JSON.parse(event.data.text());
      payload = {
        title: json.title || payload.title,
        options: {
          body: (json.options && json.options.body) || json.body || payload.options.body,
          icon: (json.options && json.options.icon) || '/favicon.png',
          badge: (json.options && json.options.badge) || undefined,
          data: json.options && json.options.data ? json.options.data : undefined,
        },
      };
    }
  } catch (e) {
    console.warn('push event parse failed', e);
    try {
      payload = {
        title: 'Story App',
        options: { body: event.data?.text() || payload.options.body },
      };
    } catch (err) {}
  }

  event.waitUntil(self.registration.showNotification(payload.title, payload.options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
        return null;
      })
      .catch((err) => console.error('notificationclick error', err)),
  );
});
