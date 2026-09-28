"use client"

import { useState } from "react"
import { ArrowUpRight, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModalFooter, ModalHeader, ResponsiveShell } from "@/components/ui/responsive-shell"
import { PROMOTION_DIALOG_COPY, PROMOTION_DIALOG_TYPE, todayAsLocalDate } from "@/lib/promociones/dialog-config"
import type { ConfirmarPromocionInput, EmpleadoPromocion } from "@/lib/promociones/types"
import { PROMOTION_ICON } from "@/lib/promociones/icon-styles"
import { calcularAptitud } from "@/lib/promociones/utils"
import { PromPositionChange } from "./prom-position-change"
import { PromPromotionCriteria } from "./prom-promotion-criteria"

interface PromPromoverDialogProps {
  empleado: EmpleadoPromocion | null
  open: boolean
  isReadOnly: boolean
  onClose: () => void
  onConfirmarPromocion: (datos: ConfirmarPromocionInput) => Promise<void>
}

export function PromPromoverDialog({
  empleado,
  open,
  isReadOnly,
  onClose,
  onConfirmarPromocion,
}: PromPromoverDialogProps) {
  if (!empleado) return null

  return <PromPromoverDialogContent
    empleado={empleado}
    open={open}
    isReadOnly={isReadOnly}
    onClose={onClose}
    onConfirmarPromocion={onConfirmarPromocion}
  />
}

function PromPromoverDialogContent({
  empleado,
  open,
  isReadOnly,
  onClose,
  onConfirmarPromocion,
}: Omit<PromPromoverDialogProps, "empleado"> & { empleado: EmpleadoPromocion }) {
  const apto = calcularAptitud(empleado) === "apto" && !!empleado.regla?.promocionA
  const [fechaInicio, setFechaInicio] = useState(todayAsLocalDate)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmarPromocion() {
    if (!fechaInicio) {
      setError(PROMOTION_DIALOG_COPY.invalidDate)
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await onConfirmarPromocion({ fechaInicio })
      onClose()
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : PROMOTION_DIALOG_COPY.saveError)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-xl" title={PROMOTION_DIALOG_COPY.title}>
      <ModalHeader title={PROMOTION_DIALOG_COPY.title} onClose={onClose} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <PromPositionChange empleado={empleado} />
        <PromPromotionCriteria empleado={empleado} />

        <div className="grid gap-2 rounded-lg border p-3 xs:grid-cols-2 xs:items-center sm:p-4">
          <Label htmlFor="fecha-inicio" className={PROMOTION_DIALOG_TYPE.sectionTitle}>
            {PROMOTION_DIALOG_COPY.dateLabel}
          </Label>
          <Input
            id="fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={event => setFechaInicio(event.target.value)}
            disabled={guardando || isReadOnly}
          />
        </div>
        {!apto && <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" className={PROMOTION_ICON.control} />
          <AlertDescription>{PROMOTION_DIALOG_COPY.notEligible}</AlertDescription>
        </Alert>}
        {error && <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" className={PROMOTION_ICON.control} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>}
      </div>

      <ModalFooter
        onCancel={onClose}
        onConfirm={() => void confirmarPromocion()}
        confirmLabel={PROMOTION_DIALOG_COPY.confirmLabel}
        confirmIcon={<ArrowUpRight aria-hidden="true" />}
        confirmDisabled={isReadOnly || !apto}
        saving={guardando}
      />
    </ResponsiveShell>
  )
}
