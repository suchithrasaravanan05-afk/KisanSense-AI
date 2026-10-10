// KisanSense AI Service Worker - PWA & Low-Connectivity App Shell Caching
const CACHE_NAME = 'kisansense-v1.0.0';

const APP_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

// Install: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // We only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 1. Navigation (HTML pages) -> Network-first with App Shell cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If network is offline, attempt matching the exact route, or fallback to the app shell '/'
          const cachedRoute = await caches.match(request);
          if (cachedRoute) return cachedRoute;

          const cachedShell = await caches.match('/');
          if (cachedShell) return cachedShell;

          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <title>KisanSense AI — Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                  body { font-family: system-ui, sans-serif; background: #FBFDF9; color: #142918; padding: 2rem; text-align: center; }
                  .card { max-width: 480px; margin: 4rem auto; background: white; padding: 2rem; border-radius: 1.5rem; border: 1px solid #dde7df; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                  h1 { color: #1B5E20; margin-bottom: 0.5rem; }
                  p { color: #4B6354; font-size: 0.95rem; line-height: 1.5; }
                  button { margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #1B5E20; color: white; border: none; border-radius: 0.75rem; font-weight: bold; cursor: pointer; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>KisanSense AI</h1>
                  <p><strong>Offline Mode:</strong> Please ensure the app has loaded at least once online so the app shell can be stored.</p>
                  <button onclick="window.location.reload()">Retry Connection</button>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. Next.js Static Bundles, Fonts, Icons -> Stale-While-Revalidate or Cache-First
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.png') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Fetch fresh in background to update cache
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Ignore background fetch failure when offline
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. All other requests -> Network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
