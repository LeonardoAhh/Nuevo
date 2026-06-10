"use client"

import { useEffect, useState } from "react"
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

   El estado isLocalhost arranca en `true` para evitar un destello
   donde la app se muestra brevemente antes de que el efecto corra
   en el cliente.
──────────────────────────────────────────────────────────────────── */

/* Hosts que se consideran entorno de desarrollo local */
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"]
const isLocalHost = (hostname: string) =>
  LOCAL_HOSTNAMES.includes(hostname) ||
  hostname.startsWith("192.168.") // red local para pruebas en dispositivos

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenance, loading } = useMaintenanceMode()

  // Inicia en true para evitar destello al cargar en producción
  const [isLocal, setIsLocal] = useState(true)

  useEffect(() => {
    setIsLocal(isLocalHost(window.location.hostname))
  }, [])

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
        {/* Barra de aviso — usa tokens de destructive para máxima
            visibilidad sin colores hardcodeados */}
        <div
          className="relative z-[99999] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium"
          style={{
            backgroundColor: "hsl(var(--destructive))",
            color: "hsl(var(--destructive-foreground))",
          }}
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
