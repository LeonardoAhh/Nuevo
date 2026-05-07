"use client"

import { WifiOff } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"

/**
 * Fallback rendered by the service worker when a navigation fetch fails
 * and no cached copy is available. The page is pre-cached at install time
 * so it loads even without a network.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background text-foreground">
      <ErrorState
        icon={WifiOff}
        code="Sin conexión"
        title="No hay conexión a internet"
        description="Revisa tu red y vuelve a intentarlo. Mientras tanto, las secciones visitadas recientemente siguen disponibles en modo caché."
        tone="warning"
        primaryAction={{
          label: "Reintentar",
          onClick: () => {
            if (typeof window !== "undefined") window.location.reload()
          },
        }}
      />
    </main>
  )
}
