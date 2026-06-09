importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE = 'zigaria-v6';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// Firebase init στον service worker
firebase.initializeApp({
  apiKey: "AIzaSyDGMWEOc3TUVco2WR1j8bABLZux-DmnWVo",
  authDomain: "ibeescale.firebaseapp.com",
  projectId: "ibeescale",
  storageBucket: "ibeescale.firebasestorage.app",
  messagingSenderId: "590028727937",
  appId: "1:590028727937:web:a2cf6808cd0c72f896cf80"
});

const messaging = firebase.messaging();

// Ειδοποίηση όταν η εφαρμογή είναι ΚΛΕΙΣΤΗ (background/terminated)
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || 'Ζυγαριά Κυψέλης';
  const body  = payload.notification?.body  || '';
  return self.registration.showNotification(title, {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'zigaria-notification',
    renotify: true
  });
});

// Cache εγκατάσταση
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Καθαρισμός παλιών caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: ThingSpeak πάντα από δίκτυο, στατικά από cache
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('thingspeak.com') || url.includes('googleapis.com/macros') || url.includes('gstatic.com')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: 'offline' }), { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});

// Κλικ στην ειδοποίηση → άνοιγμα εφαρμογής
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./index.html'));
});
