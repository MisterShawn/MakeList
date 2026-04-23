/// <reference types="@sveltejs/kit" />
import { build, files, prerendered, version } from '$service-worker';

const SHELL_CACHE = `makelist-shell-${version}`;
const EMOJI_CACHE = `makelist-emoji`;

// Precache everything except the openmoji SVGs (cached lazily on first use)
const SHELL_ASSETS = [
	...build,
	...prerendered,
	...files.filter((f) => !f.startsWith('/openmoji/')),
];

self.addEventListener('install', (e) => {
	(e as ExtendableEvent).waitUntil(
		caches
			.open(SHELL_CACHE)
			.then((cache) => cache.addAll(SHELL_ASSETS))
			.then(() => (self as unknown as ServiceWorkerGlobalScope).skipWaiting())
	);
});

self.addEventListener('activate', (e) => {
	(e as ExtendableEvent).waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((k) => k.startsWith('makelist-shell-') && k !== SHELL_CACHE)
						.map((k) => caches.delete(k))
				)
			)
			.then(() => (self as unknown as ServiceWorkerGlobalScope).clients.claim())
	);
});

self.addEventListener('fetch', (e) => {
	const event = e as FetchEvent;
	const url = new URL(event.request.url);

	// Only handle same-origin GETs
	if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

	if (url.pathname.startsWith('/openmoji/')) {
		// Cache-first for emoji SVGs: cache on first fetch, serve from cache after
		event.respondWith(
			caches.open(EMOJI_CACHE).then(async (cache) => {
				const cached = await cache.match(event.request);
				if (cached) return cached;
				const response = await fetch(event.request);
				if (response.ok) cache.put(event.request, response.clone());
				return response;
			})
		);
		return;
	}

	// Cache-first for everything else (app shell)
	event.respondWith(
		caches
			.match(event.request)
			.then((cached) => cached ?? fetch(event.request))
	);
});
