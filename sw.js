/* Lumorph service worker — offline-first, cache everything local. */
const CACHE = 'lumorph-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './engine.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // App shell: cache first, network as backup.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then((hit) => hit || fetch(req))
    );
    return;
  }

  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;

  if (sameOrigin) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // MediaPipe / fonts: network first, fall back to cache when offline.
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req))
  );
});


/* ---------- notifications ---------- */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

/* daily reminder while the app is installed but closed (Chrome, Android) */
self.addEventListener('periodicsync', (e) => {
  if (e.tag !== 'lumorph-daily') return;
  e.waitUntil(
    self.registration.showNotification('Lumorph', {
      body: 'Quests are still open today. Two minutes keeps the streak alive.',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'lumorph-daily'
    })
  );
});
