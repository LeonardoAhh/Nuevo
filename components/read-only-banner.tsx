"use client"

import { ShieldAlert } from "lucide-react"
import { useRole } from "@/lib/hooks"

/**
 * Banner compacto que se muestra cuando el usuario tiene rol 'admin' (solo lectura).
 * Incluirlo al inicio del contenido de cada página protegida.
 */
export function ReadOnlyBanner() {
  const { isReadOnly, loading } = useRole()

  if (loading || !isReadOnly) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-lg border border-warning/30 bg-warning/10 text-warning text-sm">
      <ShieldAlert className="h-4 w-4 flex-shrink-0" />
      <span>Modo solo lectura — no tienes permisos para editar, crear o eliminar.</span>
    </div>
  )
}
