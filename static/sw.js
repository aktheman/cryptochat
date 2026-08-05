const CACHE_NAME = 'cryptochat-v3';
const SHELL_CACHE = CACHE_NAME + '-shell';

const SHELL = [
  '/offline.html',
  '/static/js/chat.js',
  '/static/js/bootstrap.js',
  '/static/css/style.css',
  '/manifest.json',
  '/sw.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME && k !== SHELL_CACHE) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('push', (e) => {
  let data = { title: 'CryptoChat', body: '', url: '/' };
  try {
    const parsed = e.data ? e.data.json() : {};
    data = Object.assign({ title: 'CryptoChat', body: '', url: '/' }, parsed);
  } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/static/img/icon-192.png',
      badge: '/static/img/icon-192.png',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/chat';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/auth') || url.pathname === '/login') return;

  const isStatic = url.origin === self.location.origin && (
    url.pathname.startsWith('/static/') ||
    url.pathname === '/' ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/offline.html'
  );

  if (isStatic) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(SHELL_CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/offline').then(p => p || new Response('Offline', { status: 503 }))))
    );
  } else {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
