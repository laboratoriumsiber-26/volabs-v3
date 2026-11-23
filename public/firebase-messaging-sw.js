// Firebase Cloud Messaging Background Service Worker
// Memberikan dukungan penuh Push Notification Web & PWA saat aplikasi ditutup
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBgYq7GQi_T8faQlHDTwiPbu--AXWmtQHE",
  authDomain: "volabs-3540a.firebaseapp.com",
  projectId: "volabs-3540a",
  storageBucket: "volabs-3540a.firebasestorage.app",
  messagingSenderId: "443981213348",
  appId: "1:443981213348:web:8ec75ee3755aa9eebfc031"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'VoLabs PIPD';
  const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || 'Pemberitahuan sistem terbaru.';
  const url = (payload.data && payload.data.url) || '/';

  const origin = self.location.origin || 'https://volabs-pipd.vercel.app';
  const iconUrl = origin + '/icon-192.png';

  const notificationOptions = {
    body: body,
    icon: iconUrl,
    badge: iconUrl,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    tag: 'volabs-bg-' + Date.now(),
    renotify: true,
    data: {
      url: url
    }
  };

  self.registration.showNotification(title, notificationOptions);
});

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
