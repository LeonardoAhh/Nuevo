"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  CheckCircle2,
  ChevronRight,
  FilterX,
  Info,
  Search,
  XCircle,
  X,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { useRole } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { EmpleadoPromocion } from "@/lib/promociones/types"

import {
  isHabilitado,
  calcularAptitud,
} from "@/lib/promociones/utils"
import { PromDetalleDialog } from "./prom-detalle-dialog"
import { PromDesempenoDialog } from "./prom-desempeno-dialog"
import { PromPromoverDialog } from "./prom-promover-dialog"
import { PromReglasPreview, PromDatosPreview } from "./prom-import-tab"
import { usePromocionesImport } from "@/lib/hooks/usePromocionesImport"
import { DesktopTable, MobileList } from "./prom-table-rows"

// Re-export types for backward compat (page.tsx may import from here)
export type { AptitudStatus, CursoRequerido, ReglaPromocion, EvaluacionDesempeño, EmpleadoPromocion } from "@/lib/promociones/types"

const PAGE_SIZE = 30

export default function PromocionesContent({
  empleados,
  onDatosActualizados,
  guardarDesempeño,
  promoverEmpleado,
  guardarExamen,
}: {
  empleados: EmpleadoPromocion[]
  onDatosActualizados?: () => void
  guardarDesempeño?: (numero: string, calificacion: number, periodo?: string) => Promise<void>
  promoverEmpleado?: (empleadoId: string, numero: string | undefined, nuevoPuesto: string, datos: { fechaInicio?: string; fechaExamen?: string; calExamen?: number; intentosPrevios?: number }) => Promise<void>
  guardarExamen?: (numero: string, datos: { fechaInicio?: string; fechaExamen?: string; calExamen: number; intentosPrevios?: number }) => Promise<void>
}) {
  const { isReadOnly } = useRole()
  const [busqueda, setBusqueda] = useState("")
  const [filtroDept, setFiltroDept] = useState("todos")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroPuesto, setFiltroPuesto] = useState("todos")
  const [pagina, setPagina] = useState(1)
  const [empleadoDetalle, setEmpleadoDetalle] = useState<EmpleadoPromocion | null>(null)
  const [empleadoPromover, setEmpleadoPromover] = useState<EmpleadoPromocion | null>(null)
  const [empleadoDesempeño, setEmpleadoDesempeño] = useState<EmpleadoPromocion | null>(null)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const imp = usePromocionesImport(onDatosActualizados)

  const toggleExpand = useCallback((id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const departamentos = useMemo(
    () => [...new Set(empleados.map((e) => e.departamento))].sort(),
    [empleados]
  )
  const puestos = useMemo(
    () => [...new Set(empleados.map((e) => e.puesto))].sort(),
    [empleados]
  )

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

  React.useEffect(() => { setPagina(1) }, [busqueda, filtroDept, filtroStatus, filtroPuesto])

  const todosOrdenados = [...empleadosFiltrados.conCategoria, ...empleadosFiltrados.sinCategoria]
  const totalPaginas = Math.ceil(todosOrdenados.length / PAGE_SIZE)
  const paginados = todosOrdenados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const paginadosConCategoria = paginados.filter((e) => isHabilitado(e.puesto))
  const paginadosSinCategoria = paginados.filter((e) => !isHabilitado(e.puesto))

  const hasFilters = busqueda || filtroDept !== "todos" || filtroStatus !== "todos" || filtroPuesto !== "todos"

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-4">
      <ReadOnlyBanner />

      {/* Hidden file inputs */}
      <input ref={imp.fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={imp.handleFileChange} />
      <input ref={imp.datosFileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={imp.handleDatosFileChange} />

      {/* Import previews */}
      {imp.reglasPreview && (
        <PromReglasPreview
          reglasPreview={imp.reglasPreview}
          cargando={imp.cargando}
          isReadOnly={isReadOnly}
          onClose={() => imp.setReglasPreview(null)}
          onConfirmar={imp.handleCargarReglas}
        />
      )}
      {imp.datosPreview && (
        <PromDatosPreview
          datosPreview={imp.datosPreview}
          datosCargando={imp.datosCargando}
          isReadOnly={isReadOnly}
          onClose={() => imp.setDatosPreview(null)}
          onConfirmar={imp.handleCargarDatos}
        />
      )}

      {/* Toolbar compacto: search + filtros en 1 línea en desktop */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empleado, puesto, número..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`pl-8 h-9 w-full ${busqueda ? "pr-9" : ""}`}
          />
          {busqueda && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filtroDept} onValueChange={setFiltroDept}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Depto." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos deptos.</SelectItem>
              {departamentos.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroPuesto} onValueChange={setFiltroPuesto}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue placeholder="Puesto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos puestos</SelectItem>
              {puestos.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
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
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => { setBusqueda(""); setFiltroDept("todos"); setFiltroStatus("todos"); setFiltroPuesto("todos") }}
              aria-label="Limpiar filtros"
              title="Limpiar filtros"
            >
              <FilterX size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      {empleados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed bg-background">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <BarChart3 size={32} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Sin datos de empleados</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Carga los datos de empleados con sus evaluaciones de desempeño y el sistema calculará automáticamente la aptitud para promoción.
          </p>
        </div>
      ) : todosOrdenados.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Sin resultados para los filtros aplicados</div>
      ) : (
        <>
          <MobileList
            conCategoria={paginadosConCategoria}
            sinCategoria={paginadosSinCategoria}
            onPromover={setEmpleadoPromover}
            onDesempeño={setEmpleadoDesempeño}
          />

          <DesktopTable
            conCategoria={paginadosConCategoria}
            sinCategoria={paginadosSinCategoria}
            expandidos={expandidos}
            onToggleExpand={toggleExpand}
            onDetalle={setEmpleadoDetalle}
            onPromover={setEmpleadoPromover}
            onDesempeño={setEmpleadoDesempeño}
          />

          {totalPaginas > 1 && (
            <PaginationBar currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
          )}
        </>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-success" /> Criterio cumplido</div>
        <div className="flex items-center gap-1.5"><XCircle size={12} className="text-destructive" /> Criterio no cumplido</div>
        <div className="flex items-center gap-1.5"><Info size={12} /> Ver detalle completo</div>
        <div className="flex items-center gap-1.5"><ChevronRight size={12} /> Expandir cursos</div>
      </div>

      {/* Dialogs */}
      <PromDetalleDialog
        empleado={empleadoDetalle}
        open={!!empleadoDetalle}
        onClose={() => setEmpleadoDetalle(null)}
      />

      {empleadoPromover && (
        <PromPromoverDialog
          empleado={empleadoPromover}
          open={!!empleadoPromover}
          isReadOnly={isReadOnly}
          onClose={() => setEmpleadoPromover(null)}
          onConfirmarPromocion={async (datos) => {
            if (!empleadoPromover.regla?.promocionA) return
            await promoverEmpleado?.(
              empleadoPromover.id,
              empleadoPromover.numero,
              empleadoPromover.regla.promocionA,
              datos,
            )
          }}
          onSoloGuardarExamen={async (datos) => {
            if (!empleadoPromover.numero) return
            await guardarExamen?.(empleadoPromover.numero, datos)
          }}
        />
      )}

      {empleadoDesempeño && (
        <PromDesempenoDialog
          empleado={empleadoDesempeño}
          open={!!empleadoDesempeño}
          isReadOnly={isReadOnly}
          onClose={() => setEmpleadoDesempeño(null)}
          onGuardar={async (cal, periodo) => {
            if (!empleadoDesempeño.numero) throw new Error("El empleado no tiene N.N asignado")
            await guardarDesempeño?.(empleadoDesempeño.numero, cal, periodo || undefined)
          }}
        />
      )}
    </div>
    </TooltipProvider>
  )
}
