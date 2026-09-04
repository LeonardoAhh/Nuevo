"use client"

import { useSyncExternalStore } from "react"
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
  const { isMaintenance, endsAt, loading } = useMaintenanceMode()
  const isLocal = useSyncExternalStore(noopSubscribe, getIsLocal, () => SERVER_SNAPSHOT)

  // Mientras carga el estado de mantenimiento, renderiza la app
  // normalmente para no penalizar el tiempo de carga inicial
  if (loading) return <>{children}</>

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
