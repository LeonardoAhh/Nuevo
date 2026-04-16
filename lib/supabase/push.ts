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

  // Verificar si ya existe suscripción activa
  let subscription = await reg.pushManager.getSubscription()

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  // Persistir en Supabase
  const keys = subscription.toJSON().keys!
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh!,
        auth: keys.auth!,
      },
      { onConflict: "endpoint" }
    )
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
