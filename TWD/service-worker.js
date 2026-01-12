self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('fx-analyzer-v3').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './app.js',
        './data.json',
        './manifest.json',
        'https://cdn.jsdelivr.net/npm/chart.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
