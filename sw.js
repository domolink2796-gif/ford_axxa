self.addEventListener('install', (e) => {
    self.skipWaiting(); // Моментальная активация нового воркера
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim()); // Воркер сразу берет управление на себя
});

self.addEventListener('fetch', (e) => {
    // ГЛАВНЫЙ БАЙПАС: Если запрос идет к локальной плате ESP32,
    // воркер не вмешивается. Это обходит блокировку Mixed Content.
    if (e.request.url.includes('192.168.4.')) {
        return;
    }
});
