"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  StatusCaption, StatusDivider, StatusShell,
} from "@/components/ui/status-shell"

/**
 * Route error boundary. Rendered by Next.js when a segment throws.
 * Shares the StatusShell surface with the maintenance screen so both
 * system states feel like one product (tokens, density, fonts, motion).
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app/error]", error)
  }, [error])

  const code = error.digest ? `#${error.digest}` : null

  return (
    <>
      <StatusShell
        icon={AlertCircle}
        tone="destructive"
        eyebrow="Error inesperado"
        title="Algo salió mal"
        description="No pudimos mostrar esta sección. Intenta de nuevo; si el problema continúa, recarga la página."
        labelledBy="error-heading"
      >
        {code && (
          <div className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <p className="font-mono text-xs text-muted-foreground">
              Código de referencia:{" "}
              <span className="font-semibold text-foreground">{code}</span>
            </p>
          </div>
        )}

        <StatusDivider />

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} aria-label="Reintentar cargar la sección">
            <RotateCcw aria-hidden="true" />
            Reintentar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Ir al inicio
            </Link>
          </Button>
        </div>
      </StatusShell>

      <p className="sr-only">
        Si este error persiste, reporta el incidente a Recursos Humanos e incluye el código de referencia.
      </p>

      <StatusCaption className="fixed inset-x-0 bottom-4 px-4 text-center">
        Vinoplastic · Planta Querétaro — App Error
      </StatusCaption>
    </>
  )
}
