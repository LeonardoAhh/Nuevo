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
      <div className="mx-auto w-full max-w-[28rem] px-5">
        <div className="rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm backdrop-blur-sm">
          <div className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Cargando
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {APP_NAME}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {statusLabel}
            </p>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted/20">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: prefersReducedMotion ? "100%" : "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: prefersReducedMotion ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
