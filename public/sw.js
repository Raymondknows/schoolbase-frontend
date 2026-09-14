const CACHE_NAME = "schoolbase-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      new Response("Network unavailable", {
        status: 503,
        statusText: "Network unavailable",
        headers: { "Content-Type": "text/plain" },
      }),
    ),
  );
});