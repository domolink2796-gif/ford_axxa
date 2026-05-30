self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
  // Пустой обработчик - нужен просто для того, чтобы Chrome пропустил проверку на PWA
});
