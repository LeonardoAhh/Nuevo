"use client"

import { useEffect } from "react"
import { subscribeToPush } from "@/lib/supabase/push"

/**
 * Registra el Service Worker.
 *
 * Si el permiso de notificaciones ya fue otorgado previamente
 * (sesión persistente), re-suscribe automáticamente para asegurar
 * que el endpoint esté guardado en la BD.
 *
 * El primer permiso se solicita en login-form.tsx (una sola vez),
 * nunca aquí, para evitar el diálogo antes de que el usuario se autentique.
 */
export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Verifica actualizaciones cada hora
        setInterval(() => reg.update(), 60 * 60 * 1000)

        // Si el permiso ya fue otorgado en una sesión anterior,
        // asegurar que la suscripción esté guardada en la BD
        if (
          "Notification" in window &&
          Notification.permission === "granted" &&
          "PushManager" in window
        ) {
          subscribeToPush().catch(() => {})
        }
      })
      .catch((err) => {
        console.warn("SW registration failed:", err)
      })

    // Escuchar mensajes del SW para debug en consola normal
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_PUSH_RECEIVED") {
        console.log("[SW→Page] Push recibido en SW:", event.data.data)
      }
      if (event.data?.type === "SW_NOTIFICATION_SHOWN") {
        console.log("[SW→Page] Notificación mostrada correctamente")
      }
      if (event.data?.type === "SW_NOTIFICATION_ERROR") {
        console.error("[SW→Page] Error mostrando notificación:", event.data.error)
      }
    })
  }, [])

  return null
}
