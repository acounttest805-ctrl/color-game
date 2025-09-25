const CACHE_NAME = 'color-game-cache-v1'; // ★ キャッシュの名前
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/icon.png',
  '/manifest.json',
  // ここにキャッシュしたい他のアセット（画像など）を追加できます
  // '/assets/find-the-color.png',
  // ...
  '/games/find-the-color/index.html',
  '/games/find-the-color/style.css',
  '/games/find-the-color/script.js',
  // ... 他のゲームのファイルも同様に追加 ...
];

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // 上記リストのファイルをすべてキャッシュする
        // 失敗するとインストールが完了しないので、必須ファイルのみが良い
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Failed to cache files:', error);
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
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }
        // キャッシュがなければネットワークにリクエスト
        return fetch(event.request);
      }
    )
  );
});
