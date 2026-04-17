"use client"

import React, { useState } from "react"
import { TrendingUp, AlertTriangle, ArrowRight, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ResponsiveShell, ModalToolbar } from "@/components/ui/responsive-shell"
import type { EmpleadoPromocion } from "@/lib/promociones/types"
import {
  calcularAptitud,
  mesesEnPuesto,
  porcentajeCursos,
  ultimaEvaluacion,
  formatMeses,
} from "@/lib/promociones/utils"
import { AptitudBadge, CriterioRow } from "./prom-shared"

export interface PromPromoverDialogProps {
  empleado: EmpleadoPromocion | null
  open: boolean
  isReadOnly: boolean
  onClose: () => void
  onConfirmarPromocion: (datos: {
    fechaInicio: string
    fechaExamen: string
    calExamen?: number
    intentosPrevios?: number
  }) => Promise<void>
  onSoloGuardarExamen: (datos: {
    fechaInicio: string
    fechaExamen: string
    calExamen: number
    intentosPrevios?: number
  }) => Promise<void>
}

export function PromPromoverDialog({
  empleado,
  open,
  isReadOnly,
  onClose,
  onConfirmarPromocion,
  onSoloGuardarExamen,
}: PromPromoverDialogProps) {
  if (!empleado) return null

  const aptitud = calcularAptitud(empleado)
  const meses = mesesEnPuesto(empleado.fechaIngresoPuesto)
  const pctCursos = porcentajeCursos(empleado.cursosRequeridos)
  const evalActual = ultimaEvaluacion(empleado.evaluaciones)
  const { regla } = empleado

  const hoy = new Date().toISOString().split("T")[0]
  const [fechaInicio, setFechaInicio] = useState(empleado.fechaIngresoPuesto || hoy)
  const [calExamen, setCalExamen] = useState(
    empleado.calificacionExamen != null ? String(empleado.calificacionExamen) : ""
  )
  const [fechaExamen, setFechaExamen] = useState(empleado.fechaExamenGuardada || "")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const puedePromover = aptitud === "apto" && !!regla?.promocionA

  async function handleConfirmar() {
    if (!regla?.promocionA) return
    setGuardando(true)
    setError(null)
    try {
      await onConfirmarPromocion({
        fechaInicio,
        fechaExamen,
        calExamen: calExamen !== "" ? parseFloat(calExamen) : undefined,
        intentosPrevios: empleado!.intentosExamen,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  async function handleSoloExamen() {
    setGuardando(true)
    setError(null)
    try {
      await onSoloGuardarExamen({
        fechaInicio,
        fechaExamen,
        calExamen: parseFloat(calExamen),
        intentosPrevios: empleado!.intentosExamen,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const cumpleTemp   = regla ? meses >= regla.minTemporalidadMeses : false
  const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : false
  const cumpleEval   = regla && evalActual ? evalActual.calificacion >= regla.minCalificacionEvaluacion : false

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-lg"
      title="Cambio de Puesto"
      description={empleado.nombre}
    >
      <ModalToolbar
        title="Cambio de Puesto"
        subtitle={empleado.nombre}
        saving={guardando}
        onClose={onClose}
        onConfirm={handleConfirmar}
        confirmIcon={<TrendingUp size={16} />}
        confirmDisabled={isReadOnly || !puedePromover}
        secondaryAction={
          !puedePromover && calExamen !== ""
            ? {
                icon: <Save size={14} />,
                label: "Guardar examen",
                onClick: handleSoloExamen,
                disabled: isReadOnly,
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Puesto actual → destino */}
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-3 text-sm">
          <div className="flex-1 text-center min-w-0">
            <div className="text-xs text-muted-foreground mb-0.5">Puesto actual</div>
            <div className="font-semibold text-foreground text-xs sm:text-sm leading-tight">{empleado.puesto}</div>
          </div>
          <ArrowRight size={16} className="text-primary shrink-0" />
          <div className="flex-1 text-center min-w-0">
            <div className="text-xs text-muted-foreground mb-0.5">Promover a</div>
            <div className={`font-semibold text-xs sm:text-sm leading-tight ${regla?.promocionA ? "text-primary" : "text-muted-foreground italic"}`}>
              {regla?.promocionA ?? "Sin definir"}
            </div>
          </div>
        </div>

        {/* Aptitud badge */}
        <div className="flex justify-end">
          <AptitudBadge status={aptitud} />
        </div>

        {/* Resumen de criterios */}
        {regla && (
          <div className="divide-y text-sm px-1">
            <CriterioRow
              label="Temporalidad"
              cumple={cumpleTemp}
              valor={formatMeses(meses)}
              minimo={formatMeses(regla.minTemporalidadMeses)}
            />
            <CriterioRow
              label="Cursos completados"
              cumple={cumpleCursos}
              valor={pctCursos}
              minimo={regla.minPorcentajeCursos}
              unidad="%"
            />
            <CriterioRow
              label="Evaluación de desempeño"
              cumple={cumpleEval}
              valor={evalActual ? evalActual.calificacion : "—"}
              minimo={regla.minCalificacionEvaluacion}
            />
          </div>
        )}

        {/* Formulario */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha inicio nuevo puesto</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha del examen</Label>
              <Input
                type="date"
                value={fechaExamen}
                onChange={(e) => setFechaExamen(e.target.value)}
                className="bg-muted"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Calificación del examen (0–100)
              {empleado.intentosExamen != null && empleado.intentosExamen > 0 && (
                <span className="ml-2 text-muted-foreground">
                  · {empleado.intentosExamen} intento{empleado.intentosExamen !== 1 ? "s" : ""} previo{empleado.intentosExamen !== 1 ? "s" : ""}
                </span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="Ej. 85"
              value={calExamen}
              onChange={(e) => setCalExamen(e.target.value)}
              className="bg-muted"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!puedePromover && (
          <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{!regla?.promocionA
              ? "Este puesto no tiene un puesto destino configurado."
              : "El empleado no cumple todos los criterios. Puedes guardar el examen sin promover."}
            </span>
          </div>
        )}
      </div>
    </ResponsiveShell>
  )
}
