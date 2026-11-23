// VoLabs PIPD - Service Worker (WebAPK & PWA Standalone Support for All Android Devices)
const CACHE_NAME = 'volabs-pipd-cache-v21';
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
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('Cache install skip:', err));
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
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

    // 2. Navigation fallback untuk SPA (Ketika refresh di route /jurnal, /absensi, dll.)
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return (await cache.match('/index.html')) || (await cache.match('./index.html'));
            })
        );
        return;
    }

    // 3. Strategi Cache-First (Stale-While-Revalidate) untuk aset statis (Memastikan Lulus Uji Offline WebAPK Oppo/ColorOS)
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
            }).catch(() => {
                // Abaikan error network saat update background
            });

            // Kembalikan dari cache instan (0ms), atau tunggu dari network jika belum ada di cache
            return cachedResponse || fetchPromise;
        })
    );
});

// Push Notification Event Listener (Web Push / Background FCM)
self.addEventListener('push', (event) => {
    let data = { title: 'VoLabs PIPD', body: 'Pemberitahuan tugas atau informasi operasional terbaru.', url: '/' };
    if (event.data) {
        try {
            data = event.data.json();
            // Handle FCM payload format
            if (data.notification) {
                data.title = data.notification.title || data.title;
                data.body = data.notification.body || data.body;
            }
            if (data.data) {
                data.title = data.data.title || data.title;
                data.body = data.data.body || data.body;
                data.url = data.data.url || data.url;
            }
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const title = data.title || 'VoLabs PIPD';
    const origin = self.location.origin || 'https://volabs-pipd.vercel.app';
    const iconUrl = origin + '/icon-192.png';
    const options = {
        body: data.body,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        tag: 'volabs-fcm-' + Date.now(),
        renotify: true,
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Event Listener (Buka aplikasi ke route yang sesuai)
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

