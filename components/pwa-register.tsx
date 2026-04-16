"use client"

import { useEffect } from "react"

/**
 * Registra el Service Worker.
 * La suscripción push se activa después del login (en login-form.tsx),
 * no en este componente, para evitar pedir permisos antes de tiempo.
 */
export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Verifica actualizaciones cada hora
        setInterval(() => reg.update(), 60 * 60 * 1000)
      })
      .catch((err) => {
        console.warn("SW registration failed:", err)
      })
  }, [])

  return null
}
