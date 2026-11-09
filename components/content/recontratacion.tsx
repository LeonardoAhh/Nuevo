"use client"

import { useCallback, useEffect, useId, useMemo, useReducer, useState } from "react"
import {
  AlertCircle,
  BarChart3,
  FileCheck2,
  ShieldAlert,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RecontratacionLft from "@/components/content/recontratacion-lft"
import { DetalleDialog } from "@/components/content/recontratacion-detail-dialog"
import { EmpleadoRow, Pagination, SkeletonRow } from "@/components/content/recontratacion-employee-row"
import { RecontratacionFilters } from "@/components/content/recontratacion-filters"
import {
  detalleReducer,
  PAGE_SIZE,
  SKELETON_COUNT,
  sortByTermino,
  type DetalleState,
} from "@/components/content/recontratacion-logic"
import { useNuevoIngreso, type NuevoIngreso } from "@/lib/hooks"
import { useRecontratacion } from "@/lib/hooks/useRecontratacion"

export default function RecontratacionContent() {
  const { loading, error, fetchAll } = useNuevoIngreso()
  const { buildRecontratacionData } = useRecontratacion()

  const [records, setRecords] = useState<NuevoIngreso[]>([])
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("all")
  const [page, setPage] = useState(1)
  const [detalleState, dispatchDetalle] = useReducer(
    detalleReducer,
    { status: "closed" } satisfies DetalleState,
  )

  const searchId = useId()

  const load = useCallback(async () => {
    setRecords(await fetchAll())
  }, [fetchAll])
  useEffect(() => {
    void load()
  }, [load])

  const departments = useMemo(
    () =>
      Array.from(
        new Set(records.map((record) => record.departamento).filter((department): department is string => !!department)),
      ).sort(),
    [records],
  )

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    return records
      .filter((record) => {
        if (record.tipo_contrato === "Indeterminado") return false
        const matchesSearch =
          !query ||
          record.nombre.toLowerCase().includes(query) ||
          (record.numero ?? "").toLowerCase().includes(query) ||
          (record.puesto ?? "").toLowerCase().includes(query) ||
          (record.departamento ?? "").toLowerCase().includes(query)
        const matchesDepartment = filterDept === "all" || record.departamento === filterDept
        return matchesSearch && matchesDepartment
      })
      .sort(sortByTermino)
  }, [records, search, filterDept])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  useEffect(() => {
    setPage(1)
  }, [search, filterDept])
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

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
  const clearFilters = () => {
    setSearch("")
    setFilterDept("all")
  }

  return (
    <Tabs defaultValue="vencimientos" className="space-y-4">
      <TabsList
        className="grid h-auto w-full grid-cols-2 p-1 md:w-auto"
        data-testid="recontratacion-tabs"
      >
        <TabsTrigger
          value="vencimientos"
          data-testid="tab-vencimientos"
          className="min-h-11 gap-2 px-3 py-0 text-sm"
        >
          <FileCheck2 className="size-4" aria-hidden="true" />
          <span>Vencimientos</span>
        </TabsTrigger>
        <TabsTrigger
          value="lft"
          data-testid="tab-lft"
          className="min-h-11 gap-2 px-3 py-0 text-sm"
        >
          <ShieldAlert className="size-4" aria-hidden="true" />
          <span>Baja LFT Art. 47</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="vencimientos" className="mt-0">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileCheck2 className="size-4 text-primary" aria-hidden="true" />
                Detalle de contratos
              </CardTitle>
              {!loading && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {filtered.length === records.length
                    ? `${records.length} empleados`
                    : `${filtered.length} de ${records.length}`}
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            <RecontratacionFilters
              search={search}
              onSearchChange={setSearch}
              searchId={searchId}
              departments={departments}
              filterDepartment={filterDept}
              onDepartmentChange={setFilterDept}
              hasFilters={hasFilters}
              onClear={clearFilters}
            />

            {loading ? (
              <ul
                className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
                aria-label="Cargando empleados"
              >
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                  <SkeletonRow key={index} />
                ))}
              </ul>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground md:py-16" role="status">
                <BarChart3 className="size-8 opacity-25" aria-hidden="true" />
                <p className="text-center text-sm">
                  {hasFilters
                    ? "Sin resultados para los filtros aplicados."
                    : "No hay empleados de nuevo ingreso."}
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
              <>
                <ul
                  className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
                  aria-label="Lista de empleados"
                >
                  {paged.map((record) => (
                    <EmpleadoRow
                      key={record.id}
                      record={record}
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
                    onPrev={() => setPage((current) => Math.max(1, current - 1))}
                    onNext={() => setPage((current) => Math.min(pageCount, current + 1))}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

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
