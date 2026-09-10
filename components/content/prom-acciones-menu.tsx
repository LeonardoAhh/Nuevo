"use client"

import {
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  ClipboardPenLine,
  EllipsisVertical,
  UserRoundSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { EmpleadoPromocion } from "@/lib/promociones/types"
import { PROMOTION_ICON } from "@/lib/promociones/icon-styles"
import { calcularAptitud, isHabilitado } from "@/lib/promociones/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface PromAccionesMenuProps {
  empleado: EmpleadoPromocion
  onDetalle: () => void
  onPromover?: () => void
  onCapturarExamen?: () => void
  onDesempeño?: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PromAccionesMenu({
  empleado,
  onDetalle,
  onPromover,
  onCapturarExamen,
  onDesempeño,
}: PromAccionesMenuProps) {
  const habilitado = isHabilitado(empleado.puesto) || empleado.regla != null
  const aptitud = habilitado ? calcularAptitud(empleado) : null

  // La acción primaria cambia según si el empleado está listo para promoverse
  const esApto = aptitud === "apto"
  const onPrimaryAction = esApto ? onPromover : onCapturarExamen
  const primaryLabel = esApto ? "Promover empleado" : "Capturar examen"
  const PrimaryIcon = esApto ? ArrowUpRight : ClipboardPenLine

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Acciones para ${empleado.nombre}`}
        >
          <EllipsisVertical aria-hidden="true" className={PROMOTION_ICON.control} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDetalle} data-testid="prom-accion-detalle">
          <UserRoundSearch className={`${PROMOTION_ICON.control} text-muted-foreground`} aria-hidden="true" />
          Ver detalle
        </DropdownMenuItem>
        {habilitado && onPrimaryAction && (
          <DropdownMenuItem onClick={onPrimaryAction} data-testid="prom-accion-primaria">
            <PrimaryIcon
              className={`${PROMOTION_ICON.control} ${esApto ? "text-primary" : "text-muted-foreground"}`}
              aria-hidden="true"
            />
            {primaryLabel}
          </DropdownMenuItem>
        )}
        {onDesempeño && (
          <DropdownMenuItem onClick={onDesempeño} data-testid="prom-accion-desempeno">
            <ChartNoAxesColumnIncreasing className={`${PROMOTION_ICON.control} text-warning`} aria-hidden="true" />
            Evaluar desempeño
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
