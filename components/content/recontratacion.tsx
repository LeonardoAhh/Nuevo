"use client"

import React, { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import {
  Search, X, AlertCircle, Printer, FileCheck2, CalendarClock,
  CheckCircle2, AlertTriangle, ShieldQuestion, Loader2,
  Filter, Users, Clock, TrendingUp, BarChart3,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { useNuevoIngreso, formatDate, daysFromToday } from "@/lib/hooks"
import type { NuevoIngreso } from "@/lib/hooks"
import { useRecontratacion } from "@/lib/hooks/useRecontratacion"
import type { RecontratacionPrintData } from "@/components/content/recontratacion-print"
import { INCIDENCIA_COLUMNS, formatMesLargo } from "@/lib/recontratacion"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos y constantes
// ─────────────────────────────────────────────────────────────────────────────

type Recomendacion = "viable" | "revisar" | "no-viable" | "sin-datos"

const RECO_META: Record<
  Recomendacion,
  { label: string; icon: React.ElementType; classes: string; dotClass: string }
> = {
  viable: {
    label: "Viable",
    icon: CheckCircle2,
    classes: "bg-success/10 text-success border-success/30",
    dotClass: "bg-success",
  },
  revisar: {
    label: "Revisar",
    icon: AlertTriangle,
    classes: "bg-warning/10 text-warning border-warning/30",
    dotClass: "bg-warning",
  },
  "no-viable": {
    label: "No recomendado",
    icon: AlertCircle,
    classes: "bg-destructive/10 text-destructive border-destructive/30",
    dotClass: "bg-destructive",
  },
  "sin-datos": {
    label: "Sin datos",
    icon: ShieldQuestion,
    classes: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
}

const URGENCY_THRESHOLDS = { critical: 7, warning: 15 } as const
const SKELETON_COUNT = 12
const PAGE_SIZE = 12

// ─────────────────────────────────────────────────────────────────────────────
// Lógica de negocio (separada de la UI)
// ─────────────────────────────────────────────────────────────────────────────

const EVAL_THRESHOLDS = { minPass: 70, goodAvg: 85, maxFaltas: 3 } as const

export function evaluarRecomendacion(data: RecontratacionPrintData): Recomendacion {
  const califs = data.evaluaciones
    .map(e => e.calificacion)
    .filter((c): c is number => c != null)

  if (califs.length === 0) return "sin-datos"

  const faltasInjust = data.incidencias.reduce(
    (acc, m) => acc + (m.valores["FALTA INJUSTIFICADA"] ?? 0), 0,
  )

  if (califs.some(c => c < EVAL_THRESHOLDS.minPass) || faltasInjust >= EVAL_THRESHOLDS.maxFaltas) {
    return "no-viable"
  }

  const promedio = califs.reduce((a, b) => a + b, 0) / califs.length

  if (promedio >= EVAL_THRESHOLDS.goodAvg && faltasInjust === 0) return "viable"
  return "revisar"
}

function getUrgencyLevel(record: NuevoIngreso): "critical" | "warning" | "expired" | "normal" | "indefinite" {
  if (record.tipo_contrato === "Indeterminado") return "indefinite"
  const diff = daysFromToday(record.termino_contrato)
  if (diff == null) return "normal"
  if (diff < 0) return "expired"
  if (diff <= URGENCY_THRESHOLDS.critical) return "critical"
  if (diff <= URGENCY_THRESHOLDS.warning) return "warning"
  return "normal"
}

function sortByTermino(a: NuevoIngreso, b: NuevoIngreso): number {
  const da = daysFromToday(a.termino_contrato) ?? Infinity
  const db = daysFromToday(b.termino_contrato) ?? Infinity
  return da - db
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado del detalle con reducer
// ─────────────────────────────────────────────────────────────────────────────

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

function detalleReducer(_state: DetalleState, action: DetalleAction): DetalleState {
  switch (action.type) {
    case "open":    return { status: "loading" }
    case "loaded":  return { status: "ready", data: action.data }
    case "failed":  return { status: "error", message: action.message }
    case "close":   return { status: "closed" }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes auxiliares
// ─────────────────────────────────────────────────────────────────────────────

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-foreground font-medium truncate">{value}</span>
    </div>
  )
}

function StatusBadge({ urgency, record }: { urgency: ReturnType<typeof getUrgencyLevel>; record: NuevoIngreso }) {
  const diff = daysFromToday(record.termino_contrato)

  if (urgency === "indefinite") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        Indeterminado
      </span>
    )
  }

  const colorMap = {
    expired: "text-destructive",
    critical: "text-destructive",
    warning: "text-warning",
    normal: "text-muted-foreground",
  } as const

  const label = urgency === "expired"
    ? `Venció ${formatDate(record.termino_contrato)}`
    : record.termino_contrato
      ? `Término ${formatDate(record.termino_contrato)}`
      : "Sin término"

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${colorMap[urgency]}`}>
      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
      {label}
      {diff != null && diff >= 0 && diff <= URGENCY_THRESHOLDS.warning && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          urgency === "critical"
            ? "bg-destructive/15 text-destructive"
            : "bg-warning/15 text-warning"
        }`}>
          {diff === 0 ? "hoy" : `${diff}d`}
        </span>
      )}
    </span>
  )
}

function SummaryStats({ records }: { records: NuevoIngreso[] }) {
  const stats = useMemo(() => {
    const expiredOrCritical = records.filter(r => {
      const u = getUrgencyLevel(r)
      return u === "expired" || u === "critical"
    }).length
    const warning = records.filter(r => getUrgencyLevel(r) === "warning").length
    const indefinite = records.filter(r => r.tipo_contrato === "Indeterminado").length
    return { total: records.length, expiredOrCritical, warning, indefinite }
  }, [records])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
      <StatCard
        icon={Users}
        label="Total empleados"
        value={stats.total}
        iconClass="text-primary"
        valueClass="text-foreground"
      />
      <StatCard
        icon={AlertCircle}
        label="Urgentes / vencidos"
        value={stats.expiredOrCritical}
        iconClass="text-destructive"
        valueClass={stats.expiredOrCritical > 0 ? "text-destructive" : "text-foreground"}
      />
      <StatCard
        icon={Clock}
        label="Próximos 15 días"
        value={stats.warning}
        iconClass="text-warning"
        valueClass={stats.warning > 0 ? "text-warning" : "text-foreground"}
      />
      <StatCard
        icon={TrendingUp}
        label="Indeterminados"
        value={stats.indefinite}
        iconClass="text-success"
        valueClass="text-foreground"
      />
    </div>
  )
}

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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className={`rounded-md bg-muted p-1.5 ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className={`text-lg font-semibold leading-tight ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}

// Estilos de acento por urgencia — usados en el borde top de la tarjeta
const URGENCY_TOP: Record<ReturnType<typeof getUrgencyLevel>, string> = {
  expired:    "border-t-2 border-t-destructive",
  critical:   "border-t-2 border-t-destructive",
  warning:    "border-t-2 border-t-warning",
  normal:     "border-t-2 border-t-transparent",
  indefinite: "border-t-2 border-t-transparent",
}

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

  return (
    <li
      className={[
        "group flex flex-col justify-between gap-3",
        "rounded-lg border border-border bg-background",
        "p-3.5 transition-colors hover:bg-accent/30",
        URGENCY_TOP[urgency],
      ].join(" ")}
    >
      {/* ── Bloque superior: nombre + número ── */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
            {record.nombre}
          </span>
          {record.numero && (
            <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 tabular-nums pt-0.5">
              #{record.numero}
            </span>
          )}
        </div>

        {/* Puesto */}
        <p className="text-xs text-muted-foreground truncate">
          {record.puesto || "—"}
        </p>

        {/* Depto + Turno */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {record.departamento && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              {record.departamento}
            </span>
          )}
          {record.turno && (
            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              T{record.turno}
            </span>
          )}
        </div>
      </div>

      {/* ── Separador ── */}
      <div className="border-t border-border/60" />

      {/* ── Bloque inferior: estado + acciones ── */}
      <div className="flex items-center justify-between gap-2">
        <StatusBadge urgency={urgency} record={record} />

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => onRevisar(record)}
          >
            Revisar
          </Button>
          <Button
            size="sm"
            className="h-7 px-2.5 gap-1 text-xs"
            onClick={() => record.numero && onImprimir(record.numero)}
            disabled={!record.numero}
            title={record.numero ? "Imprimir formato" : "Sin número asignado"}
          >
            <Printer className="h-3 w-3" />
            Imprimir
          </Button>
        </div>
      </div>
    </li>
  )
}

function SkeletonRow() {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border border-t-2 border-t-transparent bg-background p-3.5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5 pt-0.5">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-10 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-full" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </div>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog de detalle
// ─────────────────────────────────────────────────────────────────────────────

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
  const data = state.status === "ready" ? state.data : null
  const reco = data ? evaluarRecomendacion(data) : null

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto bg-card p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="flex items-center gap-2 flex-wrap text-base">
                  {data?.nombre ?? "Detalle de empleado"}
                  {reco && (
                    <Badge
                      variant="outline"
                      className={`gap-1.5 text-xs font-medium ${RECO_META[reco].classes}`}
                    >
                      {React.createElement(RECO_META[reco].icon, { className: "h-3 w-3" })}
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
        <div className="px-6 py-5">
          {state.status === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Cargando información…</span>
            </div>
          )}

          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {state.status === "ready" && data && (
            <div className="space-y-6 text-sm">
              {/* Datos generales */}
              <section>
                <SectionTitle>Datos generales</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-3">
                  <Dato label="No. empleado" value={data.numero || "—"} />
                  <Dato label="Puesto" value={data.puesto || "—"} />
                  <Dato label="Departamento" value={data.departamento || "—"} />
                  <Dato label="Turno" value={data.turno || "—"} />
                  <Dato label="Fecha ingreso" value={formatDate(data.fechaIngresoISO)} />
                  <Dato label="Término contrato" value={formatDate(data.terminoContratoISO)} />
                  <Dato label="Jefe directo" value={data.jefeDirecto} />
                  <Dato label="RG-REC-048" value={data.rgEntregado} />
                </div>
              </section>

              {/* Incidencias */}
              <section>
                <SectionTitle>Incidencias — primeros 90 días</SectionTitle>
                <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-24">Mes</th>
                        {INCIDENCIA_COLUMNS.map(c => (
                          <th
                            key={c.header}
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
                            className="px-3 py-4 text-center text-muted-foreground text-xs"
                          >
                            Sin periodo registrado — falta fecha de ingreso
                          </td>
                        </tr>
                      ) : (
                        data.incidencias.map(m => (
                          <tr key={m.mes} className="border-t border-border hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap font-medium text-foreground">
                              {formatMesLargo(m.mes)}
                            </td>
                            {INCIDENCIA_COLUMNS.map(c => {
                              const val = m.valores[c.categoria]
                              return (
                                <td key={c.header} className="px-2 py-2 text-center">
                                  {val ? (
                                    <span className={`font-semibold ${
                                      c.categoria === "FALTA INJUSTIFICADA"
                                        ? "text-destructive"
                                        : "text-foreground"
                                    }`}>
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/40">—</span>
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
              <section>
                <SectionTitle>Evaluaciones de desempeño</SectionTitle>
                <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs min-w-[360px]">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-8">#</th>
                        <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Periodo</th>
                        <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Calificación</th>
                        <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Plan seguimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.evaluaciones.map((ev, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-foreground">
                            {ev.periodo.label || "—"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {ev.calificacion != null ? (
                              <span className={`font-semibold text-sm ${
                                ev.calificacion >= EVAL_THRESHOLDS.minPass
                                  ? "text-success"
                                  : "text-destructive"
                              }`}>
                                {ev.calificacion}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
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

              {/* Footer acción */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  La recomendación es orientativa — la decisión final le corresponde al Jefe de Departamento.
                </p>
                <Button
                  onClick={() => data.numero && onImprimir(data.numero)}
                  disabled={!data.numero}
                  size="sm"
                  className="gap-1.5 shrink-0"
                >
                  <Printer className="h-3.5 w-3.5" />
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </h3>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function RecontratacionContent() {
  const { loading, error, fetchAll } = useNuevoIngreso()
  const { buildRecontratacionData } = useRecontratacion()

  const [records, setRecords] = useState<NuevoIngreso[]>([])
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [page, setPage] = useState(1)

  const [detalleState, dispatchDetalle] = useReducer(detalleReducer, { status: "closed" })

  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [fetchAll])

  useEffect(() => { load() }, [load])

  const departments = useMemo(
    () =>
      Array.from(new Set(records.map(r => r.departamento).filter((d): d is string => !!d))).sort(),
    [records],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return records
      .filter(r => {
        // Ocultar los que ya tienen contrato indeterminado (no requieren recontratación)
        if (r.tipo_contrato === "Indeterminado") return false
        const matchSearch =
          !q ||
          r.nombre.toLowerCase().includes(q) ||
          (r.numero ?? "").toLowerCase().includes(q) ||
          (r.puesto ?? "").toLowerCase().includes(q) ||
          (r.departamento ?? "").toLowerCase().includes(q)
        const matchDept = filterDept === "all" || r.departamento === filterDept
        return matchSearch && matchDept
      })
      .sort(sortByTermino)
  }, [records, search, filterDept])

  // Paginación: 10 por página
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  // Reset a la primera página al cambiar filtros/búsqueda
  useEffect(() => { setPage(1) }, [search, filterDept])
  // Clamp si la página actual queda fuera de rango (ej. al reducir resultados)
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

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

  const hasFilters = search.trim() !== "" || filterDept !== "all"

  return (
    <>
      {/* Error global */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats rápidas */}
      {!loading && records.length > 0 && <SummaryStats records={records} />}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-lg" />
          ))}
        </div>
      )}

      {/* Tarjeta principal */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileCheck2 className="h-4.5 w-4.5 text-primary" />
              Detalle de contratos
            </CardTitle>
            {!loading && (
              <span className="text-xs text-muted-foreground">
                {filtered.length === records.length
                  ? `${records.length} empleados`
                  : `${filtered.length} de ${records.length}`}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre, número, puesto…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`pl-9 h-9 bg-muted/50 text-sm ${search ? "pr-9" : ""}`}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtro departamento */}
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="h-9 min-w-[160px] w-auto bg-muted/50 text-sm gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => { setSearch(""); setFilterDept("all") }}
              >
                <X className="h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Lista */}
          {loading ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
              <BarChart3 className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {hasFilters ? "Sin resultados para los filtros aplicados." : "No hay empleados de nuevo ingreso."}
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => { setSearch(""); setFilterDept("all") }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paged.map(r => (
                  <EmpleadoRow
                    key={r.id}
                    record={r}
                    onRevisar={abrirDetalle}
                    onImprimir={imprimir}
                  />
                ))}
              </ul>

              {/* Paginación */}
              {pageCount > 1 && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Anterior
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 tabular-nums">
                      {page} / {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      disabled={page >= pageCount}
                      onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalle */}
      <DetalleDialog
        state={detalleState}
        onClose={() => dispatchDetalle({ type: "close" })}
        onImprimir={imprimir}
      />
    </>
  )
}
