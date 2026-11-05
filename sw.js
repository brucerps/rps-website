/* Rock Papers Scissors: offline support for the installed app (Android and iPhone).
   Pages load fresh from the network when online and fall back to the saved copy offline.
   Change VERSION whenever you upload a new version of the site so phones pick it up. */
const VERSION = 'rps-v27';
const CORE = [
  './', './index.html', './services.html', './work.html', './about.html', './contact.html',
  './css/style.css', './js/space.js', './js/ui.js', './favicon.svg', './manifest.webmanifest',
  './assets/char-statue.svg', './assets/char-astronaut.svg', './assets/char-cavemen.svg', './assets/char-spacewalk-a.svg', './assets/char-spacewalk-b.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // videos: leave them to the browser (they load in pieces, which the saved-copy store cannot keep)
  if (req.headers.has('range') || /\.(mp4|webm|mov)$/i.test(url.pathname)) return;
  if (req.mode === 'navigate') {
    // pages: network first, saved copy when offline
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))));
    return;
  }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    // files and fonts: saved copy first, refreshed in the background
    e.respondWith(caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; }).catch(() => cached);
      return cached || net;
    }));
  }
});
