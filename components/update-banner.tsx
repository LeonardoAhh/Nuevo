"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Loader2, RefreshCw, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppUpdate } from "@/lib/hooks/useAppUpdate"
import { useState } from "react"

/**
 * Floating, non-blocking notice shown when a new service worker version
 * is installed and ready to activate. Powered by the shared useAppUpdate
 * hook so the banner, the header button, and any future consumer all see
 * the same status without duplicating SW event listeners.
 *
 * Sizing relies on the Tailwind type scale (rem-based), so it follows the
 * app's font-size setting; colors come exclusively from theme tokens
 * (accent color aware).
 */
export function UpdateBanner() {
  const { status, applyUpdate } = useAppUpdate()
  const [dismissed, setDismissed] = useState(false)
  const reduced = useReducedMotion()

  const visible = status === "available" && !dismissed
  const applying = status === "applying"

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
        >
          <div className="rounded-md border border-border/60 bg-card p-4 shadow-lg">
            <div className="flex items-start gap-3">
              {/* Icon tile */}
              <span className="grid size-10 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>

              {/* Copy */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Nueva versión disponible
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Actualiza para aplicar los cambios más recientes.
                </p>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" onClick={applyUpdate} disabled={applying}>
                    {applying ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden="true" />
                        Actualizando…
                      </>
                    ) : (
                      <>
                        <RefreshCw aria-hidden="true" />
                        Actualizar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDismissed(true)}
                    disabled={applying}
                    aria-label="Cerrar aviso de actualización"
                  >
                    Más tarde
                  </Button>
                </div>
              </div>

              {/* Close button — top right */}
              <button
                type="button"
                onClick={() => setDismissed(true)}
                disabled={applying}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar aviso de actualización"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            {/* Screen-reader-only completion cue while the reload settles */}
            <span className="sr-only" aria-live="polite">
              {applying ? "Actualización en proceso, la página se recargará." : ""}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
