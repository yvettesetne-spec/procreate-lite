const CACHE_NAME = 'procreate-lite-v53';
const ASSETS = [
    '/',
    '/index.html',
    '/main.js',
    '/style.css',
    '/manifest.json',
    '/filter-worker.js',
    '/src/canvas.js',
    '/src/brushes.js',
    '/src/layers.js',
    '/src/modals.js',
    '/src/smoothing.js',
    '/src/harmony.js',
    '/src/groups.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(cached => {
            const now = Date.now();
            if (cached) {
                const cacheTime = new Date(cached.headers.get('sw-cache-time')).getTime();
                const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
                if (now - cacheTime > ttl) {
                    return fetch(e.request).then(response => {
                        if (response && response.status === 200) {
                            response.headers.set('sw-cache-time', new Date().toISOString());
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                        }
                        return response;
                    }).catch(() => cached);
                }
                return cached;
            }
            const fetched = fetch(e.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        clone.headers.set('sw-cache-time', new Date().toISOString());
                        cache.put(e.request, clone);
                    });
                }
                return response;
            }).catch(() => cached);
            return fetched;
        })
    );
});

// Cache static assets with longer TTL
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/main.js',
    '/style.css',
    '/manifest.json',
    '/filter-worker.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
        })
    );
    self.skipWaiting();
});
