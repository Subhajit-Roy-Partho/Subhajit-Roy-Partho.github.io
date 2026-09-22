/* Service worker: fast repeat loads for a static-export site on GitHub Pages,
   with freshness winning over cache on every visit (the site deploys often).
   - /_next/static/*  → cache-first (content-hashed URLs: a new build means new
     URLs, so a cached copy can never be stale)
   - navigations      → network-first with forced revalidation; the fresh page
     refreshes the cache; the cached page serves only when offline
   - other same-origin (images, fonts, icons, misc) → same network-first +
     refresh-cache + offline-fallback treatment
   - cross-origin (Google Analytics, etc.) → never touched
   `cache: "no-cache"` on the fetch forces a conditional revalidation with the
   server instead of trusting the HTTP cache, so an update always wins; an
   unchanged response comes back as a tiny 304 round-trip, not a download.
*/
const VERSION = "v2";
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const ASSETS_CACHE = `assets-${VERSION}`;
const KNOWN_CACHES = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

// Update wins over cache: revalidate with the server first, refresh the
// cache on success, serve the cached copy only when the network fails.
async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(new Request(request, { cache: "no-cache" }));
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    return fallback();
  }
}

const offlinePage = () =>
  new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // GA and other third parties untouched

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE, offlinePage));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images, fonts, icons, and everything else same-origin: fresh copy wins,
  // cache refreshes behind it, cached copy covers offline.
  event.respondWith(networkFirst(request, ASSETS_CACHE, () => Response.error()));
});
