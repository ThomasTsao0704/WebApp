const CACHE_NAME = 'purchase-helper-v1';
const CORE_ASSETS = [
'./',
'./index.html',
'./manifest.webmanifest'
];


self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
);
self.skipWaiting();
});


self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE_NAME?null:caches.delete(k))))
);
self.clients.claim();
});


self.addEventListener('fetch', (event) => {
const req = event.request;
// 只處理 GET
if(req.method !== 'GET') return;
event.respondWith(
caches.match(req).then(cached => {
const fetchPromise = fetch(req).then(networkRes => {
// 動態快取同源資源
if (networkRes && networkRes.status === 200 && new URL(req.url).origin === location.origin) {
const resClone = networkRes.clone();
caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
}
return networkRes;
}).catch(() => cached || caches.match('./index.html'));
return cached || fetchPromise;
})
);
});