"use client"

import { useSyncExternalStore } from "react"
import { Loader2 } from "lucide-react"
import { useMaintenanceMode } from "@/lib/hooks/useMaintenanceMode"
import { MaintenanceScreen } from "./maintenance-screen"
import { MaintenanceLocalIndicator } from "./maintenance-local-indicator"

/* ─────────────────────────────────────────────────────────────────
   MaintenanceGuard

   Envuelve la app completa y gestiona dos comportamientos según
   el entorno cuando el modo mantenimiento está activo:

   · Producción  → bloqueo total con <MaintenanceScreen />
   · Local/Red   → la app sigue funcionando con un indicador flotante
                   cuyo detalle se consulta bajo demanda

   El estado del entorno se lee como un store externo vía
   useSyncExternalStore. El servidor no presupone acceso local;
   la app espera la consulta inicial antes de mostrar sus páginas.
──────────────────────────────────────────────────────────────────── */

/* Hosts que se consideran entorno de desarrollo local */
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"]

function getIsLocal(): boolean {
  if (process.env.NODE_ENV === "development") return true
  const { hostname } = window.location
  return (
    LOCAL_HOSTNAMES.includes(hostname) ||
    hostname.startsWith("192.168.") // red local para pruebas en dispositivos
  )
}

// El entorno de ejecución no cambia durante la sesión del navegador.
const noopSubscribe = () => () => {}
const SERVER_SNAPSHOT = false

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenance, endsAt, loading } = useMaintenanceMode()
  const isLocal = useSyncExternalStore(noopSubscribe, getIsLocal, () => SERVER_SNAPSHOT)

  // No montar páginas (incluido /login) antes de conocer el estado inicial.
  if (loading) return (
    <main className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
      <div role="status" className="flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        <span>Cargando…</span>
      </div>
    </main>
  )

  // ── Modo mantenimiento activo ──────────────────────────────────
  if (isMaintenance) {
    // Producción: bloqueo total
    if (!isLocal) return <MaintenanceScreen endsAt={endsAt} />

    // Desarrollo / red local: aviso no bloqueante
    return (
      <>
        {children}
        <MaintenanceLocalIndicator />
      </>
    )
  }

  // Sin mantenimiento: renderizado transparente
  return <>{children}</>
}
