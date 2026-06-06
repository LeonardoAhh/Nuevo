"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search,
  CalendarDays,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNuevoIngreso } from "@/lib/hooks"
import type { NuevoIngreso } from "@/lib/hooks"
import { IncidenciasModal } from "@/components/content/incidencias-modal"

// ─── Helpers de semana ────────────────────────────────────────────────────────

/** Devuelve el lunes de la semana ISO que contiene la fecha dada */
function getWeekMonday(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay() // 0=Dom … 6=Sáb
  const diff = day === 0 ? -6 : 1 - day
  return new Date(y, m - 1, d + diff)
}

/** Convierte una Date a "YYYY-MM-DD" en hora local */
function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

/** Formatea una Date como "DD Mmm" (ej. "02 Jun") */
function formatShort(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")} ${MESES[date.getMonth()]}`
}

/** Devuelve el domingo de la misma semana que el lunes dado */
function getSunday(monday: Date): Date {
  return new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6,
  )
}

// ─── Ordenamiento de empleados ────────────────────────────────────────────────

/**
 * Ordena empleados por número de empleado de forma ascendente.
 * Registros sin número van al final.
 */
function sortByNumero(a: NuevoIngreso, b: NuevoIngreso): number {
  const na = a.numero ? parseInt(a.numero, 10) : Infinity
  const nb = b.numero ? parseInt(b.numero, 10) : Infinity

  if (!isFinite(na) && !isFinite(nb)) {
    return (a.numero ?? "").localeCompare(b.numero ?? "")
  }
  if (!isFinite(na)) return 1
  if (!isFinite(nb)) return -1
  return na - nb
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface WeekGroup {
  /** Lunes de la semana en formato "YYYY-MM-DD" (usado como key/id de tab) */
  key: string
  /** Etiqueta legible: "02 Jun – 08 Jun 2025" */
  label: string
  monday: Date
  sunday: Date
  employees: NuevoIngreso[]
}

// ─── Agrupación por semana ────────────────────────────────────────────────────

/** Agrupa los registros en semanas ISO (lunes–domingo), ordenadas más reciente primero */
function groupByWeek(records: NuevoIngreso[]): WeekGroup[] {
  const map = new Map<string, WeekGroup>()

  for (const r of records) {
    if (!r.fecha_ingreso) continue

    const monday = getWeekMonday(r.fecha_ingreso)
    const key = toISO(monday)

    if (!map.has(key)) {
      const sunday = getSunday(monday)
      // Incluye el año en el label si el domingo es de año distinto al lunes (cruce de año)
      const yearSuffix =
        monday.getFullYear() !== sunday.getFullYear()
          ? ` ${sunday.getFullYear()}`
          : ` ${monday.getFullYear()}`

      map.set(key, {
        key,
        label: `${formatShort(monday)} – ${formatShort(sunday)}${yearSuffix}`,
        monday,
        sunday,
        employees: [],
      })
    }

    map.get(key)!.employees.push(r)
  }

  // Más reciente primero
  return Array.from(map.values()).sort(
    (a, b) => b.monday.getTime() - a.monday.getTime(),
  )
}

// ─── Estado del modal de incidencias ─────────────────────────────────────────

interface IncidenciasState {
  open: boolean
  numero: string
  nombre: string
}

const INCIDENCIAS_INITIAL: IncidenciasState = {
  open: false,
  numero: "",
  nombre: "",
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function IngresosSemanalesContent() {
  const { loading, fetchAll } = useNuevoIngreso()
  const [records, setRecords] = useState<NuevoIngreso[]>([])
  const [search, setSearch] = useState("")

  // Modal de incidencias — siempre montado para conservar animaciones de salida
  const [incidencias, setIncidencias] =
    useState<IncidenciasState>(INCIDENCIAS_INITIAL)

  // ─── Carga inicial ──────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [fetchAll])

  useEffect(() => {
    load()
  }, [load])

  // ─── Filtro por búsqueda ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        (r.numero ?? "").toLowerCase().includes(q) ||
        (r.departamento ?? "").toLowerCase().includes(q) ||
        (r.area ?? "").toLowerCase().includes(q) ||
        (r.turno ?? "").toLowerCase().includes(q),
    )
  }, [records, search])

  // ─── Agrupación en semanas ──────────────────────────────────────────────

  const weeks = useMemo(() => groupByWeek(filtered), [filtered])

  // ─── Tab activo ─────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState("")

  // Ajusta el tab activo si las semanas cambian (ej. por filtro)
  useEffect(() => {
    if (weeks.length === 0) {
      setActiveTab("")
      return
    }
    const stillValid = weeks.some((w) => w.key === activeTab)
    if (!stillValid) setActiveTab(weeks[0].key)
  }, [weeks, activeTab])

  const activeIdx = weeks.findIndex((w) => w.key === activeTab)
  const activeWeek = weeks[activeIdx] ?? null

  // ─── Navegación entre semanas ───────────────────────────────────────────

  const canPrev = activeIdx > 0
  const canNext = activeIdx < weeks.length - 1

  const goToPrev = () => { if (canPrev) setActiveTab(weeks[activeIdx - 1].key) }
  const goToNext = () => { if (canNext) setActiveTab(weeks[activeIdx + 1].key) }

  // ─── Acciones del modal ─────────────────────────────────────────────────

  const handleOpenIncidencias = (r: NuevoIngreso) => {
    if (!r.numero) return
    setIncidencias({ open: true, numero: r.numero, nombre: r.nombre })
  }

  const handleCloseIncidencias = () => {
    setIncidencias((prev) => ({ ...prev, open: false }))
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Encabezado unificado: dos columnas (título+búsqueda | navegador) ── */}
      {/*
        Layout de dos columnas a partir de lg:
          · Izquierda (lg:w-72): título, descripción y barra de búsqueda
          · Derecha (flex-1): paginador de semanas con flechas
        En mobile/tablet se apilan verticalmente.
      */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">

            {/* ── Col. izquierda: título + búsqueda ───────────────────── */}
            <div className="flex flex-col gap-3 lg:w-72 lg:shrink-0">
              {/* Título y badge de totales */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-tight tracking-tight">
                    Ingresos Semanales
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Por semana
                  </p>
                </div>
                {/* Badge resumen — visible sólo cuando hay datos */}
                {weeks.length > 0 && (
                  <Badge variant="secondary" className="shrink-0 gap-1 self-start text-[11px]">
                    <Users className="h-3 w-3" />
                    {filtered.length} · {weeks.length}sem
                  </Badge>
                )}
              </div>

              {/* Barra de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar nombre, número, depto…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`pl-9 h-9 text-sm ${search ? "pr-9" : ""}`}
                  aria-label="Buscar empleados"
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
            </div>

            {/* Separador vertical — sólo en desktop */}
            <div className="hidden lg:block w-px self-stretch bg-border" />

            {/* ── Col. derecha: navegador de semanas ──────────────────── */}
            <div className="flex-1 flex flex-col justify-center gap-1.5">
              {weeks.length > 0 ? (
                <>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide hidden lg:block">
                    Semana
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-9 w-9"
                      disabled={!canPrev}
                      onClick={goToPrev}
                      aria-label="Semana anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Bloque central: ícono + rango + badge + posición */}
                    <div className="flex-1 flex items-center justify-center gap-2.5 rounded-md border border-border bg-muted/40 px-4 h-9 min-w-0">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {activeWeek?.label ?? "—"}
                      </span>
                      {activeWeek && (
                        <Badge variant="secondary" className="shrink-0 h-5 px-1.5 text-[10px]">
                          {activeWeek.employees.length}
                        </Badge>
                      )}
                      {weeks.length > 1 && (
                        <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                          {activeIdx + 1} / {weeks.length}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-9 w-9"
                      disabled={!canNext}
                      onClick={goToNext}
                      aria-label="Semana siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : loading ? (
                /* Skeleton del navegador mientras carga */
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-md shrink-0" />
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md shrink-0" />
                </div>
              ) : (
                /* Estado vacío inline */
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0 opacity-40" />
                  <span>
                    {records.length === 0
                      ? "Sin empleados registrados"
                      : "Sin resultados para la búsqueda"}
                  </span>
                  {search && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearch("")}
                      className="h-7 text-xs px-2"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Estado de carga de la tabla ──────────────────────────────────── */}
      {loading && (
        <Card>
          <CardContent className="p-0">
            <ul
              role="list"
              aria-busy="true"
              aria-label="Cargando empleados"
              className="divide-y divide-border"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <li key={`skeleton-row-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 w-16 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
                  <Skeleton className="h-5 w-20 rounded-full hidden md:block" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs de semanas ──────────────────────────────────────────────── */}
      {/*
        El estado vacío y el navegador de semanas viven ahora en el Card del encabezado.
        Este bloque sólo se renderiza cuando hay datos disponibles.
      */}
      {!loading && weeks.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* TabsList oculto — mantiene el contrato de Tabs/TabsContent */}
          <TabsList className="sr-only">
            {weeks.map((week) => (
              <TabsTrigger key={week.key} value={week.key}>
                {week.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Contenido de cada semana */}
          {weeks.map((week) => {
            const sorted = [...week.employees].sort(sortByNumero)

            return (
              <TabsContent key={week.key} value={week.key}>
                <Card>
                  <CardContent className="p-0">

                    {/* ── Mobile: lista de tarjetas ────────────────────── */}
                    <ul
                      role="list"
                      className="sm:hidden divide-y divide-border"
                      aria-label={`Empleados semana ${week.label}`}
                    >
                      {sorted.map((r) => (
                        <li key={r.id} className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              {r.numero && (
                                <p className="text-[11px] font-mono text-muted-foreground leading-none mb-0.5">
                                  #{r.numero}
                                </p>
                              )}
                              <p className="font-semibold text-sm leading-snug">
                                {r.nombre}
                              </p>
                            </div>

                            {r.numero && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label={`Ver incidencias de ${r.nombre}`}
                                onClick={() => handleOpenIncidencias(r)}
                              >
                                <CalendarDays className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {r.departamento && (
                              <Badge variant="secondary" className="text-[11px]">
                                {r.departamento}
                              </Badge>
                            )}
                            {r.area && (
                              <Badge variant="outline" className="text-[11px]">
                                {r.area}
                              </Badge>
                            )}
                            {r.turno && (
                              <Badge variant="outline" className="text-[11px]">
                                T{r.turno}
                              </Badge>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* ── Desktop: tabla ───────────────────────────────── */}
                    <div
                      className="hidden sm:block overflow-x-auto"
                      role="region"
                      aria-label={`Tabla de empleados semana ${week.label}`}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[90px]">Número</TableHead>
                            <TableHead className="min-w-[180px]">Nombre</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead className="hidden md:table-cell">Área</TableHead>
                            <TableHead className="hidden md:table-cell w-[80px]">
                              Turno
                            </TableHead>
                            <TableHead className="w-[60px] text-right">
                              <span className="sr-only">Acciones</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {sorted.map((r) => (
                            <TableRow key={r.id} className="hover:bg-muted/40">
                              <TableCell>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {r.numero ?? "—"}
                                </span>
                              </TableCell>

                              <TableCell>
                                <span className="font-medium text-sm">{r.nombre}</span>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {r.departamento ?? "—"}
                                </span>
                              </TableCell>

                              <TableCell className="hidden md:table-cell">
                                <span className="text-sm text-muted-foreground">
                                  {r.area ?? "—"}
                                </span>
                              </TableCell>

                              <TableCell className="hidden md:table-cell">
                                {r.turno ? (
                                  <Badge variant="secondary" className="text-xs">
                                    T{r.turno}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                {r.numero && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    aria-label={`Ver incidencias de ${r.nombre}`}
                                    title="Ver incidencias"
                                    onClick={() => handleOpenIncidencias(r)}
                                  >
                                    <CalendarDays className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen de la semana */}
                <p className="text-xs text-muted-foreground mt-3">
                  {week.employees.length}{" "}
                  {week.employees.length === 1 ? "empleado activo" : "empleados activos"}{" "}
                </p>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {/* ── Pie: rango de la semana activa ───────────────────────────────── */}
      {!loading && activeWeek && (
        <p className="text-xs text-muted-foreground mt-2">
          Semana del {formatShort(activeWeek.monday)} al{" "}
          {formatShort(activeWeek.sunday)} {activeWeek.monday.getFullYear()}
        </p>
      )}

      {/* ── Modal de incidencias ─────────────────────────────────────────── */}
      {/*
        Siempre montado para preservar estado interno y animaciones de salida.
        Cuando open=false el modal se oculta sin destruirse.
      */}
      <IncidenciasModal
        open={incidencias.open}
        onClose={handleCloseIncidencias}
        numeroEmpleado={incidencias.numero}
        nombreEmpleado={incidencias.nombre}
      />
    </>
  )
}
