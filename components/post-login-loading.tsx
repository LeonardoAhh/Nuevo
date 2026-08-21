"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { useRole } from "@/lib/hooks"

const MIN_MS = 400
const EXIT_MS = 250
const APP_NAME = "Capacitación Qro"

export function PostLoginLoading() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("to") ?? "/"
  const { role, loading: roleLoading } = useRole()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion() ?? false

  const [ready, setReady] = useState(false)
  const [exiting, setExiting] = useState(false)
  const didRedirect = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), MIN_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (didRedirect.current || roleLoading || !ready) return
    didRedirect.current = true

    const destination = role === "evaluador" ? "/desempeno" : redirectTo
    setExiting(true)

    const timer = window.setTimeout(() => {
      router.replace(destination)
    }, EXIT_MS)

    return () => window.clearTimeout(timer)
  }, [roleLoading, ready, role, redirectTo, router])

  const statusLabel = roleLoading
    ? "Verificando acceso…"
    : ready
      ? "Redirigiendo…"
      : "Preparando tu espacio…"

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy={roleLoading || !ready}
      aria-label="Preparando tu espacio"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background text-foreground"
      initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <div className="mx-auto w-full max-w-xs px-5 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          {statusLabel}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/20">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: prefersReducedMotion ? "100%" : "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: prefersReducedMotion ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </motion.div>
  )
}
