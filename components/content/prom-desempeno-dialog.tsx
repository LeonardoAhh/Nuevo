"use client"

import React, { useState } from "react"
import { Star } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { EmpleadoPromocion } from "@/lib/promociones/types"
import { ultimaEvaluacion } from "@/lib/promociones/utils"

export interface PromDesempenoDialogProps {
  empleado: EmpleadoPromocion
  open: boolean
  isReadOnly: boolean
  onClose: () => void
  onGuardar: (calificacion: number, periodo: string) => Promise<void>
}

export function PromDesempenoDialog({
  empleado,
  open,
  isReadOnly,
  onClose,
  onGuardar,
}: PromDesempenoDialogProps) {
  const evalActual = ultimaEvaluacion(empleado.evaluaciones)
  const [calificacion, setCalificacion] = useState(
    evalActual ? String(evalActual.calificacion) : ""
  )
  const [periodo, setPeriodo] = useState(evalActual?.periodo ?? "")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGuardar() {
    const cal = parseFloat(calificacion)
    if (isNaN(cal) || cal < 0 || cal > 100) {
      setError("Ingresa una calificación válida entre 0 y 100")
      return
    }
    if (!empleado.numero) {
      setError("El empleado no tiene N.N asignado")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await onGuardar(cal, periodo.trim())
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-sm"
      title="Evaluación de Desempeño"
      description={empleado.nombre}
    >
      <ModalToolbar
        title="Evaluación de Desempeño"
        subtitle={empleado.nombre}
        saving={guardando}
        onClose={onClose}
        onConfirm={handleGuardar}
        confirmIcon={<Star size={16} />}
        confirmDisabled={isReadOnly}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          <span className="font-medium text-foreground">{empleado.puesto}</span>
          {empleado.numero && <span className="ml-2">#{empleado.numero}</span>}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Calificación de desempeño (0–100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="Ej. 85"
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              className="bg-muted"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Periodo de evaluación (opcional)</Label>
            <Input
              type="text"
              placeholder="Ej. 2026-Q1"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-muted"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </ResponsiveShell>
  )
}
