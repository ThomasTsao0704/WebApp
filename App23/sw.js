const CACHE='plm-v3';
const ASSETS=['./','index.html','manifest.json','sw.js','icons/icon-192.png','icons/icon-512-maskable.png',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js','https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.wasm'
];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(ASSETS);self.skipWaiting();})());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  // 原站內：快取優先，背景更新
  if(url.origin===self.location.origin){
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(e.request);
      try{ const fresh=await fetch(e.request); cache.put(e.request,fresh.clone()); return fresh; }
      catch{ return cached || caches.match('./'); }
    })());
    return;
  }
  // 第三方：線上優先，離線退回快取
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{ const res=await fetch(e.request); cache.put(e.request,res.clone()); return res; }
    catch{ const hit=await cache.match(e.request); return hit || Response.error(); }
  })());
});
