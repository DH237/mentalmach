// Service worker de Mental Mach : permet l'installation et le fonctionnement hors ligne.
// À chaque nouvelle version publiée, change le numéro ci-dessous (v1 -> v2, etc.)
// pour que les téléphones récupèrent les nouveaux fichiers.
const VERSION = "mentalmach-v6";
const FICHIERS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Réponse immédiate depuis le cache, puis mise à jour en arrière-plan.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cache) => {
      const reseau = fetch(e.request)
        .then((r) => {
          if (r.ok && new URL(e.request.url).origin === location.origin) {
            const copie = r.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copie));
          }
          return r;
        })
        .catch(() => cache || caches.match("index.html"));
      return cache || reseau;
    })
  );
});
