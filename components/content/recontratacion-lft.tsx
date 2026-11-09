"use client"

import { useMemo, useState, useId } from "react"
import {
  AlertCircle,
  BarChart3,
  Filter,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CandidatoCard,
  LftSkeletonCard,
} from "@/components/content/recontratacion-lft-cards"
import { useLftArticulo47, type LftOrigen } from "@/lib/hooks/useLftArticulo47"
import { LFT_FALTAS_MIN, LFT_VENTANA_DIAS } from "@/lib/lft/articulo47"
import { cn } from "@/lib/utils"

const SKELETON_COUNT = 6

export default function RecontratacionLft() {
  const { loading, error, candidatos } = useLftArticulo47()
  const [search, setSearch] = useState("")
  const [filterOrigen, setFilterOrigen] = useState<"all" | LftOrigen>("all")
  const [filterDept, setFilterDept] = useState("all")
  const searchId = useId()

  const departments = useMemo(
    () =>
      Array.from(
        new Set(candidatos.map((candidate) => candidate.departamento).filter((department): department is string => !!department)),
      ).sort(),
    [candidatos],
  )

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    return candidatos.filter((candidate) => {
      const matchesSearch =
        !query ||
        candidate.nombre.toLowerCase().includes(query) ||
        candidate.numero.toLowerCase().includes(query) ||
        (candidate.puesto ?? "").toLowerCase().includes(query) ||
        (candidate.departamento ?? "").toLowerCase().includes(query)
      const matchesOrigin = filterOrigen === "all" || candidate.origen === filterOrigen
      const matchesDepartment = filterDept === "all" || candidate.departamento === filterDept
      return matchesSearch && matchesOrigin && matchesDepartment
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
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert className="mb-6 border-destructive/30 bg-destructive/5">
        <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
        <AlertDescription className="text-sm">
          <span className="font-semibold text-foreground">LFT Art. 47 Fracc. X.</span>{" "}
          Empleados con{" "}
          <strong className="text-destructive">
            ≥ {LFT_FALTAS_MIN} faltas injustificadas en {LFT_VENTANA_DIAS} días naturales
          </strong>{" "}
          consecutivos. Lista orientativa; la rescisión exige el procedimiento del Art. 47 LFT
          (aviso por escrito en 30 días).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
              Candidatos a baja
            </CardTitle>
            {!loading && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {filtered.length === candidatos.length
                  ? `${candidatos.length} empleado${candidatos.length === 1 ? "" : "s"}`
                  : `${filtered.length} de ${candidatos.length}`}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div
            className="flex flex-wrap items-center gap-3"
            role="search"
            aria-label="Filtros de candidatos LFT"
          >
            <div className="relative min-w-0 flex-1 basis-full md:basis-auto">
              <label htmlFor={searchId} className="sr-only">
                Buscar empleado
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id={searchId}
                placeholder="Nombre, número, puesto…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={cn("h-11 bg-card pl-10 text-sm", search && "pr-12")}
                data-testid="lft-search-input"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                  className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <Select
              value={filterOrigen}
              onValueChange={(value) => setFilterOrigen(value as "all" | LftOrigen)}
            >
              <SelectTrigger
                className="h-11 w-full gap-2 bg-card text-sm md:w-40"
                aria-label="Filtrar por origen"
                data-testid="lft-filter-origen"
              >
                <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
                className="h-11 w-full gap-2 bg-card text-sm md:w-48"
                aria-label="Filtrar por departamento"
                data-testid="lft-filter-depto"
              >
                <Filter className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Departamentos</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>{department}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-11 gap-2 px-3 py-0 text-sm md:ml-auto"
                onClick={clearFilters}
                aria-label="Limpiar todos los filtros"
                data-testid="lft-clear-filters"
              >
                <X className="size-4" aria-hidden="true" />
                Limpiar
              </Button>
            )}
          </div>

          {loading ? (
            <ul
              className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
              aria-label="Cargando candidatos"
            >
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <LftSkeletonCard key={index} />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground md:py-16"
              role="status"
              data-testid="lft-empty-state"
            >
              <BarChart3 className="size-8 opacity-25" aria-hidden="true" />
              <p className="text-center text-sm">
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
                  className="h-11 gap-2 px-3 py-0 text-sm"
                  onClick={clearFilters}
                >
                  Quitar filtros
                </Button>
              )}
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
              aria-label="Lista de candidatos"
              data-testid="lft-candidatos-list"
            >
              {filtered.map((candidate) => (
                <CandidatoCard
                  key={`${candidate.origen}-${candidate.numero}`}
                  candidato={candidate}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
