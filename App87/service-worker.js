// Service Worker for Thomas Japan Travel
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `thomas-japan-travel-${CACHE_VERSION}`;

// 需要快取的靜態資源
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './data/trip.json',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap'
];

// ==================== Install Event ====================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安裝中...', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] 快取靜態資源');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] 安裝完成');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[Service Worker] 安裝失敗:', error);
            })
    );
});

// ==================== Activate Event ====================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 啟動中...', CACHE_VERSION);
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => {
                            // 刪除舊版本的快取
                            return name.startsWith('thomas-japan-travel-') && name !== CACHE_NAME;
                        })
                        .map(name => {
                            console.log('[Service Worker] 刪除舊快取:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] 啟動完成');
                return self.clients.claim();
            })
            .catch(error => {
                console.error('[Service Worker] 啟動失敗:', error);
            })
    );
});

// ==================== Fetch Event ====================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 忽略 chrome-extension 和其他非 http(s) 請求
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 圖片使用快取優先策略
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then(cached => {
                    if (cached) {
                        return cached;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            // 只快取成功的回應
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(request, responseClone);
                                });
                            }
                            return response;
                        })
                        .catch(() => {
                            // 圖片載入失敗時的備用圖片
                            return new Response(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
                                    <rect width="400" height="300" fill="#f5f5f5"/>
                                    <text x="200" y="150" text-anchor="middle" fill="#999" font-size="16" font-family="sans-serif">
                                        圖片載入失敗
                                    </text>
                                </svg>`,
                                { 
                                    headers: { 
                                        'Content-Type': 'image/svg+xml',
                                        'Cache-Control': 'no-cache'
                                    } 
                                }
                            );
                        });
                })
        );
        return;
    }

    // 其他資源使用網路優先策略，失敗時使用快取
    event.respondWith(
        fetch(request)
            .then(response => {
                // 只快取成功的回應
                if (response && response.status === 200) {
                    // 只快取同源或特定 CDN 的資源
                    if (url.origin === location.origin || 
                        url.hostname === 'unpkg.com' ||
                        url.hostname === 'fonts.googleapis.com' ||
                        url.hostname === 'fonts.gstatic.com') {
                        
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                }
                return response;
            })
            .catch(() => {
                // 網路失敗時嘗試從快取讀取
                return caches.match(request)
                    .then(cached => {
                        if (cached) {
                            return cached;
                        }
                        
                        // 如果是 HTML 文件，返回首頁
                        if (request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        // 其他資源返回離線提示
                        return new Response(
                            JSON.stringify({
                                error: '離線模式',
                                message: '無法連接到網路，請稍後再試'
                            }),
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Cache-Control': 'no-cache'
                                }
                            }
                        );
                    });
            })
    );
});

// ==================== Message Event ====================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urlsToCache = event.data.urls || [];
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(urlsToCache))
        );
    }
});

// ==================== Push Notification Event ====================
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : '您有新的旅遊提醒',
        icon: './manifest.json',
        badge: './manifest.json',
        vibrate: [200, 100, 200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 'travel-notification'
        },
        actions: [
            {
                action: 'open',
                title: '查看詳情',
                icon: './manifest.json'
            },
            {
                action: 'close',
                title: '關閉',
                icon: './manifest.json'
            }
        ],
        tag: 'thomas-japan-travel',
        requireInteraction: false,
        silent: false
    };

    event.waitUntil(
        self.registration.showNotification('🇯🇵 大阪旅遊提醒', options)
    );
});

// ==================== Notification Click Event ====================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientList => {
                    // 如果已經有開啟的視窗，就聚焦到該視窗
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // 否則開啟新視窗
                    if (clients.openWindow) {
                        return clients.openWindow('./');
                    }
                })
        );
    }
});

// ==================== Background Sync Event ====================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // 可以在這裡實作背景同步邏輯
            Promise.resolve()
        );
    }
});

// ==================== Error Handler ====================
self.addEventListener('error', (event) => {
    console.error('[Service Worker] 錯誤:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Service Worker] 未處理的 Promise 拒絕:', event.reason);
});

// ==================== Console Log ====================
console.log('[Service Worker] 已載入 -', CACHE_VERSION);
