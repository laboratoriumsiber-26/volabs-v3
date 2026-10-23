// VoLabs PIPD - Service Worker (WebAPK & PWA Standalone Support for All Android Devices)
const CACHE_NAME = 'volabs-pipd-cache-v5';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './logo.png'
];

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
    // 1. Lewati cache secara mutlak untuk API Google Apps Script & Request Eksternal
    if (e.request.url.includes('script.google.com') ||
        e.request.url.includes('exec') ||
        e.request.url.includes('action=') ||
        e.request.method !== 'GET') {
        return;
    }

    // 2. Strategi Cache-First (Stale-While-Revalidate) untuk aset statis (Memastikan Lulus Uji Offline WebAPK Oppo/ColorOS)
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
