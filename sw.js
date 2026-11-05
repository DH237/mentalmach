// Service worker de Mental Mach : permet l'installation et le fonctionnement hors ligne.
// À chaque nouvelle version publiée, change le numéro ci-dessous (v1 -> v2, etc.)
// pour que les téléphones récupèrent les nouveaux fichiers.
const VERSION = "mentalmach-v23";
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
    caches.open(VERSION)
      .then((c) => Promise.all(FICHIERS.map((f) => c.add(new Request(f, { cache: "reload" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Pages : on va d'abord chercher la dernière version sur le réseau (sans cache HTTP),
// et on ne retombe sur la copie enregistrée que hors ligne.
// Autres fichiers (icônes, manifeste) : copie du cache, mise à jour en arrière-plan.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const memeOrigine = new URL(e.request.url).origin === location.origin;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request, { cache: "no-cache" })
        .then((r) => {
          if (r.ok && memeOrigine) {
            const copie = r.clone();
            caches.open(VERSION).then((c) => c.put("index.html", copie));
          }
          return r;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cache) => {
      const reseau = fetch(e.request)
        .then((r) => {
          if (r.ok && memeOrigine) {
            const copie = r.clone();
            caches.open(VERSION).then((c) => c.put(e.request, copie));
          }
          return r;
        })
        .catch(() => cache);
      return cache || reseau;
    })
  );
});
