// Simple Service Worker for offline support
const CACHE = 'procreate-lite-cache-v1';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll([
            '/', '/index.html', '/main.js', '/style.css', '/manifest.json'
        ]))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            return cached || fetch(e.request).catch(() => 
                e.request.mode === 'navigate' ? caches.match(OFFLINE_URL) : null
            );
        })
    );
});