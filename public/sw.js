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

  // Nunca cachear /comparar com query params (dados dinâmicos) - sempre vai à rede
  if (request.url.includes("/comparar") && request.url.includes("?")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback: tenta cache da home ou retorna erro controlado
          const fallback = await caches.match("/");
          return fallback || new Response("Offline - sem cache", { status: 503, statusText: "Offline" });
        }),
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