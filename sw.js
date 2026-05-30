const CACHE_NAME = 'x-conect-smart-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Установка: кешируем только то, что железобетонно существует
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Безопасная предзагрузка ядра X-CONECT...');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. Активация: чистка старого мусора
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаляю старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Логика запросов: динамически кешируем всё остальное (включая иконку, когда она запросится)
self.addEventListener('fetch', (event) => {
    if (
        event.request.url.includes('/upload') || 
        event.request.url.includes('/api') || 
        event.request.url.includes('/sys') || 
        event.request.url.includes('/cmd') || 
        event.request.url.includes('/set')
    ) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
                }
                return networkResponse;
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html') || caches.match('./');
                }
            });
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING' || event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
