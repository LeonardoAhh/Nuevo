"use client"

import type { ReactNode } from "react"
import { useRole } from "@/lib/hooks"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RoleGateProps {
  children: ReactNode
  /** Contenido a mostrar cuando el usuario no tiene permiso (opcional) */
  fallback?: ReactNode
  /** Si true, oculta completamente el elemento en vez de deshabilitarlo */
  hide?: boolean
}

/**
 * Envuelve elementos que solo los usuarios con rol 'dev' pueden usar.
 * - Por defecto muestra los children deshabilitados con tooltip explicativo.
 * - Con hide=true, oculta completamente el contenido para 'admin'.
 */
export function RoleGate({ children, fallback, hide = false }: RoleGateProps) {
  const { canEdit, loading } = useRole()

  if (loading) return null

  if (canEdit) return <>{children}</>

  if (hide) return null

  if (fallback) return <>{fallback}</>

  // Default: mostrar deshabilitado con tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex opacity-50 pointer-events-none select-none" aria-disabled="true">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>La funciones "edit" , no estan dispobles para tu rol asignado</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
