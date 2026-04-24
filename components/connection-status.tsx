"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { WifiOff } from "lucide-react"
import { notify } from "@/lib/notify"

/**
 * Global connection indicator.
 *
 *  - Toast "Sin conexión" when the browser drops network (debounced 1.5s so
 *    quick blips don't flicker).
 *  - Toast success "Conexión restablecida" when the network returns.
 *  - Persistent badge pinned top-right while offline so the user knows why a
 *    query might be failing even after the toast auto-dismisses.
 *
 * Mounted once in the root layout.
 */
export function ConnectionStatus() {
  const [offline, setOffline] = useState(false)
  const offlineToast = useRef<string | number | null>(null)
  const wasOnline = useRef<boolean>(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Initial state — SSR would default to online; update after mount.
    wasOnline.current = navigator.onLine
    setOffline(!navigator.onLine)

    const handleOffline = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (navigator.onLine) return // recovered within the debounce window
        wasOnline.current = false
        setOffline(true)
        offlineToast.current = notify.error("Sin conexión", {
          description: "Revisa tu red. Mostraremos los datos en caché mientras regresa.",
          duration: Infinity,
        })
      }, 1500)
    }

    const handleOnline = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      setOffline(false)
      if (offlineToast.current !== null) {
        notify.dismiss(offlineToast.current)
        offlineToast.current = null
      }
      if (!wasOnline.current) {
        wasOnline.current = true
        notify.success("Conexión restablecida")
      }
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (offlineToast.current !== null) notify.dismiss(offlineToast.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {offline ? (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed left-1/2 top-[max(env(safe-area-inset-top),0.75rem)] z-[60] -translate-x-1/2"
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur">
            <WifiOff className="size-3.5 text-warning" aria-hidden />
            <span>Sin conexión</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
