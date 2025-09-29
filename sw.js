const CACHE_NAME = 'color-game-cache-33'; // 更新する際はここのバージョンを上げる
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/icon.png',
  '/manifest.json',
  // ゲームファイルを追加（例）
  '/games/find-the-color/index.html',
  '/games/find-the-color/style.css',
  '/games/find-the-color/script.js',
  // ...他のゲームのファイルも同様に追加...
];

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache files during install:', error);
        });
      })
  );
});

// 新しいバージョンが有効化されるときに、古いキャッシュを削除
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// リクエストを横取りし、キャッシュがあればキャッシュから返す
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// ★★★ メッセージを受け取って待機状態をスキップするリスナー ★★★
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

});
