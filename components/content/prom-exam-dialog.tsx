"use client"

import { useState } from "react"
import { ClipboardCheck, Trash2, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModalFooter, ModalHeader, ResponsiveShell } from "@/components/ui/responsive-shell"
import {
  EXAM_DIALOG_COPY,
  formatPromotionDate,
  PROMOTION_DIALOG_TYPE,
  todayAsLocalDate,
} from "@/lib/promociones/dialog-config"
import type { EmpleadoPromocion, ExamenPromocionInput } from "@/lib/promociones/types"
import { PROMOTION_ICON } from "@/lib/promociones/icon-styles"
import { calcularDesbloqueoExamen } from "@/lib/promociones/utils"
import { PromEmployeeSummary } from "./prom-employee-summary"

interface PromExamDialogProps {
  empleado: EmpleadoPromocion
  open: boolean
  isReadOnly: boolean
  onClose: () => void
  onGuardar: (datos: ExamenPromocionInput) => Promise<void>
}

export function PromExamDialog({
  empleado,
  open,
  isReadOnly,
  onClose,
  onGuardar,
}: PromExamDialogProps) {
  const fechaDesbloqueo = calcularDesbloqueoExamen(empleado)
  const [fechaExamen, setFechaExamen] = useState(empleado.fechaExamenGuardada || todayAsLocalDate())
  const [calExamen, setCalExamen] = useState(
    empleado.calificacionExamen != null ? String(empleado.calificacionExamen) : "",
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ejecutar(datos: ExamenPromocionInput, fallback: string) {
    setGuardando(true)
    setError(null)
    try {
      await onGuardar(datos)
      onClose()
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : fallback)
    } finally {
      setGuardando(false)
    }
  }

  function guardar() {
    const calificacion = Number(calExamen)
    if (!fechaExamen) {
      setError(EXAM_DIALOG_COPY.missingDate)
      return
    }
    if (fechaExamen <= empleado.fechaIngresoPuesto) {
      setError(EXAM_DIALOG_COPY.invalidDate)
      return
    }
    if (calExamen === "" || !Number.isFinite(calificacion) || calificacion < 0 || calificacion > 100) {
      setError(EXAM_DIALOG_COPY.invalidScore)
      return
    }

    void ejecutar({
      fechaExamen,
      calExamen: calificacion,
      intentosPrevios: empleado.intentosExamen,
      nuevoIntento: empleado.calificacionExamen == null || fechaExamen !== empleado.fechaExamenGuardada,
    }, EXAM_DIALOG_COPY.saveError)
  }

  function borrar() {
    void ejecutar({
      fechaExamen: "",
      calExamen: null,
      intentosPrevios: empleado.intentosExamen,
      nuevoIntento: false,
    }, EXAM_DIALOG_COPY.deleteError)
  }

  const disabled = guardando || isReadOnly || !!fechaDesbloqueo

  return (
    <ResponsiveShell open={open} onClose={onClose} maxWidth="sm:max-w-md" title={EXAM_DIALOG_COPY.title}>
      <ModalHeader title={EXAM_DIALOG_COPY.title} onClose={onClose} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <PromEmployeeSummary empleado={empleado} />

        <form id="prom-exam-form" className="space-y-4" onSubmit={event => { event.preventDefault(); guardar() }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prom-exam-date">{EXAM_DIALOG_COPY.dateLabel}</Label>
              <Input
                id="prom-exam-date"
                type="date"
                min={empleado.fechaIngresoPuesto}
                value={fechaExamen}
                onChange={event => setFechaExamen(event.target.value)}
                aria-describedby={error ? "prom-exam-error" : undefined}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prom-exam-score">{EXAM_DIALOG_COPY.scoreLabel}</Label>
              <Input
                id="prom-exam-score"
                type="number"
                min={0}
                max={100}
                step={0.01}
                inputMode="decimal"
                placeholder={EXAM_DIALOG_COPY.scoreHint}
                value={calExamen}
                onChange={event => setCalExamen(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "prom-exam-error" : undefined}
                disabled={disabled}
              />
            </div>
          </div>

          <dl className={`flex flex-wrap gap-x-6 gap-y-2 ${PROMOTION_DIALOG_TYPE.supporting}`}>
            <div className="flex gap-1.5">
              <dt>{EXAM_DIALOG_COPY.attemptsLabel}:</dt>
              <dd className="font-medium text-foreground">{empleado.intentosExamen ?? 0}</dd>
            </div>
            {empleado.regla?.minCalificacionExamen != null && (
              <div className="flex gap-1.5">
                <dt>{EXAM_DIALOG_COPY.minimumLabel}:</dt>
                <dd className="font-medium text-foreground">{empleado.regla.minCalificacionExamen}</dd>
              </div>
            )}
          </dl>
        </form>

        {fechaDesbloqueo && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" className={PROMOTION_ICON.control} />
            <AlertDescription>
              Límite de intentos agotado. Podrás registrar otro examen el {formatPromotionDate(fechaDesbloqueo)}.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" className={PROMOTION_ICON.control} />
            <AlertDescription id="prom-exam-error">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <ModalFooter
        onCancel={onClose}
        onConfirm={guardar}
        confirmLabel={EXAM_DIALOG_COPY.saveLabel}
        confirmIcon={<ClipboardCheck aria-hidden="true" />}
        confirmDisabled={disabled}
        saving={guardando}
        secondaryAction={empleado.calificacionExamen != null ? {
          icon: <Trash2 aria-hidden="true" />,
          label: EXAM_DIALOG_COPY.deleteLabel,
          onClick: borrar,
          disabled,
          variant: "ghost",
        } : undefined}
      />
    </ResponsiveShell>
  )
}
