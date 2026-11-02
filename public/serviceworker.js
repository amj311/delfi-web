const CACHE_NAME = `delfi-v1`;
const OFFLINE_URL = '/';

addEventListener("message", (event) => {
	if (event.data.type === 'indexResources') {
		cacheIndexResources(event.data.indexResources).catch(console.log);
	}
});

async function cacheIndexResources(indexResources) {
	try {
		const cache = await caches.open(CACHE_NAME);
		// remove previous indexResources
		const previousItems = await getData('indexResources');
		if (previousItems) {
			const oldItems = previousItems.filter(item => !indexResources.includes(item));
			await Promise.all(oldItems.map(item => cache.delete(item)));
		}
		await cache.addAll([OFFLINE_URL, ...indexResources]);
		await setData('indexResources', indexResources);
	}
	catch (e) {
		console.error("Failed to cache indexResources");
		console.error(e);
	}
};

// Intercept fetch requests and serve cached resources when offline, but only cache URLs matching certain patterns.
const CACHE_URL_PATTERNS = [
	/^\/$/, // root
	/^\/index\.html$/,
	/^\/public\//,
	/^\/assets\//
];

function shouldCache(url) {
	const path = new URL(url, self.location.origin).pathname;
	return CACHE_URL_PATTERNS.some(pattern => pattern.test(path));
}

const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener('fetch', event => {
	if (shouldCache(event.request.url)) {
		event.respondWith((async () => {
			const cache = await caches.open(CACHE_NAME);

			try {
				// Network-first with timeout: serve fresh from the server, but fall back
				// to cache if the network is too slow or unavailable.
				const timeoutSignal = AbortSignal.timeout(NETWORK_TIMEOUT_MS);
				const fetchResponse = await fetch(event.request, { signal: timeoutSignal });
				if (fetchResponse.ok) {
					cache.put(event.request, fetchResponse.clone());
				}
				return fetchResponse;
			} catch (error) {
				// Fall back to cache when offline or request timed out.
				const cachedResponse = await cache.match(event.request);
				if (cachedResponse) {
					return cachedResponse;
				}
				if (event.request.mode === 'navigate') {
					return cache.match(OFFLINE_URL);
				}
				throw error;
			}
		})());
	}
});

// Skip the waiting phase so the new service worker activates immediately.
self.addEventListener('install', event => {
	event.waitUntil(self.skipWaiting());
});

// Clean up old caches during the activate event and take control of all open pages.
self.addEventListener('activate', event => {
	event.waitUntil((async () => {
		const cacheNames = await caches.keys();
		await Promise.all(
			cacheNames.map(cacheName => {
				if (cacheName !== CACHE_NAME) {
					return caches.delete(cacheName);
				}
			})
		);
		await self.clients.claim();
	})());
});



// Simple IndexedDB helper
function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('sw-db', 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore('kv');
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function setData(key, value) {
	const db = await openDB();
	const tx = db.transaction('kv', 'readwrite');
	tx.objectStore('kv').put(value, key);
	return tx.complete;
}

async function getData(key) {
	const db = await openDB();
	const tx = db.transaction('kv', 'readonly');
	const request = tx.objectStore('kv').get(key);
	return new Promise((resolve, reject) => {
		request.onsuccess = () => {
			if (request.readyState === 'done') {
				resolve(request.result);
			}
		};
		request.onerror = () => reject(request.error);
	});
}




// PUSH NOTIFICATIONS!!!!

async function fetchAsync(url) {
	const response = await fetch(url);
	return await response.text();
}

self.addEventListener('activate', async () => {
	console.log('Service worker activated');
	try {
		// const apiOrigin = self.location.origin.includes(':517')
		// 	? 'http://localhost:5000/api'
		// 	: '/api';
		// const applicationServerKey = await fetchAsync(apiOrigin + '/vapidkey');
		// console.log(applicationServerKey);
		// const options = { applicationServerKey, userVisibleOnly: true };
		// await self.registration.pushManager.subscribe(options);
	} catch (err) {
		console.log('Error', err);
	}
});

self.addEventListener('push', async function (event) {
	let notifData;
	try {
		notifData = JSON.parse(event.data.text());
	} catch (e) {
		console.log('Error', e);
	}
	if (!notifData?.title) {
		console.log('Received malformed notification', notifData);
		return;
	}

	await self.registration.showNotification(notifData.title, {
		icon: '/gemini_logo_2_trans.png',
		// badge: '/mask-white.png',
		// data: { gameRoomId: notifData.gameRoomId },
		body: notifData.body,
		vibrate: [200],
		// tag: 'game_' + notifData.gameRoomId,
		renotify: true,
	});
});

self.addEventListener('notificationclick', async (event) => {
	// const gameRoomId = event.notification.data.gameRoomId;
	const appUrl = self.location.origin;

	event.notification.close();
	event.waitUntil(
		(async () => {
			const openTabs = await clients.matchAll({ type: 'window' });
			const gameTab = openTabs.find((tab) => {
				return tab.url === appUrl;
			});

			if (gameTab) {
				gameTab.focus();
			} else {
				await clients.openWindow(appUrl);
			}
		})()
	);
});
