"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Verifica actualizaciones cada hora
          setInterval(() => reg.update(), 60 * 60 * 1000)
        })
        .catch((err) => {
          console.warn("SW registration failed:", err)
        })
    }
  }, [])

  return null
}
