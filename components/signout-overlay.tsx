"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LogOut, Loader2 } from "lucide-react"

interface SignOutOverlayProps {
  show: boolean
  message?: string
}

export default function SignOutOverlay({
  show,
  message = "Cerrando sesión...",
}: SignOutOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="signout-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const, delay: 0.05 }}
            className="flex flex-col items-center gap-4 rounded-xl border bg-card px-8 py-6 shadow-lg"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
              className="rounded-full bg-primary/10 p-3 text-primary"
            >
              <LogOut size={22} />
            </motion.div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
              <span>{message}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
