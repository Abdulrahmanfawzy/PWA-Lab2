const CACHE_NAME = 'pwa-cache-v1'; // Cache version

const FILES_TO_CACHE = [
	'/',
	'/index.html',
];

// Install Service Worker and Cache Files
self.addEventListener('install', (event) => {
	console.log('Install Event', event);
	console.log('Service Worker: Installed');

	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('Service Worker: Caching Files');
			return cache.addAll(FILES_TO_CACHE);
		}),
	);
});


// Fetch Files from Cache First, then Network
self.addEventListener('fetch', (event) => {
	console.log(event);
	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		}),
	);
});
