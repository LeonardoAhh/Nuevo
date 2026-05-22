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
      .then(() => self.skipWaiting()),
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

// ─── Helpers de badge ─────────────────────────────────────────────────────────
async function updateBadge() {
  if (!("setAppBadge" in navigator)) return
  try {
    const db = await openBadgeDB()
    const count = await db.get("badge_count") || 0
    if (count > 0) {
      await navigator.setAppBadge(count)
    } else {
      await navigator.clearAppBadge()
    }
  } catch {
    // API de badge no disponible en este contexto
  }
}

async function incrementBadge() {
  if (!("setAppBadge" in navigator)) return
  try {
    const db = await openBadgeDB()
    const current = (await db.get("badge_count")) || 0
    const next = current + 1
    await db.set("badge_count", next)
    await navigator.setAppBadge(next)
  } catch {
    // Silenciar errores de badge
  }
}

async function decrementBadge() {
  if (!("setAppBadge" in navigator)) return
  try {
    const db = await openBadgeDB()
    const current = (await db.get("badge_count")) || 0
    const next = Math.max(0, current - 1)
    await db.set("badge_count", next)
    if (next > 0) {
      await navigator.setAppBadge(next)
    } else {
      await navigator.clearAppBadge()
    }
  } catch {
    // Silenciar errores de badge
  }
}

// Mini IndexedDB wrapper para persistir el contador de badge
function openBadgeDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("sw-badge-db", 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("kv")
    }
    req.onsuccess = (e) => {
      const db = e.target.result
      resolve({
        get: (key) =>
          new Promise((res, rej) => {
            const tx = db.transaction("kv", "readonly")
            const r = tx.objectStore("kv").get(key)
            r.onsuccess = () => res(r.result)
            r.onerror = () => rej(r.error)
          }),
        set: (key, val) =>
          new Promise((res, rej) => {
            const tx = db.transaction("kv", "readwrite")
            const r = tx.objectStore("kv").put(val, key)
            r.onsuccess = () => res()
            r.onerror = () => rej(r.error)
          }),
      })
    }
    req.onerror = () => reject(req.error)
  })
}

// ─── Push notifications ───────────────────────────────────────────────────────
// The server-side sender (lib/push/format.ts) is the single source of truth
// for title / body / tag. The SW just renders whatever it gets, no parsing.
self.addEventListener("push", (event) => {
  const fallback = { title: "Vertx", body: "" }
  let data = fallback
  try {
    data = event.data ? event.data.json() : fallback
  } catch {
    data = { ...fallback, body: event.data?.text() || "" }
  }

  const tag     = data.tag || "general"
  const notifId = data.id  || ""

  const options = {
    body: data.body || "",
    icon:    "/icons/icon-512.png",
    badge:   "/icons/icon-192.png",
    tag,
    // Don't re-alert when the same tag is replaced (e.g. "baja en 3d" → "baja hoy").
    renotify: false,
    silent:   false,
    data: { url: data.url || "/", id: notifId, tag },
    // `actions` is intentionally omitted — iOS ignores it, and on desktop
    // Chrome the "mark as read" action created confusion vs. the in-app bell.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || fallback.title, options)
      .then(() => incrementBadge())
  )
})

// ─── Click en notificación ────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  const notifData = event.notification.data || {}
  const url = notifData.url || "/"
  const notifId = notifData.id || ""

  event.notification.close()

  event.waitUntil(
    decrementBadge().then(() =>
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "NOTIFICATION_CLICK", url, id: notifId })
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
    )
  )
})

// ─── Cierre de notificación ───────────────────────────────────────────────────
self.addEventListener("notificationclose", (event) => {
  // El usuario descartó la notificación sin hacer click → decrementar badge
  event.waitUntil(decrementBadge())
})

// ─── Mensajes desde la app (ej: sincronizar badge al leer todas) ──────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_BADGE") {
    event.waitUntil(
      openBadgeDB().then((db) => db.set("badge_count", 0))
        .then(() => {
          if ("clearAppBadge" in navigator) return navigator.clearAppBadge()
        })
    )
  }

  if (event.data?.type === "SET_BADGE") {
    const count = event.data.count || 0
    event.waitUntil(
      openBadgeDB().then((db) => db.set("badge_count", count))
        .then(() => {
          if (!("setAppBadge" in navigator)) return
          return count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge()
        })
    )
  }
})
