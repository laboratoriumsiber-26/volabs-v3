// Firebase Cloud Messaging Background Service Worker (Resmi Google Firebase SDK)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const CACHE_NAME = 'volabs-pipd-cache-v43';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/logo.png'
];

// Inisialisasi Firebase SDK resmi di dalam Service Worker
try {
    firebase.initializeApp({
        apiKey: "AIzaSyBgYq7GQi_T8faQlHDTwiPbu--AXWmtQHE",
        authDomain: "volabs-3540a.firebaseapp.com",
        projectId: "volabs-3540a",
        storageBucket: "volabs-3540a.firebasestorage.app",
        messagingSenderId: "443981213348",
        appId: "1:443981213348:web:8ec75ee3755aa9eebfc031"
    });

    const messaging = firebase.messaging();

    // HANDLER 1: onBackgroundMessage Resmi Firebase
    messaging.onBackgroundMessage((payload) => {
        console.log('[Firebase SW v43] onBackgroundMessage received:', payload);
        const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'VoLabs PIPD';
        const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || 'Pembaruan tugas atau pengumuman.';
        const url = (payload.data && payload.data.url) || '/';
        const origin = self.location.origin || 'https://volabs.vercel.app';
        const iconUrl = origin + '/icon-192.png';

        const options = {
            body: body,
            icon: iconUrl,
            badge: iconUrl,
            vibrate: [300, 150, 300, 150, 300],
            requireInteraction: true,
            tag: 'volabs-push-' + (payload.data && payload.data.tag ? payload.data.tag : Date.now()),
            renotify: true,
            data: { url: url }
        };

        return self.registration.showNotification(title, options);
    });
} catch (e) {
    console.warn('[Firebase SW v43] init notice:', e);
}

// Lifecycle Events
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
    if (e.request.url.includes('script.google.com') ||
        e.request.url.includes('exec') ||
        e.request.url.includes('action=') ||
        e.request.url.includes('firestore.googleapis.com') ||
        e.request.method !== 'GET') {
        return;
    }

    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return (await cache.match('/index.html')) || (await cache.match('./index.html'));
            })
        );
        return;
    }

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

// HANDLER 2: W3C Native Push Event Handler (Dual pipeline agar di OPPO / HP Android lain saat close window tetap terpanggil)
self.addEventListener('push', (event) => {
    let payload = { title: 'VoLabs PIPD', body: 'Ada pembaruan tugas atau pengumuman baru.', url: '/' };

    if (event.data) {
        try {
            const rawJson = event.data.json();
            if (rawJson.notification) {
                payload.title = rawJson.notification.title || payload.title;
                payload.body = rawJson.notification.body || payload.body;
            }
            if (rawJson.data) {
                payload.title = rawJson.data.title || payload.title;
                payload.body = rawJson.data.body || payload.body;
                payload.url = rawJson.data.url || payload.url;
            }
        } catch (e) {
            try { payload.body = event.data.text() || payload.body; } catch (txtErr) {}
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
        data: { url: payload.url || '/' }
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
