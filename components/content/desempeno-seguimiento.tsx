"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertTriangle, CalendarClock, CheckCircle2, Clock,
  ExternalLink, Filter, RefreshCw, Search,
  UserX, X, TrendingDown,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { PERIODOS_DESEMPENO } from "@/lib/catalogo"
import { useRole } from "@/lib/hooks"

// All period strings flattened into one array for filter dropdown
const ALL_PERIODOS: string[] = [
  ...PERIODOS_DESEMPENO.semestrales,
  ...PERIODOS_DESEMPENO.mensuales,
]

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Umbral de calificación reprobada */
const SCORE_THRESHOLD = 80

const TIPO_LABEL: Record<string, string> = {
  operativo: "Operativo",
  administrativo: "Administrativo",
  jefe: "Jefe",
}

interface EvalRow {
  id: string
  numero_empleado: string
  nombre: string | null
  puesto: string | null
  evaluador_nombre: string | null
  tipo: string
  periodo: string | null
  calificacion_final: number
  compromisos: string
  fecha_revision: string | null
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fecha local (no UTC) en formato YYYY-MM-DD */
function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  // Could be YYYY-MM-DD or a free-text date entered by evaluator
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
  }
  return iso
}

type RevisionStatus = "vencido" | "proximo" | "pendiente" | "sin_fecha"

function getRevisionStatus(fechaRevision: string | null): RevisionStatus {
  if (!fechaRevision) return "sin_fecha"
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(fechaRevision) ? fechaRevision : null
  if (!iso) return "pendiente"
  if (iso < today()) return "vencido"
  const diff = (new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86_400_000
  if (diff <= 14) return "proximo"
  return "pendiente"
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  const color =
    pct < 60 ? "bg-destructive/15 text-destructive border-destructive/30" :
    pct < SCORE_THRESHOLD ? "bg-warning/15 text-warning border-warning/30" :
    "bg-success/15 text-success border-success/30"
  return (
    <Badge
      variant="outline"
      aria-label={`Calificación final: ${pct} de 100`}
      className={`text-sm font-bold tabular-nums px-2.5 py-0.5 ${color}`}
    >
      {pct}
    </Badge>
  )
}

const REVISION_CFG: Record<
  RevisionStatus,
  { icon: typeof Clock; className: string; prefix: string }
> = {
  vencido:   { icon: AlertTriangle, className: "bg-destructive/10 text-destructive", prefix: "Vencido" },
  proximo:   { icon: Clock,         className: "bg-warning/10 text-warning",         prefix: "Próximo" },
  pendiente: { icon: CalendarClock, className: "bg-muted text-muted-foreground",     prefix: "Rev." },
  sin_fecha: { icon: CalendarClock, className: "bg-muted text-muted-foreground",     prefix: "" },
}

function RevisionPill({ fechaRevision }: { fechaRevision: string | null }) {
  const status = getRevisionStatus(fechaRevision)
  const { icon: Icon, className, prefix } = REVISION_CFG[status]
  const label =
    status === "sin_fecha"
      ? "Sin fecha de revisión"
      : `${prefix} · ${formatDate(fechaRevision)}`
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  )
}

/** Card para móvil/tablet */
function EvalCard({ row }: { row: EvalRow }) {
  return (
    <Card className="bg-card border-border/60 hover:border-border transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Top: employee + score */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {row.nombre ?? row.numero_empleado}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {row.puesto ?? "—"} · N.º {row.numero_empleado}
            </p>
          </div>
          <ScoreBadge score={row.calificacion_final} />
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {TIPO_LABEL[row.tipo] ?? row.tipo}
          </Badge>
          {row.periodo && (
            <Badge variant="outline" className="text-xs">
              {row.periodo}
            </Badge>
          )}
          <RevisionPill fechaRevision={row.fecha_revision} />
        </div>

        {/* Compromisos */}
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Compromisos acordados
          </p>
          <p className="text-sm text-foreground line-clamp-3 whitespace-pre-line">
            {row.compromisos}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground truncate">
            Evaluador: {row.evaluador_nombre ?? "—"}
          </p>
          <Button asChild size="sm" variant="outline" className="h-9 shrink-0 text-xs gap-1">
            <Link href={`/desempeno?n=${encodeURIComponent(row.numero_empleado)}`}>
              Ver evaluación <ExternalLink size={12} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** Tabla para desktop (lg+) — más legible para escanear muchos registros */
function EvalTable({ rows }: { rows: EvalRow[] }) {
  return (
    <Card className="bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Evaluaciones de desempeño con compromisos de mejora registrados
          </caption>
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Empleado</th>
              <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Tipo / Período</th>
              <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground text-center">Calif.</th>
              <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Compromisos</th>
              <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Revisión</th>
              <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Evaluador</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">
                    {row.nombre ?? row.numero_empleado}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.puesto ?? "—"} · N.º {row.numero_empleado}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="w-fit text-xs">
                      {TIPO_LABEL[row.tipo] ?? row.tipo}
                    </Badge>
                    {row.periodo && (
                      <span className="text-xs text-muted-foreground">{row.periodo}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <ScoreBadge score={row.calificacion_final} />
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p
                    className="text-sm text-foreground line-clamp-2 whitespace-pre-line"
                    title={row.compromisos}
                  >
                    {row.compromisos}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <RevisionPill fechaRevision={row.fecha_revision} />
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-[10rem]">
                  <p className="truncate" title={row.evaluador_nombre ?? undefined}>
                    {row.evaluador_nombre ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1">
                    <Link
                      href={`/desempeno?n=${encodeURIComponent(row.numero_empleado)}`}
                      aria-label={`Ver evaluación de ${row.nombre ?? row.numero_empleado}`}
                    >
                      Ver <ExternalLink size={12} aria-hidden="true" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary cards
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCards({ rows }: { rows: EvalRow[] }) {
  const reprobados = rows.filter(r => r.calificacion_final < SCORE_THRESHOLD).length
  const vencidos   = rows.filter(r => getRevisionStatus(r.fecha_revision) === "vencido").length
  const proximos   = rows.filter(r => getRevisionStatus(r.fecha_revision) === "proximo").length
  const sinFecha   = rows.filter(r => !r.fecha_revision).length

  const items = [
    { label: "Total",         value: rows.length, color: "text-foreground",       bg: "bg-muted/60" },
    { label: "Reprobados",    value: reprobados,  color: "text-destructive",      bg: "bg-destructive/10" },
    { label: "Vencidos",      value: vencidos,    color: "text-destructive",      bg: "bg-destructive/10" },
    { label: "Próximos 14 d", value: proximos,    color: "text-warning",          bg: "bg-warning/10" },
    { label: "Sin fecha",     value: sinFecha,    color: "text-muted-foreground", bg: "bg-muted/40" },
  ]

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(({ label, value, color, bg }) => (
        <div key={label} className={`rounded-xl p-3 ${bg} flex flex-col gap-1`}>
          <dd className={`text-2xl font-bold tabular-nums ${color}`}>{value}</dd>
          <dt className="text-xs text-muted-foreground">{label}</dt>
        </div>
      ))}
    </dl>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Status filter options (sin emojis — accesibles para screen readers)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string; dot?: string }[] = [
  { value: "all",       label: "Todos" },
  { value: "reprobado", label: `Reprobados (<${SCORE_THRESHOLD})`, dot: "bg-destructive" },
  { value: "vencido",   label: "Vencidos",                          dot: "bg-destructive" },
  { value: "proximo",   label: "Próximos (14 d)",                   dot: "bg-warning" },
  { value: "pendiente", label: "Pendientes",                        dot: "bg-muted-foreground" },
  { value: "sin_fecha", label: "Sin fecha",                         dot: "bg-border" },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function DesempenoSeguimiento() {
  useRole() // ensures auth guard if needed
  const shouldReduceMotion = useReducedMotion()

  const [rows, setRows] = useState<EvalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterPeriodo, setFilterPeriodo] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbErr } = await supabase
        .from("evaluaciones_desempeno")
        .select(`
          id,
          numero_empleado,
          evaluador_nombre,
          tipo,
          periodo,
          calificacion_final,
          compromisos,
          fecha_revision,
          created_at
        `)
        .not("compromisos", "is", null)
        .neq("compromisos", "")
        .order("calificacion_final", { ascending: true })

      if (dbErr) throw new Error(dbErr.message)

      // Enrich with nombre/puesto from employees or nuevo_ingreso tables
      const rawRows = (data ?? []) as Omit<EvalRow, "nombre" | "puesto">[]
      const numeros = [...new Set(rawRows.map(r => r.numero_empleado))]

      const nameMap: Record<string, { nombre: string; puesto: string }> = {}
      if (numeros.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("numero, nombre, puesto")
          .in("numero", numeros)

        for (const e of emps ?? []) {
          if (e.numero) nameMap[e.numero] = { nombre: e.nombre ?? "", puesto: e.puesto ?? "" }
        }

        // Fill gaps from nuevo_ingreso
        const missing = numeros.filter(n => !nameMap[n])
        if (missing.length > 0) {
          const { data: nis } = await supabase
            .from("nuevo_ingreso")
            .select("numero, nombre, puesto")
            .in("numero", missing)
          for (const e of nis ?? []) {
            if (e.numero) nameMap[e.numero] = { nombre: e.nombre ?? "", puesto: e.puesto ?? "" }
          }
        }
      }

      const enriched: EvalRow[] = rawRows.map(r => ({
        ...r,
        nombre: nameMap[r.numero_empleado]?.nombre || null,
        puesto: nameMap[r.numero_empleado]?.puesto || null,
      }))

      setRows(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows
      .filter(r => {
        if (!q) return true
        return (
          (r.nombre ?? "").toLowerCase().includes(q) ||
          r.numero_empleado.toLowerCase().includes(q) ||
          (r.puesto ?? "").toLowerCase().includes(q)
        )
      })
      .filter(r => filterPeriodo === "all" || r.periodo === filterPeriodo)
      .filter(r => {
        if (filterStatus === "all") return true
        if (filterStatus === "reprobado") return r.calificacion_final < SCORE_THRESHOLD
        return getRevisionStatus(r.fecha_revision) === filterStatus
      })
  }, [rows, search, filterPeriodo, filterStatus])

  const hasActiveFilters = search !== "" || filterPeriodo !== "all" || filterStatus !== "all"

  const clearFilters = () => {
    setSearch("")
    setFilterPeriodo("all")
    setFilterStatus("all")
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="space-y-5"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <Card className="bg-gradient-to-br from-destructive/5 to-warning/5 border-destructive/20">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
              <TrendingDown size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Seguimiento de Compromisos</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Evaluaciones con compromisos registrados. Reprobados
                (calificación &lt; {SCORE_THRESHOLD}) se muestran primero.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {!loading && rows.length > 0 && (
          <CardContent className="pt-0">
            <SummaryCards rows={rows} />
          </CardContent>
        )}
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              className="h-8 gap-1.5"
              data-testid="retry-load-button"
            >
              <RefreshCw size={13} aria-hidden="true" /> Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      {!loading && rows.length > 0 && (
        <div
          className="flex flex-col sm:flex-row gap-2"
          role="search"
          aria-label="Filtrar seguimiento de compromisos"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, número o puesto…"
              aria-label="Buscar empleado por nombre, número o puesto"
              className="pl-9 pr-9 bg-muted text-foreground"
              data-testid="seguimiento-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                data-testid="clear-search-button"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Periodo filter */}
          <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
            <SelectTrigger
              className="w-full sm:w-48 bg-muted text-foreground text-sm"
              aria-label="Filtrar por período"
              data-testid="filter-periodo-select"
            >
              <Filter size={13} className="mr-1 shrink-0 text-muted-foreground" aria-hidden="true" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los períodos</SelectItem>
              {ALL_PERIODOS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger
              className="w-full sm:w-44 bg-muted text-foreground text-sm"
              aria-label="Filtrar por estado de revisión"
              data-testid="filter-status-select"
            >
              <SelectValue placeholder="Estado revisión" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(({ value, label, dot }) => (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    {dot && (
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full ${dot}`}
                      />
                    )}
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={load}
            disabled={loading}
            aria-label="Recargar datos"
            className="shrink-0"
            data-testid="refresh-button"
          >
            <RefreshCw size={14} aria-hidden="true" className={loading ? "animate-spin" : undefined} />
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3" role="status" aria-live="polite" aria-label="Cargando evaluaciones">
          <span className="sr-only">Cargando evaluaciones…</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-7 w-10 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state — no data */}
      {!loading && rows.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 size={26} aria-hidden="true" />
          </div>
          <p className="text-base font-semibold text-foreground">¡Todo en orden!</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            No hay evaluaciones reprobadas con compromisos pendientes de seguimiento.
          </p>
        </div>
      )}

      {/* Empty state — filters too strict */}
      {!loading && rows.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <UserX size={28} className="text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No se encontraron resultados con los filtros actuales.
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-filters-button">
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Results */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
              {filtered.length} de {rows.length} registro{rows.length !== 1 ? "s" : ""}
            </p>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-muted-foreground"
              >
                <X size={12} aria-hidden="true" className="mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Mobile / tablet: cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map(row => (
              <EvalCard key={row.id} row={row} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block">
            <EvalTable rows={filtered} />
          </div>
        </div>
      )}
    </motion.div>
  )
}
