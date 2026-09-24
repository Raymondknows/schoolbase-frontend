const CACHE_NAME = "schoolbase-static-v5";
const OFFLINE_URL = "/offline.html";

const isStaticAsset = (requestUrl) =>
  requestUrl.pathname.startsWith("/_next/static/") ||
  ["script", "style", "font", "image"].includes(requestUrl.pathname.split(".").pop());

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("schoolbase-static-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedPage = await cache.match(event.request, { ignoreSearch: true });
        if (cachedPage) {
          return cachedPage;
        }

        const offlineResponse = await cache.match(OFFLINE_URL);
        return offlineResponse || Response.redirect(OFFLINE_URL);
      }),
    );
    return;
  }

  if (!isStaticAsset(requestUrl)) return;

  if (requestUrl.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        }
        return response;
      }).catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkResponse = fetch(event.request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        }
        return response;
      });

      return cachedResponse || networkResponse;
    }),
  );
});