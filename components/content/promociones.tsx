"use client"

import React, { useState, useMemo, useRef } from "react"
import {
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  BookOpen,
  Star,
  Calendar,
  Users,
  Search,
  Upload,
  Award,
  BarChart3,
  Info,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AptitudStatus = "apto" | "no_apto" | "pendiente" | "en_revision"

export interface CursoRequerido {
  nombre: string
  completado: boolean
  fechaAplicacion?: string
  calificacion?: number
}

export interface ReglaPromocion {
  puesto: string
  promocionA?: string
  minTemporalidadMeses: number
  minCalificacionExamen?: number
  minCalificacionEvaluacion: number
  minPorcentajeCursos: number
  descripcion?: string
}

// Estructura del JSON de reglas
interface ReglaPromocionJSON {
  "Puesto Actual": string
  "Promoción a": string
  "Temporalidad (meses)": string
  "Calificación Examen Teorico": string
  "Cumplimiento Cursos Asigandos": string
  "Calificación Evaluación Desempeño": string
}

// Estructura del JSON de datos de empleado
interface DatosPromocionJSON {
  "N.N": string
  "Fecha Inicio Puesto": string
  "Desempeño Actual (%)": string
  "Periodo de Evaluación": string
  "Última Calificación Examen (%)": string
  "Intentos de Examen": string
}

export interface EvaluacionDesempeño {
  fecha: string
  calificacion: number
  periodo?: string
  evaluador?: string
}

export interface EmpleadoPromocion {
  id: string
  numero?: string
  nombre: string
  puesto: string
  departamento: string
  area?: string
  turno?: string
  fechaIngresoPuesto: string
  fechaExamenGuardada?: string    // Última fecha de examen guardada
  calificacionExamen?: number     // Última calificación de examen teórico
  intentosExamen?: number
  cursosRequeridos: CursoRequerido[]
  evaluaciones: EvaluacionDesempeño[]
  regla?: ReglaPromocion
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Un puesto está habilitado si su nombre termina en espacio + letra B-E (categorías superiores a A) */
function isHabilitado(puesto: string): boolean {
  return /\s[B-E]$/i.test(puesto.trim())
}

function mesesEnPuesto(fechaIngreso: string): number {
  const inicio = new Date(fechaIngreso)
  const hoy = new Date()
  return (
    (hoy.getFullYear() - inicio.getFullYear()) * 12 +
    (hoy.getMonth() - inicio.getMonth())
  )
}

function formatMeses(meses: number): string {
  if (meses < 12) return `${meses} mes${meses !== 1 ? "es" : ""}`
  const años = Math.floor(meses / 12)
  const resto = meses % 12
  return resto === 0
    ? `${años} año${años !== 1 ? "s" : ""}`
    : `${años} a${años !== 1 ? "ños" : "ño"} ${resto} mes${resto !== 1 ? "es" : ""}`
}

function porcentajeCursos(cursos: CursoRequerido[]): number {
  if (cursos.length === 0) return 0
  return Math.round((cursos.filter((c) => c.completado).length / cursos.length) * 100)
}

function ultimaEvaluacion(evaluaciones: EvaluacionDesempeño[]): EvaluacionDesempeño | undefined {
  if (evaluaciones.length === 0) return undefined
  return [...evaluaciones].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
}

function calcularAptitud(empleado: EmpleadoPromocion): AptitudStatus {
  const { regla, cursosRequeridos, evaluaciones, fechaIngresoPuesto, calificacionExamen } = empleado
  if (!regla) return "en_revision"

  const meses = mesesEnPuesto(fechaIngresoPuesto)
  const pctCursos = porcentajeCursos(cursosRequeridos)
  const evalActual = ultimaEvaluacion(evaluaciones)

  if (!evalActual) return "pendiente"

  const cumpleTemporalidad = meses >= regla.minTemporalidadMeses
  const cumpleCursos = pctCursos >= regla.minPorcentajeCursos
  const cumpleEvaluacion = evalActual.calificacion >= regla.minCalificacionEvaluacion
  // Examen: solo se evalúa si la regla lo requiere y hay calificación registrada
  const cumpleExamen = regla.minCalificacionExamen != null
    ? (calificacionExamen != null && calificacionExamen >= regla.minCalificacionExamen)
    : true

  if (cumpleTemporalidad && cumpleCursos && cumpleEvaluacion && cumpleExamen) return "apto"
  return "no_apto"
}

// ─── Insignias de estado ───────────────────────────────────────────────────────

function AptitudBadge({ status }: { status: AptitudStatus }) {
  const cfg = {
    apto: {
      label: "Apto",
      icon: CheckCircle2,
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
    },
    no_apto: {
      label: "No Apto",
      icon: XCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700",
    },
    pendiente: {
      label: "Pendiente",
      icon: Clock,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600",
    },
    en_revision: {
      label: "En Revisión",
      icon: AlertTriangle,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700",
    },
  }[status]

  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={`gap-1 font-semibold px-2 py-0.5 ${cfg.className}`}>
      <Icon size={12} />
      {cfg.label}
    </Badge>
  )
}

// ─── Indicador de criterio individual ────────────────────────────────────────

function CriterioRow({
  label,
  cumple,
  valor,
  minimo,
  unidad = "",
}: {
  label: string
  cumple: boolean
  valor: string | number
  minimo: string | number
  unidad?: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        {cumple ? (
          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle size={13} className="text-red-400 flex-shrink-0" />
        )}
        <span>{label}</span>
      </div>
      <div className="text-sm text-right">
        <span className={`font-semibold ${cumple ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
          {valor}{unidad}
        </span>
        <span className="text-gray-400 dark:text-gray-500 ml-1 text-xs">/ mín {minimo}{unidad}</span>
      </div>
    </div>
  )
}

// ─── Panel de detalle de empleado ─────────────────────────────────────────────

function DetalleEmpleado({ empleado, onClose }: { empleado: EmpleadoPromocion; onClose: () => void }) {
  const aptitud = calcularAptitud(empleado)
  const meses = mesesEnPuesto(empleado.fechaIngresoPuesto)
  const pctCursos = porcentajeCursos(empleado.cursosRequeridos)
  const evalActual = ultimaEvaluacion(empleado.evaluaciones)
  const { regla } = empleado

  const cumpleTemp = regla ? meses >= regla.minTemporalidadMeses : false
  const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : false
  const cumpleEval = regla && evalActual ? evalActual.calificacion >= regla.minCalificacionEvaluacion : false

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Award size={20} className="text-primary" />
            </div>
            <div>
              <div className="font-bold">{empleado.nombre}</div>
              <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {empleado.puesto} · {empleado.departamento}
              </div>
            </div>
            <div className="ml-auto">
              <AptitudBadge status={aptitud} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Resumen de criterios */}
          {regla ? (
            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Criterios de Promoción
              </div>
              <div className="px-4 divide-y dark:divide-gray-700">
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
          <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Cursos Requeridos
              </span>
              <span className="text-xs font-semibold text-primary">
                {empleado.cursosRequeridos.filter((c) => c.completado).length} / {empleado.cursosRequeridos.length} completados
              </span>
            </div>
            <div className="px-4 py-2">
              <Progress value={pctCursos} className="h-1.5 mb-3" />
              {empleado.cursosRequeridos.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Sin cursos asignados para este puesto</p>
              ) : (
                <ul className="space-y-1.5">
                  {empleado.cursosRequeridos.map((curso, i) => (
                    <li key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        {curso.completado ? (
                          <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span className={curso.completado ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>
                          {curso.nombre}
                        </span>
                      </div>
                      {curso.completado && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                          {curso.calificacion !== undefined && (
                            <span className="font-medium text-gray-600 dark:text-gray-300">{curso.calificacion}</span>
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
          <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Evaluaciones de Desempeño
            </div>
            <div className="px-4 py-2">
              {empleado.evaluaciones.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Sin evaluaciones registradas</p>
              ) : (
                <ul className="space-y-1.5">
                  {[...empleado.evaluaciones]
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((ev, i) => (
                      <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar size={13} />
                          <span>{ev.fecha}</span>
                          {ev.periodo && <Badge variant="secondary" className="text-xs py-0">{ev.periodo}</Badge>}
                        </div>
                        <div className="flex items-center gap-3">
                          {ev.evaluador && (
                            <span className="text-xs text-gray-400">{ev.evaluador}</span>
                          )}
                          <span className={`font-bold text-base ${
                            ev.calificacion >= 80 ? "text-emerald-600 dark:text-emerald-400"
                            : ev.calificacion >= 60 ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
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
      </DialogContent>
    </Dialog>
  )
}

// ─── Tarjetas de resumen ───────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  subtitle?: string
}) {
  return (
    <Card className="border dark:border-gray-700">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold dark:text-white">{value}</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</div>
          {subtitle && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Dialog captura evaluación de desempeño (empleados inhabilitados) ─────────

function CapturarDesempeñoDialog({
  empleado,
  onClose,
  onGuardado,
}: {
  empleado: EmpleadoPromocion
  onClose: () => void
  onGuardado: () => void
}) {
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
      const { error: dbErr } = await supabase
        .from("datos_promocion")
        .upsert(
          {
            numero:            empleado.numero,
            desempeño_actual:  cal,
            periodo_evaluacion: periodo.trim() || null,
            updated_at:        new Date().toISOString(),
          },
          { onConflict: "numero" }
        )
      if (dbErr) throw new Error(dbErr.message)
      onGuardado()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg shrink-0">
              <Star size={16} className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="font-bold">Evaluación de Desempeño</div>
              <div className="text-sm font-normal text-gray-500 dark:text-gray-400 truncate">{empleado.nombre}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">{empleado.puesto}</span>
          {empleado.numero && <span className="ml-2">#{empleado.numero}</span>}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600 dark:text-gray-400">Calificación de desempeño (0–100)</Label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="Ej. 85"
              value={calificacion}
              onChange={(e) => setCalificacion(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600 dark:text-gray-400">Periodo de evaluación (opcional)</Label>
            <input
              type="text"
              placeholder="Ej. 2026-Q1"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando} className="gap-2">
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
            Guardar evaluación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dialog de promoción ──────────────────────────────────────────────────────

function PromoverDialog({
  empleado,
  onClose,
  onPromovido,
}: {
  empleado: EmpleadoPromocion
  onClose: () => void
  onPromovido: () => void
}) {
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
      // 1. Cambiar puesto en employees
      const { error: empErr } = await supabase
        .from("employees")
        .update({ puesto: regla.promocionA })
        .eq("id", empleado.id)
      if (empErr) throw new Error(empErr.message)

      // 2. Actualizar datos_promocion
      if (empleado.numero) {
        const { error: dpErr } = await supabase
          .from("datos_promocion")
          .upsert(
            {
              numero:                     empleado.numero,
              fecha_inicio_puesto:        fechaInicio || null,
              fecha_examen:               fechaExamen || null,
              ultima_calificacion_examen: calExamen !== "" ? parseFloat(calExamen) : null,
              intentos_examen:            (empleado.intentosExamen ?? 0) + (calExamen !== "" ? 1 : 0),
              updated_at:                 new Date().toISOString(),
            },
            { onConflict: "numero" }
          )
        if (dpErr) throw new Error(dpErr.message)
      }

      onPromovido()
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-bold">Cambio de Puesto</div>
              <div className="text-sm font-normal text-gray-500 dark:text-gray-400 truncate">{empleado.nombre}</div>
            </div>
            <div className="ml-auto shrink-0">
              <AptitudBadge status={aptitud} />
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Puesto actual → destino */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-3 text-sm mt-1">
          <div className="flex-1 text-center min-w-0">
            <div className="text-xs text-gray-400 mb-0.5">Puesto actual</div>
            <div className="font-semibold text-gray-800 dark:text-white text-xs sm:text-sm leading-tight">{empleado.puesto}</div>
          </div>
          <ArrowRight size={16} className="text-primary shrink-0" />
          <div className="flex-1 text-center min-w-0">
            <div className="text-xs text-gray-400 mb-0.5">Promover a</div>
            <div className={`font-semibold text-xs sm:text-sm leading-tight ${regla?.promocionA ? "text-primary" : "text-gray-400 italic"}`}>
              {regla?.promocionA ?? "Sin definir"}
            </div>
          </div>
        </div>

        {/* Resumen de criterios */}
        {regla && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-sm px-1">
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
              <Label className="text-xs text-gray-600 dark:text-gray-400">Fecha inicio nuevo puesto</Label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600 dark:text-gray-400">Fecha del examen</Label>
              <input
                type="date"
                value={fechaExamen}
                onChange={(e) => setFechaExamen(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Calificación del examen (0–100)
              {empleado.intentosExamen != null && empleado.intentosExamen > 0 && (
                <span className="ml-2 text-gray-400">
                  · {empleado.intentosExamen} intento{empleado.intentosExamen !== 1 ? "s" : ""} previo{empleado.intentosExamen !== 1 ? "s" : ""}
                </span>
              )}
            </Label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="Ej. 85"
              value={calExamen}
              onChange={(e) => setCalExamen(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
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

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={guardando} className="w-full sm:w-auto">
            Cancelar
          </Button>
          {!puedePromover && calExamen !== "" && (
            <Button
              variant="secondary"
              onClick={async () => {
                setGuardando(true)
                setError(null)
                try {
                  if (empleado.numero) {
                    const { error: dpErr } = await supabase
                      .from("datos_promocion")
                      .upsert(
                        {
                          numero:                     empleado.numero,
                          fecha_inicio_puesto:        fechaInicio || null,
                          fecha_examen:               fechaExamen || null,
                          ultima_calificacion_examen: parseFloat(calExamen),
                          intentos_examen:            (empleado.intentosExamen ?? 0) + 1,
                          updated_at:                 new Date().toISOString(),
                        },
                        { onConflict: "numero" }
                      )
                    if (dpErr) throw new Error(dpErr.message)
                  }
                  onPromovido()
                  onClose()
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : "Error al guardar")
                } finally {
                  setGuardando(false)
                }
              }}
              disabled={guardando}
              className="w-full sm:w-auto gap-2"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : null}
              Solo guardar examen
            </Button>
          )}
          <Button
            onClick={handleConfirmar}
            disabled={guardando || !puedePromover}
            className="w-full sm:w-auto gap-2"
          >
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            Confirmar promoción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PromocionesContent({
  empleados,
  onDatosActualizados,
}: {
  empleados: EmpleadoPromocion[]
  onDatosActualizados?: () => void
}) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroDept, setFiltroDept] = useState("todos")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroPuesto, setFiltroPuesto] = useState("todos")
  const [pagina, setPagina] = useState(1)
  const PAGE_SIZE = 30
  const [empleadoDetalle, setEmpleadoDetalle] = useState<EmpleadoPromocion | null>(null)
  const [empleadoPromover, setEmpleadoPromover] = useState<EmpleadoPromocion | null>(null)
  const [empleadoDesempeño, setEmpleadoDesempeño] = useState<EmpleadoPromocion | null>(null)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  // ── Carga de reglas JSON ─────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reglasPreview, setReglasPreview] = useState<ReglaPromocionJSON[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [cargaResult, setCargaResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // ── Carga de datos de empleados JSON ─────────────────────────────────────────
  const datosFileInputRef = useRef<HTMLInputElement>(null)
  const [datosPreview, setDatosPreview] = useState<DatosPromocionJSON[] | null>(null)
  const [datosCargando, setDatosCargando] = useState(false)
  const [datosResult, setDatosResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(parsed)) throw new Error("El archivo debe ser un array JSON")
        setReglasPreview(parsed as ReglaPromocionJSON[])
        setCargaResult(null)
      } catch (err: unknown) {
        setCargaResult({ ok: false, msg: err instanceof Error ? err.message : "Error al leer el archivo" })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function handleDatosFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(parsed)) throw new Error("El archivo debe ser un array JSON")
        setDatosPreview(parsed as DatosPromocionJSON[])
        setDatosResult(null)
      } catch (err: unknown) {
        setDatosResult({ ok: false, msg: err instanceof Error ? err.message : "Error al leer el archivo" })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  async function handleCargarDatos() {
    if (!datosPreview) return
    setDatosCargando(true)
    setDatosResult(null)
    try {
      // Deduplicar por N.N
      const rowsMap = new Map<string, object>()
      for (const r of datosPreview) {
        const numero = r["N.N"].trim()
        if (!numero) continue
        rowsMap.set(numero, {
          numero,
          fecha_inicio_puesto:        r["Fecha Inicio Puesto"] || null,
          desempeño_actual:           r["Desempeño Actual (%)"] !== "" ? parseFloat(r["Desempeño Actual (%)"]) : null,
          periodo_evaluacion:         r["Periodo de Evaluación"] || null,
          ultima_calificacion_examen: r["Última Calificación Examen (%)"] !== "" ? parseFloat(r["Última Calificación Examen (%)"]) : null,
          intentos_examen:            parseInt(r["Intentos de Examen"] || "0", 10),
          updated_at:                 new Date().toISOString(),
        })
      }
      const rows = Array.from(rowsMap.values())

      const { error } = await supabase
        .from("datos_promocion")
        .upsert(rows, { onConflict: "numero" })

      if (error) throw new Error(error.message)
      setDatosResult({ ok: true, msg: `${rows.length} empleado${rows.length !== 1 ? "s" : ""} cargado${rows.length !== 1 ? "s" : ""} correctamente` })
      setDatosPreview(null)
      onDatosActualizados?.()
    } catch (err: unknown) {
      setDatosResult({ ok: false, msg: err instanceof Error ? err.message : "Error al guardar en Supabase" })
    } finally {
      setDatosCargando(false)
    }
  }

  async function handleCargarReglas() {
    if (!reglasPreview) return
    setCargando(true)
    setCargaResult(null)
    try {
      // Mapear y deduplicar por puesto (quedarse con la última ocurrencia)
      const rowsMap = new Map<string, object>()
      for (const r of reglasPreview) {
        const puesto = r["Puesto Actual"].trim()
        rowsMap.set(puesto, {
          puesto,
          promocion_a:                 r["Promoción a"]?.trim() ?? null,
          min_temporalidad_meses:      parseInt(r["Temporalidad (meses)"], 10),
          min_calificacion_examen:     parseFloat(r["Calificación Examen Teorico"]),
          min_porcentaje_cursos:       parseFloat(r["Cumplimiento Cursos Asigandos"]),
          min_calificacion_evaluacion: parseFloat(r["Calificación Evaluación Desempeño"]),
        })
      }
      const rows = Array.from(rowsMap.values())

      const { error } = await supabase
        .from("reglas_promocion")
        .upsert(rows, { onConflict: "puesto" })

      if (error) throw new Error(error.message)
      setCargaResult({ ok: true, msg: `${rows.length} regla${rows.length !== 1 ? "s" : ""} cargada${rows.length !== 1 ? "s" : ""} correctamente` })
      setReglasPreview(null)
      onDatosActualizados?.()
    } catch (err: unknown) {
      setCargaResult({ ok: false, msg: err instanceof Error ? err.message : "Error al guardar en Supabase" })
    } finally {
      setCargando(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Departamentos y puestos únicos
  const departamentos = useMemo(
    () => [...new Set(empleados.map((e) => e.departamento))].sort(),
    [empleados]
  )
  const puestos = useMemo(
    () => [...new Set(empleados.map((e) => e.puesto))].sort(),
    [empleados]
  )

  // Filtrar y separar: con categoría (activos) vs sin categoría (inhabilitados al final)
  const empleadosFiltrados = useMemo(() => {
    const base = empleados
      .filter((emp) => {
        const aptitud = calcularAptitud(emp)
        const matchBusqueda =
          busqueda === "" ||
          emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          emp.puesto.toLowerCase().includes(busqueda.toLowerCase()) ||
          (emp.numero ?? "").includes(busqueda)
        const matchDept = filtroDept === "todos" || emp.departamento === filtroDept
        const matchStatus = filtroStatus === "todos" || aptitud === filtroStatus
        const matchPuesto = filtroPuesto === "todos" || emp.puesto === filtroPuesto
        return matchBusqueda && matchDept && matchStatus && matchPuesto
      })
      .sort((a, b) => parseInt(a.numero ?? "0", 10) - parseInt(b.numero ?? "0", 10))

    const habilitados   = base.filter((e) => isHabilitado(e.puesto))
    const inhabilitados = base.filter((e) => !isHabilitado(e.puesto))
    return { conCategoria: habilitados, sinCategoria: inhabilitados }
  }, [empleados, busqueda, filtroDept, filtroStatus, filtroPuesto])

  // Reset página al cambiar filtros
  React.useEffect(() => { setPagina(1) }, [busqueda, filtroDept, filtroStatus, filtroPuesto])

  const todosOrdenados = [...empleadosFiltrados.conCategoria, ...empleadosFiltrados.sinCategoria]
  const totalPaginas = Math.ceil(todosOrdenados.length / PAGE_SIZE)
  const paginados = todosOrdenados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const paginadosConCategoria = paginados.filter((e) => isHabilitado(e.puesto))
  const paginadosSinCategoria = paginados.filter((e) => !isHabilitado(e.puesto))

  // Contadores de resumen
  const contadores = useMemo(() => {
    const totales = { apto: 0, no_apto: 0, pendiente: 0, en_revision: 0 }
    empleados.forEach((e) => {
      totales[calcularAptitud(e)]++
    })
    return totales
  }, [empleados])

  return (
    <div className="space-y-6">
      {/* Inputs ocultos para JSON */}
      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
      <input ref={datosFileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleDatosFileChange} />


      {/* Modal de preview antes de cargar */}
      {reglasPreview && (
        <Dialog open onOpenChange={() => setReglasPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload size={18} className="text-primary" />
                Vista previa — Reglas de Promoción
              </DialogTitle>
              <DialogDescription>
                Se cargarán <strong>{reglasPreview.length}</strong> regla{reglasPreview.length !== 1 ? "s" : ""} a Supabase.
                Si ya existe una regla para el mismo puesto, será reemplazada.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800 text-xs">
                    <TableHead>Puesto Actual</TableHead>
                    <TableHead>Promoción a</TableHead>
                    <TableHead className="text-center">Temporalidad</TableHead>
                    <TableHead className="text-center">Examen</TableHead>
                    <TableHead className="text-center">Cursos %</TableHead>
                    <TableHead className="text-center">Evaluación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reglasPreview.map((r, i) => (
                    <TableRow key={i} className="text-sm">
                      <TableCell className="font-medium">{r["Puesto Actual"]}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">{r["Promoción a"]}</TableCell>
                      <TableCell className="text-center">{r["Temporalidad (meses)"]} meses</TableCell>
                      <TableCell className="text-center">{r["Calificación Examen Teorico"]}</TableCell>
                      <TableCell className="text-center">{r["Cumplimiento Cursos Asigandos"]}%</TableCell>
                      <TableCell className="text-center">{r["Calificación Evaluación Desempeño"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setReglasPreview(null)} disabled={cargando}>
                Cancelar
              </Button>
              <Button onClick={handleCargarReglas} disabled={cargando} className="gap-2">
                {cargando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {cargando ? "Cargando..." : "Confirmar y cargar a Supabase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de preview — datos de empleados */}
      {datosPreview && (
        <Dialog open onOpenChange={() => setDatosPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload size={18} className="text-primary" />
                Vista previa — Datos de Empleados
              </DialogTitle>
              <DialogDescription>
                Se cargarán <strong>{datosPreview.length}</strong> registro{datosPreview.length !== 1 ? "s" : ""}.
                El enlace es por <strong>N.N</strong> (número de empleado). Si ya existe un registro se actualizará.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800 text-xs">
                    <TableHead>N.N</TableHead>
                    <TableHead>Fecha Inicio Puesto</TableHead>
                    <TableHead className="text-center">Desempeño %</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-center">Examen %</TableHead>
                    <TableHead className="text-center">Intentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosPreview.map((r, i) => (
                    <TableRow key={i} className="text-sm">
                      <TableCell className="font-mono font-medium">{r["N.N"]}</TableCell>
                      <TableCell>{r["Fecha Inicio Puesto"] || <span className="text-gray-400 italic">—</span>}</TableCell>
                      <TableCell className="text-center">
                        <span className={r["Desempeño Actual (%)"] && parseFloat(r["Desempeño Actual (%)"]) > 0
                          ? "font-semibold text-emerald-600 dark:text-emerald-400"
                          : "text-gray-400"}>
                          {r["Desempeño Actual (%)"] || "—"}
                        </span>
                      </TableCell>
                      <TableCell>{r["Periodo de Evaluación"] || <span className="text-gray-400 italic">—</span>}</TableCell>
                      <TableCell className="text-center">
                        {r["Última Calificación Examen (%)"]
                          ? <span className="font-semibold">{r["Última Calificación Examen (%)"]}</span>
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="text-center">{r["Intentos de Examen"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setDatosPreview(null)} disabled={datosCargando}>
                Cancelar
              </Button>
              <Button onClick={handleCargarDatos} disabled={datosCargando} className="gap-2">
                {datosCargando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {datosCargando ? "Cargando..." : "Confirmar y cargar a Supabase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar empleado, puesto, número..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 h-9 w-full"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2">
        <Select value={filtroDept} onValueChange={setFiltroDept}>
          <SelectTrigger className="h-9 w-full sm:w-[170px] text-xs sm:text-sm">
            <SelectValue placeholder="Depto." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los deptos.</SelectItem>
            {departamentos.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroPuesto} onValueChange={setFiltroPuesto}>
          <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs sm:text-sm">
            <SelectValue placeholder="Puesto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los puestos</SelectItem>
            {puestos.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="h-9 w-full sm:w-[150px] text-xs sm:text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="apto">Apto</SelectItem>
            <SelectItem value="no_apto">No Apto</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
          </SelectContent>
        </Select>
        {(busqueda || filtroDept !== "todos" || filtroStatus !== "todos" || filtroPuesto !== "todos") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusqueda("")
              setFiltroDept("todos")
              setFiltroStatus("todos")
              setFiltroPuesto("todos")
            }}
            className="col-span-3 sm:col-span-1 h-9 text-xs sm:text-sm"
          >
            Limpiar filtros
          </Button>
        )}
        </div>
      </div>

      {/* Lista / Tabla principal */}
      {empleados.length === 0 ? (
        <EmptyState />
      ) : todosOrdenados.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">Sin resultados para los filtros aplicados</div>
      ) : (
        <>
          {/* ── Vista móvil: tarjetas ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {paginadosConCategoria.map((emp) => {
              const aptitud = calcularAptitud(emp)
              const meses = mesesEnPuesto(emp.fechaIngresoPuesto)
              const pctCursos = porcentajeCursos(emp.cursosRequeridos)
              const evalActual = ultimaEvaluacion(emp.evaluaciones)
              const { regla } = emp
              const cumpleTemp   = regla ? meses >= regla.minTemporalidadMeses : null
              const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : null
              const cumpleEval   = regla && evalActual ? evalActual.calificacion >= regla.minCalificacionEvaluacion : null

              return (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                  onClick={() => setEmpleadoPromover(emp)}
                >
                  {/* Fila superior: nombre + badge */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{emp.nombre}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{emp.puesto}</div>
                    </div>
                    <AptitudBadge status={aptitud} />
                  </div>

                  {/* Depto + número */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-2.5">
                    <span>{emp.departamento}</span>
                    {emp.numero && <><span>·</span><span>#{emp.numero}</span></>}
                  </div>

                  {/* Métricas en fila */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* Temporalidad */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400 uppercase tracking-wide" style={{fontSize:"10px"}}>Temporalidad</span>
                      <div className="flex items-center gap-1">
                        {cumpleTemp !== null && (
                          cumpleTemp
                            ? <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                            : <XCircle size={11} className="text-red-400 shrink-0" />
                        )}
                        <span className="font-medium text-gray-700 dark:text-gray-300">{formatMeses(meses)}</span>
                      </div>
                      {regla && <span className="text-gray-400" style={{fontSize:"10px"}}>mín {formatMeses(regla.minTemporalidadMeses)}</span>}
                    </div>

                    {/* Cursos */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400 uppercase tracking-wide" style={{fontSize:"10px"}}>Cursos</span>
                      <div className="flex items-center gap-1">
                        {cumpleCursos !== null && (
                          cumpleCursos
                            ? <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                            : <XCircle size={11} className="text-red-400 shrink-0" />
                        )}
                        <span className={`font-semibold ${
                          pctCursos >= 80 ? "text-emerald-600 dark:text-emerald-400"
                          : pctCursos >= 50 ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                        }`}>{pctCursos}%</span>
                        <span className="text-gray-400">({emp.cursosRequeridos.filter(c => c.completado).length}/{emp.cursosRequeridos.length})</span>
                      </div>
                      <Progress value={pctCursos} className="h-1 mt-0.5" />
                    </div>

                    {/* Evaluación */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400 uppercase tracking-wide" style={{fontSize:"10px"}}>Evaluación</span>
                      <div className="flex items-center gap-1">
                        {evalActual ? (
                          <>
                            {cumpleEval !== null && (
                              cumpleEval
                                ? <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                : <XCircle size={11} className="text-red-400 shrink-0" />
                            )}
                            <span className={`font-bold ${
                              evalActual.calificacion >= 80 ? "text-emerald-600 dark:text-emerald-400"
                              : evalActual.calificacion >= 60 ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                            }`}>{evalActual.calificacion}</span>
                          </>
                        ) : (
                          <span className="italic text-gray-400">Sin evaluar</span>
                        )}
                      </div>
                      {regla && <span className="text-gray-400" style={{fontSize:"10px"}}>mín {regla.minCalificacionEvaluacion}</span>}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Separador inhabilitados - móvil */}
            {paginadosSinCategoria.length > 0 && (
              <div className="flex items-center gap-2 py-1 px-1 mt-1">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 dark:text-gray-500">Categoría A / Sin categoría — inhabilitados</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
            )}

            {paginadosSinCategoria.map((emp) => {
              const evalActual = ultimaEvaluacion(emp.evaluaciones)
              return (
                <div
                  key={emp.id}
                  className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-3 opacity-60 select-none"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{emp.nombre}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{emp.puesto}</div>
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-300 dark:border-gray-600 shrink-0">
                      {/\s[A]$/i.test(emp.puesto.trim()) ? "Cat. A" : "Sin categoría"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>{emp.departamento}</span>
                      {emp.numero && <><span>·</span><span>#{emp.numero}</span></>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => setEmpleadoDesempeño(emp)}
                    >
                      <Star size={11} />
                      {evalActual ? String(evalActual.calificacion) : "Eval"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Vista desktop: tabla ── */}
          <div className="hidden md:block rounded-lg border dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                          <Calendar size={13} /> Temporalidad
                        </TooltipTrigger>
                        <TooltipContent>Tiempo en el puesto actual</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <BookOpen size={13} /> Cursos
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Star size={13} /> Evaluación
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginadosConCategoria.map((emp) => {
                  const aptitud = calcularAptitud(emp)
                  const meses = mesesEnPuesto(emp.fechaIngresoPuesto)
                  const pctCursos = porcentajeCursos(emp.cursosRequeridos)
                  const evalActual = ultimaEvaluacion(emp.evaluaciones)
                  const isExpanded = expandidos.has(emp.id)
                  const { regla } = emp
                  const cumpleTemp   = regla ? meses >= regla.minTemporalidadMeses : null
                  const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : null
                  const cumpleEval   = regla && evalActual ? evalActual.calificacion >= regla.minCalificacionEvaluacion : null

                  return (
                    <React.Fragment key={emp.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => setEmpleadoPromover(emp)}
                      >
                        <TableCell className="pr-0" onClick={(e) => { e.stopPropagation(); toggleExpand(emp.id) }}>
                          {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{emp.nombre}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{emp.puesto}</div>
                          {emp.numero && <div className="text-xs text-gray-400 dark:text-gray-500">#{emp.numero}</div>}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{emp.departamento}</span>
                          {emp.area && <div className="text-xs text-gray-400 dark:text-gray-500">{emp.area}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {cumpleTemp !== null && (cumpleTemp ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" /> : <XCircle size={13} className="text-red-400 flex-shrink-0" />)}
                            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatMeses(meses)}</span>
                          </div>
                          {regla && <div className="text-xs text-gray-400 mt-0.5">mín {formatMeses(regla.minTemporalidadMeses)}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 mb-1">
                            {cumpleCursos !== null && (cumpleCursos ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" /> : <XCircle size={13} className="text-red-400 flex-shrink-0" />)}
                            <span className={`text-sm font-semibold ${pctCursos >= 80 ? "text-emerald-600 dark:text-emerald-400" : pctCursos >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{pctCursos}%</span>
                            <span className="text-xs text-gray-400">({emp.cursosRequeridos.filter((c) => c.completado).length}/{emp.cursosRequeridos.length})</span>
                          </div>
                          <Progress value={pctCursos} className="h-1.5 w-24" />
                        </TableCell>
                        <TableCell>
                          {evalActual ? (
                            <div className="flex items-center gap-1.5">
                              {cumpleEval !== null && (cumpleEval ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" /> : <XCircle size={13} className="text-red-400 flex-shrink-0" />)}
                              <span className={`text-sm font-bold ${evalActual.calificacion >= 80 ? "text-emerald-600 dark:text-emerald-400" : evalActual.calificacion >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{evalActual.calificacion}</span>
                              {evalActual.periodo && <span className="text-xs text-gray-400">{evalActual.periodo}</span>}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin evaluar</span>
                          )}
                          {regla && <div className="text-xs text-gray-400 mt-0.5">mín {regla.minCalificacionEvaluacion}</div>}
                        </TableCell>
                        <TableCell><AptitudBadge status={aptitud} /></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEmpleadoDetalle(emp)}>
                                    <Info size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalle</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className={`h-7 w-7 ${aptitud === "apto" ? "text-primary hover:text-primary" : "text-gray-400"}`} onClick={() => setEmpleadoPromover(emp)}>
                                    <TrendingUp size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{aptitud === "apto" ? "Promover empleado" : "Registrar examen / intentar promoción"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow key={`${emp.id}-courses`} className="bg-gray-50/50 dark:bg-gray-800/30">
                          <TableCell></TableCell>
                          <TableCell colSpan={7} className="py-3">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Cursos requeridos</div>
                            {emp.cursosRequeridos.length === 0 ? (
                              <span className="text-xs text-gray-400 italic">Sin cursos asignados para este puesto</span>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                {emp.cursosRequeridos.map((curso, i) => (
                                  <div key={i} className={`flex items-center gap-2 text-xs rounded px-2 py-1.5 ${curso.completado ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
                                    {curso.completado ? <CheckCircle2 size={12} className="flex-shrink-0" /> : <XCircle size={12} className="flex-shrink-0" />}
                                    <span className="truncate">{curso.nombre}</span>
                                    {curso.calificacion !== undefined && <span className="ml-auto font-semibold">{curso.calificacion}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}

                {/* Separador inhabilitados - desktop */}
                {paginadosSinCategoria.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-2 bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Categoría A / Sin categoría — inhabilitados</span>
                    </TableCell>
                  </TableRow>
                )}

                {paginadosSinCategoria.map((emp) => {
                  const evalActual = ultimaEvaluacion(emp.evaluaciones)
                  return (
                    <TableRow key={emp.id} className="opacity-60">
                      <TableCell />
                      <TableCell>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{emp.nombre}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{emp.puesto}</div>
                        {emp.numero && <div className="text-xs text-gray-400">#{emp.numero}</div>}
                      </TableCell>
                      <TableCell><span className="text-sm text-gray-500">{emp.departamento}</span></TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell>
                        {evalActual ? (
                          <span className={`text-sm font-semibold ${
                            evalActual.calificacion >= 80 ? "text-emerald-600 dark:text-emerald-400"
                            : evalActual.calificacion >= 60 ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                          }`}>{evalActual.calificacion}</span>
                        ) : (
                          <span className="text-xs italic text-gray-400">Sin evaluar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-300 dark:border-gray-600">
                          {/\s[A]$/i.test(emp.puesto.trim()) ? "Cat. A" : "Sin categoría"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-amber-500 hover:text-amber-600"
                                onClick={() => setEmpleadoDesempeño(emp)}
                              >
                                <Star size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Capturar evaluación de desempeño</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, todosOrdenados.length)} de {todosOrdenados.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-xs text-gray-600 dark:text-gray-300 px-2">
                  {pagina} / {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-emerald-500" /> Criterio cumplido
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle size={12} className="text-red-400" /> Criterio no cumplido
        </div>
        <div className="flex items-center gap-1.5">
          <Info size={12} /> Ver detalle completo
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronRight size={12} /> Expandir cursos
        </div>
      </div>

      {/* Modal de detalle */}
      {empleadoDetalle && (
        <DetalleEmpleado
          empleado={empleadoDetalle}
          onClose={() => setEmpleadoDetalle(null)}
        />
      )}

      {/* Modal de promoción */}
      {empleadoPromover && (
        <PromoverDialog
          empleado={empleadoPromover}
          onClose={() => setEmpleadoPromover(null)}
          onPromovido={() => onDatosActualizados?.()}
        />
      )}

      {/* Modal captura evaluación de desempeño (inhabilitados) */}
      {empleadoDesempeño && (
        <CapturarDesempeñoDialog
          empleado={empleadoDesempeño}
          onClose={() => setEmpleadoDesempeño(null)}
          onGuardado={() => { setEmpleadoDesempeño(null); onDatosActualizados?.() }}
        />
      )}
    </div>
  )
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border dark:border-gray-700 border-dashed bg-white dark:bg-gray-900">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <BarChart3 size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
        Sin datos de empleados
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Carga los datos de empleados con sus evaluaciones de desempeño y el sistema calculará automáticamente la aptitud para promoción.
      </p>
    </div>
  )
}
