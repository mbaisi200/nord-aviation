const CACHE = "nord-aviation-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const rede = fetch(request)
        .then((resposta) => {
          if (resposta.ok && resposta.type === "basic") {
            const clone = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return resposta;
        })
        .catch(() => cached);
      return cached || rede;
    }),
  );
});