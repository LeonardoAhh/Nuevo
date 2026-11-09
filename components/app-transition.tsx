"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useTheme } from "@/components/theme-context"

export const APP_TRANSITION_MIN_MS = 900
export const APP_TRANSITION_EXIT_MS = 350
const APP_MARK_MASK = "url('/icons/icon.svg') center / contain no-repeat"

interface AppTransitionProps {
  message: string
  mode?: "page" | "overlay"
  leaving?: boolean
}

export function useAppReducedMotion() {
  const systemReducedMotion = useReducedMotion() ?? false
  const { reducedMotion } = useTheme()
  return systemReducedMotion || reducedMotion
}

export function AppMark({ className }: { className: string }) {
  const reducedMotion = useAppReducedMotion()

  return (
    <motion.span
      aria-hidden="true"
      className={`block bg-foreground ${className}`}
      style={{ mask: APP_MARK_MASK, WebkitMask: APP_MARK_MASK }}
      initial={false}
      animate={
        reducedMotion
          ? { opacity: 1, scale: 1 }
          : { opacity: [0.7, 1, 0.7], scale: [0.96, 1, 0.96] }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 2.2, ease: "easeInOut", repeat: Infinity }
      }
    />
  )
}

export function AppTransition({
  message,
  mode = "page",
  leaving = false,
}: AppTransitionProps) {
  const reducedMotion = useAppReducedMotion()

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy="true"
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={
        mode === "overlay"
          ? "fixed inset-0 z-[200] flex items-center justify-center bg-background text-foreground"
          : "flex min-h-dvh items-center justify-center bg-background text-foreground"
      }
    >
      <div className="flex max-w-[calc(100vw-2rem)] flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-6 text-center">
        <AppMark className="size-12 shrink-0" />
        <p className="text-sm font-normal leading-5 text-muted-foreground">{message}</p>
      </div>
    </motion.div>
  )
}
