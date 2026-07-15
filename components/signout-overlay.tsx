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
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="mx-auto w-full max-w-xs px-5 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-4">
              Saliendo...
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/20">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: prefersReducedMotion ? "100%" : "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: prefersReducedMotion ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] as const }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
