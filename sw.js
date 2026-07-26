// VoLabs PIPD - Service Worker (WebAPK & PWA Standalone Support)
const CACHE_NAME = 'volabs-pipd-cache-v4';
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
    // Lewati cache untuk API Google Apps Script dan request eksternal/dinamis
    if (e.request.url.includes('script.google.com') || 
        e.request.url.includes('exec') || 
        e.request.url.includes('action=') ||
        e.request.method !== 'GET') {
        return;
    }
    
    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Simpan ke cache jika request sukses dan berstatus 200
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(e.request);
            })
    );
});
