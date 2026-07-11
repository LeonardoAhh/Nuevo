"use client"

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface SignOutOverlayProps {
  show: boolean
  message?: string
}

export default function SignOutOverlay({
  show,
  message = "Cerrando sesión...",
}: SignOutOverlayProps) {
  const prefersReducedMotion = useReducedMotion() ?? false

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="signout-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="mx-auto w-full max-w-sm px-5">
            <div className="rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm backdrop-blur-sm">
              <div className="space-y-4 text-center">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Cerrando sesión
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {message}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Un momento mientras te redirigimos a la pantalla de inicio.
                </p>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted/20">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: prefersReducedMotion ? "100%" : "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: prefersReducedMotion ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] as const }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
