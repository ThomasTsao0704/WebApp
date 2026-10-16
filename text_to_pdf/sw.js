/* 文字排版 PDF — Service Worker
 * 更新 App 時：修改任何檔案後，把 VERSION 改成新的值，使用者下次開啟就會看到「有新版本可用」。
 */
const VERSION = "t2p-v2.0.0";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: "reload" })))));
  // 第一次安裝時沒有舊版本要等，直接啟用
  if (!self.registration.active) self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("t2p-") && k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 頁面導覽（含分享進來的 ?text=…、捷徑 ?new=1）一律回傳快取的 App 殼層
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match("./index.html") || await cache.match("./");
      if (hit) return hit;
      try { return await fetch(req); }
      catch (e) { return new Response("離線中，且尚未快取 App。請連線後重新開啟一次。", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
    })());
    return;
  }

  // 其他靜態資源：快取優先，沒有才上網抓並存起來
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === "basic") cache.put(req, res.clone());
      return res;
    } catch (e) {
      return new Response("", { status: 504 });
    }
  })());
});
