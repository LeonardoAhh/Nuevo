"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCalificaciones, type EmpleadoCalificaciones, type CalificacionCurso } from "@/lib/hooks/useCalificaciones"
import { PaginationBar } from "@/components/ui/pagination-bar"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(cal: number | null): string {
  if (cal === null) return "text-muted-foreground"
  if (cal >= 90) return "text-success"
  if (cal >= 70) return "text-chart-2"
  if (cal >= 60) return "text-warning"
  return "text-destructive"
}

function scoreBgClass(cal: number | null): string {
  if (cal === null) return "bg-muted text-muted-foreground"
  if (cal >= 90) return "bg-success/15 text-success border-success/30"
  if (cal >= 70) return "bg-chart-2/15 text-chart-2 border-chart-2/30"
  if (cal >= 60) return "bg-warning/15 text-warning border-warning/30"
  return "bg-destructive/15 text-destructive border-destructive/30"
}

function promedioLabel(cal: number | null): string {
  if (cal === null) return "Sin calificar"
  if (cal >= 90) return "Excelente"
  if (cal >= 70) return "Aprobado"
  if (cal >= 60) return "Regular"
  return "Reprobado"
}

function formatFecha(raw: string | null): string {
  if (!raw) return "—"
  try {
    return new Date(raw + "T00:00:00").toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return raw
  }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ScoreRing({ value }: { value: number | null }) {
  const pct = value ?? 0
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const stroke = circumference - (pct / 100) * circumference

  const ringColor =
    value === null
      ? "stroke-muted"
      : value >= 90
      ? "stroke-success"
      : value >= 70
      ? "stroke-chart-2"
      : value >= 60
      ? "stroke-warning"
      : "stroke-destructive"

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} strokeWidth="5" className="stroke-muted fill-none" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          strokeWidth="5"
          className={`fill-none transition-all duration-700 ${ringColor}`}
          strokeDasharray={circumference}
          strokeDashoffset={stroke}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-sm font-bold ${scoreColor(value)}`}>
        {value !== null ? value : "—"}
      </span>
    </div>
  )
}

function CourseRow({ course }: { course: CalificacionCurso }) {
  const name = course.course_name ?? course.raw_course_name
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <BookOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-xs text-foreground truncate" title={name}>
          {name}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{formatFecha(course.fecha_aplicacion)}</span>
        <span
          className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${scoreBgClass(course.calificacion)}`}
        >
          {course.calificacion !== null ? course.calificacion : "—"}
        </span>
      </div>
    </div>
  )
}

function EmpleadoCard({ emp }: { emp: EmpleadoCalificaciones }) {
  const [expanded, setExpanded] = useState(false)
  const topCourses = emp.cursos.slice(0, 3)
  const restCourses = emp.cursos.slice(3)

  return (
    <Card className="bg-card flex flex-col h-full border border-border/60 hover:border-primary/40 transition-colors duration-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-3">
          <ScoreRing value={emp.promedio} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate" title={emp.nombre}>
              {emp.nombre}
            </p>
            {emp.numero && (
              <p className="text-xs text-muted-foreground">#{emp.numero}</p>
            )}
            {emp.puesto && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{emp.puesto}</p>
            )}
            <Badge
              variant="outline"
              className={`mt-1.5 text-[10px] px-1.5 py-0 h-4 border ${scoreBgClass(emp.promedio)}`}
            >
              {promedioLabel(emp.promedio)}
            </Badge>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50">
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="h-3 w-3" />
            {emp.totalAprobados}
          </span>
          <span className="flex items-center gap-1 text-xs text-destructive">
            <XCircle className="h-3 w-3" />
            {emp.totalReprobados}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {emp.totalPendientes}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {emp.cursos.length} cursos
          </span>
        </div>

        {/* Progress bar — aprobados / total (excluding pending) */}
        {emp.cursos.length > 0 && (
          <Progress
            value={
              emp.totalAprobados + emp.totalReprobados > 0
                ? Math.round((emp.totalAprobados / (emp.totalAprobados + emp.totalReprobados)) * 100)
                : 0
            }
            className="h-1 mt-2"
          />
        )}
      </CardHeader>

      {emp.cursos.length > 0 && (
        <CardContent className="px-4 pb-3 flex-1">
          <div className="space-y-0">
            {topCourses.map((c) => (
              <CourseRow key={c.id} course={c} />
            ))}
            {restCourses.length > 0 && expanded &&
              restCourses.map((c) => <CourseRow key={c.id} course={c} />)}
          </div>
          {restCourses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 h-6 text-xs text-muted-foreground gap-1"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> +{restCourses.length} más
                </>
              )}
            </Button>
          )}
        </CardContent>
      )}

      {emp.cursos.length === 0 && (
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground italic">Sin cursos registrados.</p>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Stats summary ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-lg border border-border/60 px-4 py-3">
      <div className={`p-2 rounded-md ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortKey = "nombre" | "promedio-desc" | "promedio-asc" | "cursos"

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalificacionesMural() {
  const { data, loading, error, fetch } = useCalificaciones()
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("nombre")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch()
  }, [fetch])

  const departments = useMemo(() => {
    const depts = new Set(data.map((e) => e.departamento).filter(Boolean) as string[])
    return Array.from(depts).sort()
  }, [data])

  const filtered = useMemo(() => {
    let list = data.filter((e) => {
      const q = search.toLowerCase()
      return (
        e.nombre.toLowerCase().includes(q) ||
        (e.numero ?? "").toLowerCase().includes(q) ||
        (e.puesto ?? "").toLowerCase().includes(q) ||
        (e.departamento ?? "").toLowerCase().includes(q)
      )
    })

    if (filterDept !== "all") {
      list = list.filter((e) => e.departamento === filterDept)
    }

    list = [...list].sort((a, b) => {
      if (sortKey === "nombre") return a.nombre.localeCompare(b.nombre)
      if (sortKey === "promedio-desc") return (b.promedio ?? -1) - (a.promedio ?? -1)
      if (sortKey === "promedio-asc") return (a.promedio ?? 101) - (b.promedio ?? 101)
      if (sortKey === "cursos") return b.cursos.length - a.cursos.length
      return 0
    })

    return list
  }, [data, search, filterDept, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, filterDept, sortKey])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card">
        <CardContent className="pt-4 pb-3 space-y-2">
          {/* Search — full width always */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ..."
              className={`pl-9 bg-muted text-foreground ${search ? "pr-9" : ""}`}
            />
            {search && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters row — 2-col grid on mobile, inline on sm+ */}
          <div className="flex items-center gap-2">
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="flex-1 sm:w-48 sm:flex-none bg-muted text-sm">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="flex-1 sm:w-44 sm:flex-none bg-muted text-sm">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nombre">Nombre A–Z</SelectItem>
                <SelectItem value="promedio-desc">Mayor calificación</SelectItem>
                <SelectItem value="promedio-asc">Menor calificación</SelectItem>
                <SelectItem value="cursos">Más cursos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetch}
              disabled={loading}
              title="Actualizar"
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Mostrando {filtered.length} de {data.length} empleados
          </p>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm">
            {data.length === 0 ? "Sin datos de empleados." : "Sin resultados para la búsqueda."}
          </p>
        </div>
      )}

      {/* Mural grid */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((emp) => (
              <EmpleadoCard key={emp.id} emp={emp} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
