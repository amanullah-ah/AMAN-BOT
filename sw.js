/* AMAN-MD service worker
   Update dene par neeche wala VERSION badal dein (jaise v2), purana cache khud saaf ho jata hai. */
const VERSION = 'v4';
const CACHE = 'aman-md-' + VERSION;
const CORE = [
  '/', '/style.css', '/script.js', '/manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('aman-md-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                 // bahar ki images/fonts browser khud sambhale
  const p = url.pathname;
  if (p.startsWith('/api/') || p === '/servers.json' || p === '/sitemap.xml' || p === '/robots.txt') return; // hamesha taza
  if (/\.(mp3|mp4|webm|ogg|m4a|wav)$/i.test(p) || req.headers.has('range')) return;   // audio/video seedha network se

  // page kholna: pehle network, na mile to cache (offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('/', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  // baqi files: cache se foran, peeche se update
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
