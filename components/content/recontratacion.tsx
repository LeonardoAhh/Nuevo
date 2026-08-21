"use client"

import React, {
  useState, useEffect, useCallback, useMemo, useReducer, useId,
} from "react"
import {
  Search, X, AlertCircle, Printer, FileCheck2, CalendarClock,
  CheckCircle2, AlertTriangle, ShieldQuestion, Loader2,
  Filter, Users, Clock, TrendingUp, BarChart3,
  ChevronLeft, ChevronRight, ShieldAlert,
} from "lucide-react"
import { Button }              from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input }               from "@/components/ui/input"
import { Badge }               from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton }            from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RecontratacionLft from "@/components/content/recontratacion-lft"
import { useNuevoIngreso, formatDate, daysFromToday } from "@/lib/hooks"
import type { NuevoIngreso }   from "@/lib/hooks"
import { useRecontratacion }   from "@/lib/hooks/useRecontratacion"
import type { RecontratacionPrintData } from "@/components/content/recontratacion-print"
import { INCIDENCIA_COLUMNS, formatMesLargo } from "@/lib/recontratacion"
import { cn } from "@/lib/utils"

// ─── Tipos y constantes ───────────────────────────────────────────────────────

type Recomendacion = "viable" | "revisar" | "no-viable" | "sin-datos"

const RECO_META: Record<
  Recomendacion,
  { label: string; icon: React.ElementType; classes: string }
> = {
  viable:      { label: "Viable",          icon: CheckCircle2,  classes: "bg-success/10 text-success border-success/30"         },
  revisar:     { label: "Revisar",          icon: AlertTriangle, classes: "bg-warning/10 text-warning border-warning/30"         },
  "no-viable": { label: "No recomendado",   icon: AlertCircle,   classes: "bg-destructive/10 text-destructive border-destructive/30" },
  "sin-datos": { label: "Sin datos",        icon: ShieldQuestion,classes: "bg-muted text-muted-foreground border-border"         },
}

const URGENCY_THRESHOLDS = { critical: 7, warning: 15 } as const
const EVAL_THRESHOLDS    = { minPass: 70, goodAvg: 85, maxFaltas: 3 } as const
const SKELETON_COUNT     = 8
const PAGE_SIZE          = 12

// ─── Lógica de negocio ────────────────────────────────────────────────────────

export function evaluarRecomendacion(data: RecontratacionPrintData): Recomendacion {
  const califs = data.evaluaciones
    .map(e => e.calificacion)
    .filter((c): c is number => c != null)

  if (califs.length === 0) return "sin-datos"

  const faltasInjust = data.incidencias.reduce(
    (acc, m) => acc + (m.valores["FALTA INJUSTIFICADA"] ?? 0), 0,
  )

  if (
    califs.some(c => c < EVAL_THRESHOLDS.minPass) ||
    faltasInjust >= EVAL_THRESHOLDS.maxFaltas
  ) return "no-viable"

  const avg = califs.reduce((a, b) => a + b, 0) / califs.length
  return avg >= EVAL_THRESHOLDS.goodAvg && faltasInjust === 0 ? "viable" : "revisar"
}

type UrgencyLevel = "critical" | "warning" | "expired" | "normal" | "indefinite"

function getUrgencyLevel(record: NuevoIngreso): UrgencyLevel {
  if (record.tipo_contrato === "Indeterminado") return "indefinite"
  const diff = daysFromToday(record.termino_contrato)
  if (diff == null) return "normal"
  if (diff < 0)                             return "expired"
  if (diff <= URGENCY_THRESHOLDS.critical)  return "critical"
  if (diff <= URGENCY_THRESHOLDS.warning)   return "warning"
  return "normal"
}

function sortByTermino(a: NuevoIngreso, b: NuevoIngreso): number {
  const da = daysFromToday(a.termino_contrato) ?? Infinity
  const db = daysFromToday(b.termino_contrato) ?? Infinity
  return da - db
}

// ─── Reducer del dialog de detalle ───────────────────────────────────────────

type DetalleState =
  | { status: "closed" }
  | { status: "loading" }
  | { status: "ready"; data: RecontratacionPrintData }
  | { status: "error"; message: string }

type DetalleAction =
  | { type: "open" }
  | { type: "loaded"; data: RecontratacionPrintData }
  | { type: "failed"; message: string }
  | { type: "close" }

function detalleReducer(_: DetalleState, action: DetalleAction): DetalleState {
  switch (action.type) {
    case "open":   return { status: "loading" }
    case "loaded": return { status: "ready", data: action.data }
    case "failed": return { status: "error", message: action.message }
    case "close":  return { status: "closed" }
  }
}

// ─── Helpers de accesibilidad ─────────────────────────────────────────────────

/** Descripción legible del nivel de urgencia para screen readers */
function urgencyLabel(urgency: UrgencyLevel, record: NuevoIngreso): string {
  const diff = daysFromToday(record.termino_contrato)
  switch (urgency) {
    case "expired":    return "Contrato vencido"
    case "critical":   return `Vence en ${diff} día${diff === 1 ? "" : "s"}`
    case "warning":    return `Vence en ${diff} días`
    case "indefinite": return "Contrato indeterminado"
    default:           return record.termino_contrato ? `Término ${formatDate(record.termino_contrato)}` : "Sin fecha de término"
  }
}

// ─── Tokens de urgencia ───────────────────────────────────────────────────────
// Solo usa CSS variables del sistema — cero colores hardcodeados.

const URGENCY_ACCENT: Record<UrgencyLevel, string> = {
  expired:    "border-t-destructive",
  critical:   "border-t-destructive",
  warning:    "border-t-warning",
  normal:     "border-t-transparent",
  indefinite: "border-t-transparent",
}

const URGENCY_TEXT: Record<UrgencyLevel, string> = {
  expired:    "text-destructive",
  critical:   "text-destructive",
  warning:    "text-warning",
  normal:     "text-muted-foreground",
  indefinite: "text-muted-foreground",
}

const URGENCY_PILL_BG: Record<"critical" | "warning", string> = {
  critical: "bg-destructive/15 text-destructive",
  warning:  "bg-warning/15 text-warning",
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </dt>
      <dd className="text-sm text-foreground font-medium truncate">{value}</dd>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      {children}
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </h3>
  )
}

function StatusBadge({
  urgency,
  record,
}: {
  urgency: UrgencyLevel
  record: NuevoIngreso
}) {
  const diff = daysFromToday(record.termino_contrato)

  if (urgency === "indefinite") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Indeterminado
      </span>
    )
  }

  const label =
    urgency === "expired"
      ? `Venció ${formatDate(record.termino_contrato)}`
      : record.termino_contrato
        ? `Término ${formatDate(record.termino_contrato)}`
        : "Sin término"

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", URGENCY_TEXT[urgency])}>
      <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
      {diff != null && diff >= 0 && diff <= URGENCY_THRESHOLDS.warning && (
        <span
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            urgency === "critical"
              ? URGENCY_PILL_BG.critical
              : URGENCY_PILL_BG.warning,
          )}
        >
          {diff === 0 ? "hoy" : `${diff}d`}
        </span>
      )}
    </span>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, iconClass, valueClass,
}: {
  icon: React.ElementType
  label: string
  value: number
  iconClass: string
  valueClass: string
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <div className={cn("rounded-md bg-muted p-1.5 shrink-0", iconClass)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className={cn("text-lg font-semibold leading-tight tabular-nums", valueClass)}>
          {value}
        </p>
      </div>
    </div>
  )
}

function SummaryStats({ records }: { records: NuevoIngreso[] }) {
  const stats = useMemo(() => {
    let urgent = 0, warning = 0, indefinite = 0
    for (const r of records) {
      const u = getUrgencyLevel(r)
      if (u === "expired" || u === "critical") urgent++
      else if (u === "warning") warning++
      if (r.tipo_contrato === "Indeterminado") indefinite++
    }
    return { total: records.length, urgent, warning, indefinite }
  }, [records])

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5"
      aria-label="Resumen de contratos"
    >
      <StatCard icon={Users}      label="Total empleados"    value={stats.total}      iconClass="text-primary"     valueClass="text-foreground"  />
      <StatCard icon={AlertCircle} label="Urgentes / vencidos" value={stats.urgent}   iconClass="text-destructive" valueClass={stats.urgent > 0    ? "text-destructive" : "text-foreground"} />
      <StatCard icon={Clock}       label="Próximos 15 días"  value={stats.warning}    iconClass="text-warning"     valueClass={stats.warning > 0   ? "text-warning"     : "text-foreground"} />
      <StatCard icon={TrendingUp}  label="Indeterminados"    value={stats.indefinite} iconClass="text-success"     valueClass="text-foreground"  />
    </div>
  )
}

// ─── EmpleadoRow ─────────────────────────────────────────────────────────────
// Mobile: columna compacta (nombre + puesto + fecha + acciones).
// Desktop (sm+): la misma tarjeta pero con más aire — el grid hace el trabajo.

function EmpleadoRow({
  record,
  onRevisar,
  onImprimir,
}: {
  record: NuevoIngreso
  onRevisar: (r: NuevoIngreso) => void
  onImprimir: (numero: string) => void
}) {
  const urgency = getUrgencyLevel(record)
  const ariaDesc = urgencyLabel(urgency, record)

  return (
    <li
      className={cn(
        "flex flex-col justify-between gap-2.5 rounded-lg border bg-card p-3",
        "border-t-2 transition-colors hover:bg-accent/20",
        URGENCY_ACCENT[urgency],
      )}
      aria-label={`${record.nombre}. ${ariaDesc}`}
    >
      {/* Nombre + número */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
            {record.nombre}
          </p>
          {/* Puesto — solo visible si hay datos */}
          {record.puesto && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {record.puesto}
            </p>
          )}
        </div>
        {record.numero && (
          <span className="shrink-0 text-[10px] font-mono text-muted-foreground/50 tabular-nums pt-0.5">
            #{record.numero}
          </span>
        )}
      </div>

      {/* Chips: departamento + turno — ocultos en mobile si no hay espacio */}
      {(record.departamento || record.turno) && (
        <div className="flex flex-wrap items-center gap-1" aria-hidden="true">
          {record.departamento && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground max-w-[120px] truncate">
              {record.departamento}
            </span>
          )}
          {record.turno && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              T{record.turno}
            </span>
          )}
        </div>
      )}

      {/* Separador */}
      <hr className="border-border/50" />

      {/* Fecha + acciones */}
      <div className="flex items-center justify-between gap-2">
        <StatusBadge urgency={urgency} record={record} />

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => onRevisar(record)}
            aria-label={`Ver detalle de ${record.nombre}`}
          >
            Revisar
          </Button>
          <Button
            size="sm"
            className="h-7 px-2.5 gap-1 text-xs"
            onClick={() => record.numero && onImprimir(record.numero)}
            disabled={!record.numero}
            aria-label={record.numero ? `Imprimir formato de ${record.nombre}` : "Sin número asignado"}
            title={record.numero ? undefined : "Sin número asignado"}
          >
            <Printer className="h-3 w-3" aria-hidden="true" />
            <span className="hidden xs:inline">Imprimir</span>
          </Button>
        </div>
      </div>
    </li>
  )
}

// ─── SkeletonRow ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <li
      className="flex flex-col gap-2.5 rounded-lg border border-t-2 border-t-transparent bg-card p-3"
      aria-hidden="true"
    >
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-10 rounded-md" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-full" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </li>
  )
}

// ─── Paginación ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}) {
  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  return (
    <nav
      className="flex items-center justify-between gap-3 pt-1"
      aria-label="Paginación"
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={page <= 1}
          onClick={onPrev}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="text-xs text-muted-foreground px-2 tabular-nums" aria-live="polite">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={page >= pageCount}
          onClick={onNext}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}

// ─── Dialog de detalle ────────────────────────────────────────────────────────

function DetalleDialog({
  state,
  onClose,
  onImprimir,
}: {
  state: DetalleState
  onClose: () => void
  onImprimir: (numero: string) => void
}) {
  const isOpen = state.status !== "closed"
  const data   = state.status === "ready" ? state.data : null
  const reco   = data ? evaluarRecomendacion(data) : null

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto bg-card p-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b bg-card px-4 sm:px-6 py-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
                  {data?.nombre ?? "Detalle de empleado"}
                  {reco && (
                    <Badge
                      variant="outline"
                      className={cn("gap-1.5 text-xs font-medium", RECO_META[reco].classes)}
                    >
                      {React.createElement(RECO_META[reco].icon, {
                        className: "h-3 w-3",
                        "aria-hidden": true,
                      })}
                      {RECO_META[reco].label}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Vista previa · Formato de continuidad de contrato
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-5">

          {/* Loading */}
          {state.status === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <p className="text-sm" role="status">Cargando información…</p>
            </div>
          )}

          {/* Error */}
          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Content */}
          {state.status === "ready" && data && (
            <div className="space-y-6 text-sm">

              {/* Datos generales */}
              <section aria-labelledby="sec-datos">
                <SectionTitle>
                  <span id="sec-datos">Datos generales</span>
                </SectionTitle>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-3">
                  <Dato label="No. empleado"     value={data.numero           || "—"} />
                  <Dato label="Puesto"            value={data.puesto           || "—"} />
                  <Dato label="Departamento"      value={data.departamento     || "—"} />
                  <Dato label="Turno"             value={data.turno            || "—"} />
                  <Dato label="Fecha ingreso"     value={formatDate(data.fechaIngresoISO)}    />
                  <Dato label="Término contrato"  value={formatDate(data.terminoContratoISO)} />
                  <Dato label="Jefe directo"      value={data.jefeDirecto      || "—"} />
                  <Dato label="RG-REC-048"        value={data.rgEntregado      || "—"} />
                </dl>
              </section>

              {/* Incidencias */}
              <section aria-labelledby="sec-incidencias">
                <SectionTitle>
                  <span id="sec-incidencias">Incidencias — primeros 90 días</span>
                </SectionTitle>
                <div className="mt-3 overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th scope="col" className="px-3 py-2.5 text-left font-medium text-muted-foreground w-24">
                          Mes
                        </th>
                        {INCIDENCIA_COLUMNS.map(c => (
                          <th
                            key={c.header}
                            scope="col"
                            className="px-2 py-2.5 text-center font-medium text-muted-foreground text-[11px] leading-tight"
                          >
                            {c.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.incidencias.length === 0 ? (
                        <tr>
                          <td
                            colSpan={INCIDENCIA_COLUMNS.length + 1}
                            className="px-3 py-4 text-center text-muted-foreground"
                          >
                            Sin periodo registrado — falta fecha de ingreso
                          </td>
                        </tr>
                      ) : (
                        data.incidencias.map(m => (
                          <tr key={m.mes} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap font-medium text-foreground">
                              {formatMesLargo(m.mes)}
                            </td>
                            {INCIDENCIA_COLUMNS.map(c => {
                              const val = m.valores[c.categoria]
                              const isFalta = c.categoria === "FALTA INJUSTIFICADA"
                              return (
                                <td key={c.header} className="px-2 py-2 text-center">
                                  {val ? (
                                    <span className={cn(
                                      "font-semibold",
                                      isFalta ? "text-destructive" : "text-foreground",
                                    )}>
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/40" aria-label="Sin valor">—</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Evaluaciones */}
              <section aria-labelledby="sec-evaluaciones">
                <SectionTitle>
                  <span id="sec-evaluaciones">Evaluaciones de desempeño</span>
                </SectionTitle>
                <div className="mt-3 overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs min-w-[360px]">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th scope="col" className="px-3 py-2.5 text-left font-medium text-muted-foreground w-8">#</th>
                        <th scope="col" className="px-3 py-2.5 text-left font-medium text-muted-foreground">Periodo</th>
                        <th scope="col" className="px-3 py-2.5 text-center font-medium text-muted-foreground">Calificación</th>
                        <th scope="col" className="px-3 py-2.5 text-left font-medium text-muted-foreground">Plan de seguimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.evaluaciones.map((ev, i) => (
                        <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-foreground">
                            {ev.periodo.label || "—"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {ev.calificacion != null ? (
                              <span className={cn(
                                "font-semibold text-sm",
                                ev.calificacion >= EVAL_THRESHOLDS.minPass
                                  ? "text-success"
                                  : "text-destructive",
                              )}>
                                {ev.calificacion}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40" aria-label="Sin calificación">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {ev.planSeguimiento || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Pie de dialog */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Recomendación orientativa — la decisión final corresponde al Jefe de Departamento.
                </p>
                <Button
                  onClick={() => data.numero && onImprimir(data.numero)}
                  disabled={!data.numero}
                  size="sm"
                  className="gap-1.5 shrink-0"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  Imprimir formato
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RecontratacionContent() {
  const { loading, error, fetchAll }          = useNuevoIngreso()
  const { buildRecontratacionData }           = useRecontratacion()

  const [records,    setRecords]    = useState<NuevoIngreso[]>([])
  const [search,     setSearch]     = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [page,       setPage]       = useState(1)
  const [detalleState, dispatchDetalle] = useReducer(detalleReducer, { status: "closed" })

  const searchId = useId()

  // Carga inicial
  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [fetchAll])
  useEffect(() => { load() }, [load])

  // Opciones de departamento
  const departments = useMemo(
    () =>
      Array.from(
        new Set(records.map(r => r.departamento).filter((d): d is string => !!d)),
      ).sort(),
    [records],
  )

  // Filtrado + orden
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return records
      .filter(r => {
        if (r.tipo_contrato === "Indeterminado") return false
        const matchSearch =
          !q ||
          r.nombre.toLowerCase().includes(q) ||
          (r.numero       ?? "").toLowerCase().includes(q) ||
          (r.puesto        ?? "").toLowerCase().includes(q) ||
          (r.departamento  ?? "").toLowerCase().includes(q)
        const matchDept = filterDept === "all" || r.departamento === filterDept
        return matchSearch && matchDept
      })
      .sort(sortByTermino)
  }, [records, search, filterDept])

  // Paginación
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged     = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  useEffect(() => { setPage(1) },                      [search, filterDept])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  // Acciones
  const abrirDetalle = useCallback(
    async (record: NuevoIngreso) => {
      dispatchDetalle({ type: "open" })
      try {
        const data = await buildRecontratacionData(record)
        dispatchDetalle({ type: "loaded", data })
      } catch (err) {
        dispatchDetalle({
          type: "failed",
          message: err instanceof Error ? err.message : "Error al cargar el detalle.",
        })
      }
    },
    [buildRecontratacionData],
  )

  const imprimir = useCallback((numero: string) => {
    window.open(`/recontratacion/imprimir?numero=${encodeURIComponent(numero)}`, "_blank")
  }, [])

  const hasFilters   = search.trim() !== "" || filterDept !== "all"
  const clearFilters = () => { setSearch(""); setFilterDept("all") }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Tabs defaultValue="vencimientos" className="space-y-4">
      <TabsList
        className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex"
        data-testid="recontratacion-tabs"
      >
        <TabsTrigger value="vencimientos" data-testid="tab-vencimientos" className="gap-1.5">
          <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Vencimientos</span>
        </TabsTrigger>
        <TabsTrigger value="lft" data-testid="tab-lft" className="gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Baja LFT Art. 47</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="vencimientos" className="mt-0 space-y-0">
      {/* Error global */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-lg" />
          ))}
        </div>
      ) : (
        records.length > 0 && <SummaryStats records={records} />
      )}

      {/* Tarjeta principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileCheck2 className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
              Detalle de contratos
            </CardTitle>
            {!loading && (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {filtered.length === records.length
                  ? `${records.length} empleados`
                  : `${filtered.length} de ${records.length}`}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">

          {/* Filtros */}
          <div
            className="flex flex-wrap items-center gap-2"
            role="search"
            aria-label="Filtros de empleados"
          >
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[180px]">
              <label htmlFor={searchId} className="sr-only">
                Buscar empleado
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id={searchId}
                placeholder="Nombre, número, puesto…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={cn("pl-9 h-9 bg-muted/50 text-sm", search && "pr-9")}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Filtro departamento */}
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger
                className="h-9 min-w-[150px] w-auto bg-muted/50 text-sm gap-1.5"
                aria-label="Filtrar por departamento"
              >
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={clearFilters}
                aria-label="Limpiar todos los filtros"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Lista */}
          {loading ? (
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5"
              aria-label="Cargando empleados"
            >
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground gap-3"
              role="status"
            >
              <BarChart3 className="h-8 w-8 opacity-25" aria-hidden="true" />
              <p className="text-sm text-center">
                {hasFilters
                  ? "Sin resultados para los filtros aplicados."
                  : "No hay empleados de nuevo ingreso."}
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs mt-1"
                  onClick={clearFilters}
                >
                  Quitar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <ul
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5"
                aria-label="Lista de empleados"
              >
                {paged.map(r => (
                  <EmpleadoRow
                    key={r.id}
                    record={r}
                    onRevisar={abrirDetalle}
                    onImprimir={imprimir}
                  />
                ))}
              </ul>

              {pageCount > 1 && (
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPrev={() => setPage(p => Math.max(1, p - 1))}
                  onNext={() => setPage(p => Math.min(pageCount, p + 1))}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <DetalleDialog
        state={detalleState}
        onClose={() => dispatchDetalle({ type: "close" })}
        onImprimir={imprimir}
      />
      </TabsContent>

      <TabsContent value="lft" className="mt-0">
        <RecontratacionLft />
      </TabsContent>
    </Tabs>
  )
}
