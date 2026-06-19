// Empty - no caching to ensure fresh JS loads
self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request));
});