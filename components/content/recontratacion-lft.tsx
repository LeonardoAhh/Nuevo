"use client"

import { useMemo, useState, useId } from "react"
import {
  Search, X, Filter, AlertCircle, ShieldAlert, Users,
  CalendarRange, ChevronDown, ChevronUp, BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useLftArticulo47, type LftCandidato, type LftOrigen } from "@/lib/hooks/useLftArticulo47"
import {
  LFT_FALTAS_MIN, LFT_VENTANA_DIAS,
} from "@/lib/lft/articulo47"
import { formatDate } from "@/lib/hooks"
import { cn } from "@/lib/utils"

// ─── Constantes locales ──────────────────────────────────────────────────────

const SKELETON_COUNT = 6

const ORIGEN_LABEL: Record<LftOrigen, string> = {
  planta: "Planta",
  nuevo_ingreso: "Nuevo ingreso",
}

const ORIGEN_BADGE_CLASS: Record<LftOrigen, string> = {
  planta: "bg-muted text-muted-foreground border-border",
  nuevo_ingreso: "bg-primary/10 text-primary border-primary/30",
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, tone,
}: {
  icon: React.ElementType
  label: string
  value: number
  tone: "destructive" | "muted" | "primary"
}) {
  const toneClasses: Record<typeof tone, { icon: string; value: string }> = {
    destructive: { icon: "text-destructive", value: "text-destructive" },
    primary:     { icon: "text-primary",     value: "text-foreground"  },
    muted:       { icon: "text-muted-foreground", value: "text-foreground" },
  }
  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <div className={cn("rounded-md bg-muted p-1.5 shrink-0", toneClasses[tone].icon)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className={cn("text-lg font-semibold leading-tight tabular-nums", toneClasses[tone].value)}>
          {value}
        </p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <li
      className="flex flex-col gap-2.5 rounded-lg border bg-card p-3"
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-4 w-2/3" />
    </li>
  )
}

function CandidatoCard({ candidato }: { candidato: LftCandidato }) {
  const [expanded, setExpanded] = useState(false)
  const fechasId = useId()
  const ventana = candidato.evaluacion.ventana!

  return (
    <li
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border bg-card p-3",
        "border-t-2 border-t-destructive transition-colors hover:bg-accent/20",
      )}
      data-testid={`lft-card-${candidato.numero}`}
      aria-label={`${candidato.nombre}, candidato a baja por LFT Art. 47`}
    >
      {/* Header: nombre + numero */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
            {candidato.nombre}
          </p>
          {candidato.puesto && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {candidato.puesto}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 tabular-nums pt-0.5">
          #{candidato.numero}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/30"
          data-testid={`lft-badge-${candidato.numero}`}
        >
          <ShieldAlert className="h-3 w-3" aria-hidden="true" />
          Baja LFT Art. 47
        </span>
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md border",
            ORIGEN_BADGE_CLASS[candidato.origen],
          )}
        >
          {ORIGEN_LABEL[candidato.origen]}
        </span>
        {candidato.departamento && (
          <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground max-w-[140px] truncate">
            {candidato.departamento}
          </span>
        )}
        {candidato.turno && (
          <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
            T{candidato.turno}
          </span>
        )}
      </div>

      <hr className="border-border/50" />

      {/* Detalle de la ventana */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <CalendarRange className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p>
            <span className="font-semibold text-foreground tabular-nums">
              {ventana.conteo}
            </span>{" "}
            faltas injustificadas en{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {LFT_VENTANA_DIAS} días
            </span>
          </p>
          <p className="text-[11px] mt-0.5">
            {formatDate(ventana.inicio)} → {formatDate(ventana.fin)}
          </p>
        </div>
      </div>

      {/* Toggle de fechas */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[11px] gap-1 -mx-1 justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={fechasId}
        data-testid={`lft-toggle-${candidato.numero}`}
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        )}
        {expanded ? "Ocultar fechas" : `Ver fechas (${candidato.evaluacion.totalFaltas} totales)`}
      </Button>

      {expanded && (
        <div
          id={fechasId}
          className="rounded-md border bg-muted/30 p-2 space-y-1.5"
          data-testid={`lft-fechas-${candidato.numero}`}
        >
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Faltas en la ventana detectada
          </p>
          <ul className="flex flex-wrap gap-1">
            {ventana.fechas.map((f) => (
              <li
                key={f}
                className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-destructive/10 text-destructive"
              >
                {formatDate(f)}
              </li>
            ))}
          </ul>
          {candidato.evaluacion.fechasFaltas.length > ventana.fechas.length && (
            <>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium pt-1.5">
                Otras faltas en el histórico
              </p>
              <ul className="flex flex-wrap gap-1">
                {candidato.evaluacion.fechasFaltas
                  .filter((f) => !ventana.fechas.includes(f))
                  .map((f) => (
                    <li
                      key={f}
                      className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {formatDate(f)}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function RecontratacionLft() {
  const { loading, error, candidatos } = useLftArticulo47()
  const [search, setSearch] = useState("")
  const [filterOrigen, setFilterOrigen] = useState<"all" | LftOrigen>("all")
  const [filterDept, setFilterDept] = useState("all")
  const searchId = useId()

  const departments = useMemo(
    () =>
      Array.from(
        new Set(candidatos.map((c) => c.departamento).filter((d): d is string => !!d)),
      ).sort(),
    [candidatos],
  )

  const stats = useMemo(() => {
    let planta = 0
    let nuevos = 0
    for (const c of candidatos) {
      if (c.origen === "planta") planta++
      else nuevos++
    }
    return { total: candidatos.length, planta, nuevos }
  }, [candidatos])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return candidatos.filter((c) => {
      const matchSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        c.numero.toLowerCase().includes(q) ||
        (c.puesto ?? "").toLowerCase().includes(q) ||
        (c.departamento ?? "").toLowerCase().includes(q)
      const matchOrigen = filterOrigen === "all" || c.origen === filterOrigen
      const matchDept = filterDept === "all" || c.departamento === filterDept
      return matchSearch && matchOrigen && matchDept
    })
  }, [candidatos, search, filterOrigen, filterDept])

  const hasFilters = search.trim() !== "" || filterOrigen !== "all" || filterDept !== "all"
  const clearFilters = () => {
    setSearch("")
    setFilterOrigen("all")
    setFilterDept("all")
  }

  return (
    <div data-testid="recontratacion-lft-view">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Disclaimer legal */}
      <Alert className="mb-4 border-destructive/30 bg-destructive/5">
        <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" />
        <AlertDescription className="text-xs">
          <span className="font-semibold text-foreground">LFT Art. 47 Fracc. X.</span>{" "}
          Empleados con <strong className="text-destructive">≥ {LFT_FALTAS_MIN} faltas injustificadas
          en {LFT_VENTANA_DIAS} días naturales</strong> consecutivos. Lista orientativa;
          la rescisión exige el procedimiento del Art. 47 LFT (aviso por escrito en 30 días).
        </AlertDescription>
      </Alert>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2 mb-5" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-lg" />
          ))}
        </div>
      ) : (
        candidatos.length > 0 && (
          <div
            className="grid grid-cols-3 gap-2 mb-5"
            aria-label="Resumen de candidatos LFT"
          >
            <StatCard icon={ShieldAlert} label="Candidatos" value={stats.total}  tone="destructive" />
            <StatCard icon={Users}       label="Planta"     value={stats.planta} tone="muted" />
            <StatCard icon={Users}       label="Nuevo ing." value={stats.nuevos} tone="primary" />
          </div>
        )
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" />
              Candidatos a baja
            </CardTitle>
            {!loading && (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {filtered.length === candidatos.length
                  ? `${candidatos.length} empleado${candidatos.length === 1 ? "" : "s"}`
                  : `${filtered.length} de ${candidatos.length}`}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Filtros */}
          <div
            className="flex flex-wrap items-center gap-2"
            role="search"
            aria-label="Filtros de candidatos LFT"
          >
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
                onChange={(e) => setSearch(e.target.value)}
                className={cn("pl-9 h-9 bg-muted/50 text-sm", search && "pr-9")}
                data-testid="lft-search-input"
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

            <Select
              value={filterOrigen}
              onValueChange={(v) => setFilterOrigen(v as "all" | LftOrigen)}
            >
              <SelectTrigger
                className="h-9 min-w-[140px] w-auto bg-muted/50 text-sm gap-1.5"
                aria-label="Filtrar por origen"
                data-testid="lft-filter-origen"
              >
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="planta">Planta</SelectItem>
                <SelectItem value="nuevo_ingreso">Nuevo ingreso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger
                className="h-9 min-w-[150px] w-auto bg-muted/50 text-sm gap-1.5"
                aria-label="Filtrar por departamento"
                data-testid="lft-filter-depto"
              >
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={clearFilters}
                aria-label="Limpiar todos los filtros"
                data-testid="lft-clear-filters"
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
              aria-label="Cargando candidatos"
            >
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground gap-3"
              role="status"
              data-testid="lft-empty-state"
            >
              <BarChart3 className="h-8 w-8 opacity-25" aria-hidden="true" />
              <p className="text-sm text-center">
                {hasFilters
                  ? "Sin resultados para los filtros aplicados."
                  : candidatos.length === 0
                    ? "Ningún empleado cumple el supuesto del Art. 47 Fracc. X."
                    : "Sin resultados."}
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
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5"
              aria-label="Lista de candidatos"
              data-testid="lft-candidatos-list"
            >
              {filtered.map((c) => (
                <CandidatoCard key={`${c.origen}-${c.numero}`} candidato={c} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
