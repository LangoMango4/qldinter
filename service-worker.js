const CACHE_NAME = 'qldinter-v9';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/animations.js',
  '/hero-slider.js',
  '/roblox-data.js',
  '/config.js',
  '/maintenance.js',
  '/navigation.js',
  '/pwa-install.js',
  '/favicon.png',
  '/enrol/',
  '/faq/',
  '/ourteam/',
  '/licence.html',
  '/tos.html',
  '/operations/',
  '/banned-users.html',
  '/feedback.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
};

// Fetch event - network-first for page/code updates, cache-first for static media
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const destination = event.request.destination;
  const pathname = requestUrl.pathname;
  const shouldUseNetworkFirst =
    event.request.mode === 'navigate' ||
    destination === 'document' ||
    destination === 'script' ||
    destination === 'style' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css');

  event.respondWith(
    (shouldUseNetworkFirst ? networkFirst(event.request) : cacheFirst(event.request)).catch(async () => {
      const fallback = await caches.match('/index.html');
      return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

