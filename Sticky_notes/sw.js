// PWA 外殼的 Service Worker
// 只負責快取「外殼」本身（manifest / icons / index.html），
// 便利貼實際資料來自 Google Apps Script + Google Sheet，一定要有網路連線才能讀寫，
// 所以此 Service Worker 無法讓便利貼內容離線可用，只讓「App 圖示 / 啟動畫面 / 安裝」可以運作。

const CACHE_NAME = 'sticky-board-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 只攔截同源（外殼自己）的請求，Apps Script iframe 的請求維持正常網路存取
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
