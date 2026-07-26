// VoLabs PIPD - Service Worker (WebAPK & PWA Standalone Support)
const CACHE_NAME = 'volabs-pipd-cache-v3';

self.addEventListener('install', (e) => {
    self.skipWaiting();
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
        fetch(e.request).catch(() => {
            return caches.match(e.request);
        })
    );
});
