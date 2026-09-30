"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppTransition, APP_TRANSITION_EXIT_MS, APP_TRANSITION_MIN_MS, useAppReducedMotion } from "@/components/app-transition"
import { useRole } from "@/lib/hooks"

export function PostLoginLoading() {
  const searchParams = useSearchParams()
  const requestedPath = searchParams.get("to")
  const redirectTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") && requestedPath !== "/" && !requestedPath.startsWith("/auth/redirect")
    ? requestedPath
    : "/inicio"
  const { role, loading: roleLoading } = useRole()
  const router = useRouter()
  const prefersReducedMotion = useAppReducedMotion()

  const [ready, setReady] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), prefersReducedMotion ? 0 : APP_TRANSITION_MIN_MS)
    return () => window.clearTimeout(timer)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (roleLoading || !ready) return

    const destination = role === "evaluador" ? "/desempeno" : redirectTo
    setExiting(true)

    const timer = window.setTimeout(() => {
      router.replace(destination)
    }, prefersReducedMotion ? 0 : APP_TRANSITION_EXIT_MS)

    return () => window.clearTimeout(timer)
  }, [roleLoading, ready, role, redirectTo, router, prefersReducedMotion])

  const statusLabel = roleLoading
    ? "Verificando acceso…"
    : ready
      ? "Redirigiendo…"
      : "Preparando tu espacio…"

  return <AppTransition message={statusLabel} leaving={exiting} />
}
