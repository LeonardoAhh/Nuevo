"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"

/**
 * Route-level error boundary. Catches uncaught errors from any page/layout
 * inside the segment but still renders inside the root layout, so the
 * sidebar / header stay visible. For unrecoverable root errors see
 * `app/global-error.tsx`.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report to whatever log collector is configured. Keeping this
    // lightweight — Vercel captures `console.error` automatically.
    console.error("[app/error]", error)
  }, [error])

  return (
    <main className="flex min-h-[60dvh] items-center justify-center">
      <ErrorState
        icon={AlertCircle}
        code={error.digest ? `Error ${error.digest}` : "Error inesperado"}
        title="Algo salió mal"
        description="No pudimos mostrar esta sección. Intenta de nuevo; si el problema continúa, recarga la página."
        tone="destructive"
        primaryAction={{ label: "Reintentar", onClick: reset }}
        secondaryAction={{ label: "Ir al inicio", href: "/" }}
      />
    </main>
  )
}
