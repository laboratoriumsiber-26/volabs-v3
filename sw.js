// VoLabs PIPD - Service Worker (WebAPK & PWA Standalone Support for All Android & iOS Devices)
const CACHE_NAME = 'volabs-pipd-cache-v36';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/logo.png'
];

self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('Cache install skip:', err));
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', (e) => {
    // 1. Lewati cache secara mutlak untuk API Google Apps Script, Firebase & Request Eksternal
    if (e.request.url.includes('script.google.com') ||
        e.request.url.includes('exec') ||
        e.request.url.includes('action=') ||
        e.request.url.includes('firestore.googleapis.com') ||
        e.request.method !== 'GET') {
        return;
    }

    // 2. Navigation fallback untuk SPA
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return (await cache.match('/index.html')) || (await cache.match('./index.html'));
            })
        );
        return;
    }

    // 3. Stale-While-Revalidate untuk aset statis
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            const fetchPromise = fetch(e.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {});
            return cachedResponse || fetchPromise;
        })
    );
});

// PUSH NOTIFICATION HANDLER (100% Native Web Standard - Menjamin Muncul di Status Bar HP saat App Ditutup)
self.addEventListener('push', (event) => {
    let payload = { title: 'VoLabs PIPD', body: 'Ada pembaruan tugas atau pengumuman baru.', url: '/' };

    if (event.data) {
        try {
            const rawJson = event.data.json();
            // Ekstrak dari format FCM v1 maupun format WebPush baku
            if (rawJson.notification) {
                payload.title = rawJson.notification.title || payload.title;
                payload.body = rawJson.notification.body || payload.body;
            }
            if (rawJson.data) {
                payload.title = rawJson.data.title || payload.title;
                payload.body = rawJson.data.body || payload.body;
                payload.url = rawJson.data.url || payload.url;
            }
            if (!rawJson.notification && !rawJson.data) {
                payload.title = rawJson.title || payload.title;
                payload.body = rawJson.body || payload.body;
                payload.url = rawJson.url || payload.url;
            }
        } catch (e) {
            payload.body = event.data.text() || payload.body;
        }
    }

    const title = payload.title || 'VoLabs PIPD';
    const origin = self.location.origin || 'https://volabs.vercel.app';
    const iconUrl = origin + '/icon-192.png';

    const options = {
        body: payload.body,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [300, 150, 300, 150, 300],
        requireInteraction: true,
        tag: 'volabs-push-' + Date.now(),
        renotify: true,
        data: {
            url: payload.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

