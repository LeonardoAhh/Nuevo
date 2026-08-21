"use client"

import React, { useState } from "react"
import { Star } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveShell, ModalHeader, ModalFooter } from "@/components/ui/responsive-shell"
import type { EmpleadoPromocion } from "@/lib/promociones/types"
import { ultimaEvaluacion } from "@/lib/promociones/utils"
import { PERIODOS_DESEMPENO } from "@/lib/catalogo"

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
    if (!periodo.trim()) {
      setError("Debes seleccionar un periodo de evaluación")
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
      <ModalHeader
        title="Evaluación de Desempeño"
        subtitle={empleado.nombre}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          <span className="font-medium text-foreground">{empleado.puesto}</span>
          {empleado.numero && <span className="ml-2">#{empleado.numero}</span>}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cal-desempeno" className="text-xs text-muted-foreground">Calificación de desempeño (0–100)</Label>
            <Input
              id="cal-desempeno"
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="Ej. 85"
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              className="bg-muted"
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Periodo de evaluación</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Semestrales</SelectLabel>
                  {PERIODOS_DESEMPENO.semestrales.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Mensuales</SelectLabel>
                  {PERIODOS_DESEMPENO.mensuales.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleGuardar}
        saving={guardando}
        confirmIcon={<Star size={16} />}
        confirmDisabled={isReadOnly}
      />
    </ResponsiveShell>
  )
}
