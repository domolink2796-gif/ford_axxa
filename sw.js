const CACHE_NAME = 'x-conect-smart-cache-v1';

// 1. Установка: сразу активируем воркер
self.addEventListener('install', () => self.skipWaiting());

// 2. Активация: чистка старых версий
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

// 3. ГЛАВНАЯ ЛОГИКА: Сначала сеть, если сети нет — Кэш
self.addEventListener('fetch', (event) => {
    // Исключаем API логиста и аппаратные команды ESP32, чтобы они уходили напрямую
    if (
        event.request.url.includes('/upload') || 
        event.request.url.includes('/api') || 
        event.request.url.includes('/sys') || 
        event.request.url.includes('/cmd') || 
        event.request.url.includes('/set')
    ) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Если интернет есть, обновляем копию в памяти
                if (response && response.status === 200) {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseCopy);
                    });
                }
                return response;
            })
            .catch(() => {
                // ЕСЛИ ИНТЕРНЕТА НЕТ — отдаем из памяти
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    
                    // Если это навигация, а в кэше нет — корень
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html') || caches.match('./');
                    }
                });
            })
    );
});

// Слушаем команду на обновление из приложения
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING' || event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
