const CACHE_NAME = "calc-rural-v1";

// Lista de archivos que se guardan en la memoria local del celular
const assets = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./logo.png",
];

// 1. Evento de instalación: descarga y guarda en caché todos los archivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(
        "Archivos de la Calculadora guardados en caché correctamente.",
      );
      return cache.addAll(assets);
    }),
  );
  self.skipWaiting();
});

// 2. Evento de activación: limpia cachés viejas si actualizás la app
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// 3. Evento Fetch: sirve los archivos guardados localmente cuando no hay internet
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el archivo está en la memoria del celular, lo devuelve directo (offline)
      if (cachedResponse) {
        return cachedResponse;
      }
      // Si no está en caché pero hay conexión, lo busca en la red
      return fetch(event.request);
    }),
  );
});
