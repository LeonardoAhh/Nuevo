"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { AppTransition, APP_TRANSITION_MIN_MS, useAppReducedMotion } from "@/components/app-transition"
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
  const reducedMotion = useAppReducedMotion()
  const [transitionReady, setTransitionReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setTransitionReady(true), reducedMotion ? 0 : APP_TRANSITION_MIN_MS)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  // No montar páginas (incluido /login) antes de conocer el estado inicial.
  if (loading || !transitionReady) return <AppTransition message="Preparando tu espacio…" />

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
