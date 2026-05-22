"use client"

import React from "react"
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

export interface PromDetalleDialogProps {
  empleado: EmpleadoPromocion | null
  open: boolean
  onClose: () => void
}

export function PromDetalleDialog({ empleado, open, onClose }: PromDetalleDialogProps) {
  if (!empleado) return null

  const aptitud = calcularAptitud(empleado)
  const meses = mesesEnPuesto(empleado.fechaIngresoPuesto)
  const pctCursos = porcentajeCursos(empleado.cursosRequeridos)
  const evalActual = ultimaEvaluacion(empleado.evaluaciones)
  const { regla } = empleado

  const cumpleTemp = regla ? meses >= regla.minTemporalidadMeses : false
  const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : false
  const cumpleEval = regla && evalActual ? evalActual.calificacion >= regla.minCalificacionEvaluacion : false

  return (
    <ResponsiveShell
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-2xl"
      title="Detalle del empleado"
      description={`${empleado.nombre} · ${empleado.puesto}`}
    >
      <ModalToolbar
        title={empleado.nombre}
        subtitle={`${empleado.puesto} · ${empleado.departamento}`}
        saving={false}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Header badge */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Award size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{empleado.nombre}</p>
            <p className="text-xs text-muted-foreground">{empleado.puesto} · {empleado.departamento}</p>
          </div>
          <div className="ml-auto shrink-0">
            <AptitudBadge status={aptitud} />
          </div>
        </div>
          {regla ? (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Criterios de Promoción
              </div>
              <div className="px-4 divide-y">
                <CriterioRow
                  label="Temporalidad en el puesto"
                  cumple={cumpleTemp}
                  valor={formatMeses(meses)}
                  minimo={formatMeses(regla.minTemporalidadMeses)}
                />
                <CriterioRow
                  label="Porcentaje de cursos completados"
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
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <AlertTriangle size={16} />
              Sin reglas configuradas para este puesto
            </div>
          )}

          {/* Cursos requeridos */}
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-muted px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Cursos Requeridos
              </span>
              <span className="text-xs font-semibold text-primary">
                {empleado.cursosRequeridos.filter((c) => c.completado).length} / {empleado.cursosRequeridos.length} completados
              </span>
            </div>
            <div className="px-4 py-2">
              <Progress value={pctCursos} className="h-1.5 mb-3" />
              {empleado.cursosRequeridos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Sin cursos asignados para este puesto</p>
              ) : (
                <ul className="space-y-1.5">
                  {empleado.cursosRequeridos.map((curso) => (
                    <li key={curso.nombre} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {curso.completado ? (
                          <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={curso.completado ? "text-foreground" : "text-muted-foreground"}>
                          {curso.nombre}
                        </span>
                      </div>
                      {curso.completado && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {curso.calificacion !== undefined && (
                            <span className="font-medium text-muted-foreground">{curso.calificacion}</span>
                          )}
                          {curso.fechaAplicacion && <span>{curso.fechaAplicacion}</span>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Historial de evaluaciones */}
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Evaluaciones de Desempeño
            </div>
            <div className="px-4 py-2">
              {empleado.evaluaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Sin evaluaciones registradas</p>
              ) : (
                <ul className="space-y-1.5">
                  {[...empleado.evaluaciones]
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((ev, i) => (
                      <li key={`${ev.fecha}-${i}`} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={13} />
                          <span>{ev.fecha}</span>
                          {ev.periodo && <Badge variant="secondary" className="text-xs py-0">{ev.periodo}</Badge>}
                        </div>
                        <div className="flex items-center gap-3">
                          {ev.evaluador && (
                            <span className="text-xs text-muted-foreground">{ev.evaluador}</span>
                          )}
                          <span className={`font-bold text-base ${
                            ev.calificacion >= 80 ? "text-emerald-600 dark:text-emerald-400"
                            : ev.calificacion >= 60 ? "text-amber-600 dark:text-amber-400"
                            : "text-destructive"
                          }`}>
                            {ev.calificacion}
                          </span>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
      </div>
    </ResponsiveShell>
  )
}
