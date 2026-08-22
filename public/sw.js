// TIMESTAMP: 2026-08-21T21:04:35.649Z
const CACHE_NAME = "vinoplastic-v5"
const STATIC_CACHE = "vinoplastic-static-v5"
const API_CACHE = "vinoplastic-api-v5"

// Recursos a pre-cachear en la instalación. `/offline` es la ruta de
// fallback cuando una navegación falla y no hay copia en caché.
const PRECACHE_URLS = ["/", "/login", "/offline", "/capacitacion", "/nuevo-ingreso"]
const OFFLINE_URL = "/offline"

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
  )
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo interceptamos GET
  if (request.method !== "GET") return

  // Supabase → Network First (datos siempre frescos, fallback a cache)
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(networkFirst(request, API_CACHE, 24 * 60 * 60))
    return
  }

  // Assets estáticos de Next.js → Network First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(networkFirst(request, STATIC_CACHE, 365 * 24 * 60 * 60))
    return
  }

  // Páginas de la app → Network First con fallback
  if (url.origin === self.location.origin && !url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, STATIC_CACHE, 60 * 60))
    return
  }
})

// ─── Estrategias ──────────────────────────────────────────────────────────────

async function networkFirst(request, cacheName, maxAgeSeconds = 3600) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.destination === "document") {
      // Prefer the dedicated /offline route; fall back to the last-cached
      // root if the offline page isn't in the cache yet (first visit).
      const offlinePage = await caches.match(OFFLINE_URL)
      if (offlinePage) return offlinePage
      const rootCached = await caches.match("/")
      if (rootCached) return rootCached
    }
    return new Response("Sin conexión", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}

// ─── Mensajes desde la app ─────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
