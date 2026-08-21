"use client"

import { useEffect } from "react"

/**
 * Registra el Service Worker (modo offline de la PWA).
 * Verifica actualizaciones cada hora.
 */
export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        setInterval(() => reg.update(), 60 * 60 * 1000)
      })
      .catch((err) => {
        console.warn("SW registration failed:", err)
      })
  }, [])

  return null
}
