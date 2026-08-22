"use client"

import { useSyncExternalStore } from "react"
import { useMaintenanceMode } from "@/lib/hooks/useMaintenanceMode"
import { MaintenanceScreen } from "./maintenance-screen"
import { AlertTriangle } from "lucide-react"

/* ─────────────────────────────────────────────────────────────────
   MaintenanceGuard

   Envuelve la app completa y gestiona dos comportamientos según
   el entorno cuando el modo mantenimiento está activo:

   · Producción  → bloqueo total con <MaintenanceScreen />
   · Local/Red   → la app sigue funcionando con una barra de aviso
                   en la parte superior (sin interrumpir el trabajo)

   El estado del entorno se lee como un store externo vía
   useSyncExternalStore: el snapshot de servidor es `true` para
   evitar un destello donde la app se muestra brevemente antes de
   hidratar en el cliente.
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
const SERVER_SNAPSHOT = true

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenance, loading } = useMaintenanceMode()
  const isLocal = useSyncExternalStore(noopSubscribe, getIsLocal, () => SERVER_SNAPSHOT)

  // Mientras carga el estado de mantenimiento, renderiza la app
  // normalmente para no penalizar el tiempo de carga inicial
  if (loading) return <>{children}</>

  // ── Modo mantenimiento activo ──────────────────────────────────
  if (isMaintenance) {
    // Producción: bloqueo total
    if (!isLocal) return <MaintenanceScreen />

    // Desarrollo / red local: aviso no bloqueante
    return (
      <div className="flex flex-col min-h-screen">
        {/* Barra de aviso — tokens destructive, sin estilos inline */}
        <div
          className="relative z-[99999] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Mantenimiento activo —{" "}
            <strong className="font-semibold">producción bloqueada</strong>,
            acceso local permitido
          </span>
        </div>

        {/* Contenido normal de la app */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          {children}
        </div>
      </div>
    )
  }

  // Sin mantenimiento: renderizado transparente
  return <>{children}</>
}
