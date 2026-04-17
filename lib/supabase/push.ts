import { supabase } from "./client"

/**
 * Solicita permiso de notificaciones al usuario y suscribe al PushManager.
 * Llamar SOLO después del login (una sola vez).
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false

  let permission = Notification.permission
  if (permission === "default") {
    permission = await Notification.requestPermission()
  }
  if (permission !== "granted") return false

  return !!(await subscribeToPush())
}

/**
 * Suscribe el navegador al PushManager SIN pedir permiso.
 * Solo funciona si el permiso ya fue otorgado.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null
  if (Notification.permission !== "granted") return null

  const reg = await navigator.serviceWorker.ready

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurada — push no disponible")
    return null
  }

  // Forzar suscripción fresca: primero desuscribir si hay una existente
  // para evitar suscripciones stale con VAPID keys viejas
  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    // Verificar que use el mismo VAPID key
    const existingKey = existing.options?.applicationServerKey
    const newKey = urlBase64ToUint8Array(vapidKey)
    const keysMatch = existingKey && arrayBufferEquals(existingKey, newKey.buffer as ArrayBuffer)
    if (!keysMatch) {
      console.log("[Push] VAPID key cambió — desuscribiendo suscripción anterior")
      await existing.unsubscribe()
    }
  }

  let subscription = await reg.pushManager.getSubscription()

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    })
    console.log("[Push] Nueva suscripción creada")
  }

  // Persistir en Supabase
  // Nota: push_subscriptions.user_id referencia auth.users(id), que es igual a user.id
  const keys = subscription.toJSON().keys!
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    console.log("[Push] Guardando suscripción para user:", user.id)

    // Borrar suscripciones anteriores del mismo usuario (evita envíos a endpoints stale)
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id)

    const { error: upsertError } = await supabase.from("push_subscriptions").insert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh!,
      auth: keys.auth!,
    })
    if (upsertError) {
      console.error("[Push] ERROR guardando suscripción:", upsertError.code, upsertError.message, upsertError.details)
    } else {
      console.log("[Push] Suscripción guardada correctamente")
    }
  } else {
    console.warn("[Push] No hay usuario autenticado, no se guarda la suscripción")
  }

  return subscription
}

/** Cancela la suscripción y la elimina de la BD */
export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await sub.unsubscribe()
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
  }
}

/** Indica si el navegador está suscrito a push */
export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub !== null
}

/** Sincroniza el badge del ícono de la app con el conteo de no leídas */
export function syncBadge(unreadCount: number): void {
  if (!("serviceWorker" in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "SET_BADGE", count: unreadCount })
  }).catch(() => {})
}

/** Limpia el badge (llamar cuando el usuario marca todas como leídas) */
export function clearBadge(): void {
  if (!("serviceWorker" in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: "CLEAR_BADGE" })
  }).catch(() => {})
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

function arrayBufferEquals(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false
  const va = new Uint8Array(a)
  const vb = new Uint8Array(b)
  for (let i = 0; i < va.length; i++) {
    if (va[i] !== vb[i]) return false
  }
  return true
}
