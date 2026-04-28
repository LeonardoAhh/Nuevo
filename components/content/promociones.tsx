"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  Star,
  Calendar,
  FilterX,
  Search,
  Info,
  TrendingUp,
  BarChart3,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useRole } from "@/lib/hooks"
import { ReadOnlyBanner } from "@/components/read-only-banner"
import { PaginationBar } from "@/components/ui/pagination-bar"
import type { EmpleadoPromocion } from "@/lib/promociones/types"

import {
  isHabilitado,
  calcularAptitud,
  mesesEnPuesto,
  porcentajeCursos,
  ultimaEvaluacion,
  formatMeses,
} from "@/lib/promociones/utils"
import { AptitudBadge } from "./prom-shared"
import { PromDetalleDialog } from "./prom-detalle-dialog"
import { PromDesempenoDialog } from "./prom-desempeno-dialog"
import { PromPromoverDialog } from "./prom-promover-dialog"
import { PromReglasPreview, PromDatosPreview } from "./prom-import-tab"
import { usePromocionesImport } from "@/lib/hooks/usePromocionesImport"

// Re-export types for backward compat (page.tsx may import from here)
export type { AptitudStatus, CursoRequerido, ReglaPromocion, EvaluacionDesempeño, EmpleadoPromocion } from "@/lib/promociones/types"

const PAGE_SIZE = 30
const LABEL_CLASS = "text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
const MIN_CLASS = "text-[11px] text-muted-foreground"

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

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-6">
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

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
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
              size="icon"
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
          {/* ── Vista móvil ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {paginadosConCategoria.map((emp) => (
              <MobileCard key={emp.id} emp={emp} onClick={() => setEmpleadoPromover(emp)} />
            ))}

            {paginadosSinCategoria.length > 0 && (
              <div className="flex items-center gap-2 py-1 px-1 mt-1">
                <div className="h-px flex-1 bg-muted" />
                <span className="text-xs text-muted-foreground">Categoría A / Sin categoría — inhabilitados</span>
                <div className="h-px flex-1 bg-muted" />
              </div>
            )}

            {paginadosSinCategoria.map((emp) => (
              <MobileCardInhabilitado key={emp.id} emp={emp} onDesempeño={() => setEmpleadoDesempeño(emp)} />
            ))}
          </div>

          {/* ── Vista desktop ── */}
          <div className="hidden md:block rounded-lg border overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 cursor-help">
                        <Calendar size={13} /> Temporalidad
                      </TooltipTrigger>
                      <TooltipContent>Tiempo en el puesto actual</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead><div className="flex items-center gap-1"><BookOpen size={13} /> Cursos</div></TableHead>
                  <TableHead><div className="flex items-center gap-1"><Star size={13} /> Evaluación</div></TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginadosConCategoria.map((emp) => (
                  <DesktopRow
                    key={emp.id}
                    emp={emp}
                    isExpanded={expandidos.has(emp.id)}
                    onToggleExpand={() => toggleExpand(emp.id)}
                    onDetalle={() => setEmpleadoDetalle(emp)}
                    onPromover={() => setEmpleadoPromover(emp)}
                  />
                ))}

                {paginadosSinCategoria.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-2 bg-muted/50">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Categoría A / Sin categoría — inhabilitados</span>
                    </TableCell>
                  </TableRow>
                )}

                {paginadosSinCategoria.map((emp) => (
                  <DesktopRowInhabilitado key={emp.id} emp={emp} onDesempeño={() => setEmpleadoDesempeño(emp)} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
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

// ─── Sub-componentes de fila ───────────────────────────────────────────────

function MobileCard({ emp, onClick }: { emp: EmpleadoPromocion; onClick: () => void }) {
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
      className="bg-background border rounded-xl px-4 py-3 cursor-pointer active:bg-muted/70 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground leading-tight">{emp.nombre}</div>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">{emp.puesto}</div>
        </div>
        <AptitudBadge status={aptitud} />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
        <span>{emp.departamento}</span>
        {emp.numero && <><span>·</span><span>#{emp.numero}</span></>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <MetricaMobile label="Temporalidad" cumple={cumpleTemp} valor={formatMeses(meses)} min={regla ? `mín ${formatMeses(regla.minTemporalidadMeses)}` : undefined} />
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>Cursos</span>
          <div className="flex items-center gap-1">
            {cumpleCursos !== null && (cumpleCursos ? <CheckCircle2 size={12} className="text-success shrink-0" /> : <XCircle size={12} className="text-destructive shrink-0" />)}
            <span className={`font-semibold ${pctCursos >= 80 ? "text-success" : pctCursos >= 50 ? "text-warning" : "text-destructive"}`}>{pctCursos}%</span>
            <span className="text-muted-foreground">({emp.cursosRequeridos.filter(c => c.completado).length}/{emp.cursosRequeridos.length})</span>
          </div>
          <Progress value={pctCursos} className="h-1 mt-0.5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>Evaluación</span>
          <div className="flex items-center gap-1">
            {evalActual ? (
              <>
                {cumpleEval !== null && (cumpleEval ? <CheckCircle2 size={12} className="text-success shrink-0" /> : <XCircle size={12} className="text-destructive shrink-0" />)}
                <span className={`font-bold ${evalActual.calificacion >= 80 ? "text-success" : evalActual.calificacion >= 60 ? "text-warning" : "text-destructive"}`}>{evalActual.calificacion}</span>
              </>
            ) : (
              <span className="italic text-muted-foreground">Sin evaluar</span>
            )}
          </div>
          {regla && <span className={MIN_CLASS}>mín {regla.minCalificacionEvaluacion}</span>}
        </div>
      </div>
    </div>
  )
}

function MetricaMobile({ label, cumple, valor, min }: { label: string; cumple: boolean | null; valor: string; min?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={LABEL_CLASS}>{label}</span>
      <div className="flex items-center gap-1">
        {cumple !== null && (cumple ? <CheckCircle2 size={12} className="text-success shrink-0" /> : <XCircle size={12} className="text-destructive shrink-0" />)}
        <span className="font-medium text-foreground">{valor}</span>
      </div>
      {min && <span className={MIN_CLASS}>{min}</span>}
    </div>
  )
}

function MobileCardInhabilitado({ emp, onDesempeño }: { emp: EmpleadoPromocion; onDesempeño: () => void }) {
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  return (
    <div className="bg-background border rounded-xl px-4 py-3 opacity-60 select-none">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground leading-tight">{emp.nombre}</div>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">{emp.puesto}</div>
        </div>
        <Badge variant="outline" className="text-xs text-muted-foreground border-border shrink-0">
          {/\s[A]$/i.test(emp.puesto.trim()) ? "Cat. A" : "Sin categoría"}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{emp.departamento}</span>
          {emp.numero && <><span>·</span><span>#{emp.numero}</span></>}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onDesempeño}
          aria-label="Capturar evaluación de desempeño"
          title={evalActual ? `Eval: ${evalActual.calificacion}` : "Eval"}
        >
          <Star size={13} />
        </Button>
      </div>
    </div>
  )
}

function DesktopRow({
  emp,
  isExpanded,
  onToggleExpand,
  onDetalle,
  onPromover,
}: {
  emp: EmpleadoPromocion
  isExpanded: boolean
  onToggleExpand: () => void
  onDetalle: () => void
  onPromover: () => void
}) {
  const aptitud = calcularAptitud(emp)
  const meses = mesesEnPuesto(emp.fechaIngresoPuesto)
  const pctCursos = porcentajeCursos(emp.cursosRequeridos)
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  const { regla } = emp
  const cumpleTemp   = regla ? meses >= regla.minTemporalidadMeses : null
  const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : null
  const cumpleEval   = regla && evalActual ? evalActual.calificacion >= regla.minCalificacionEvaluacion : null

  return (
    <React.Fragment>
      <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onPromover}>
        <TableCell className="pr-0" onClick={(e) => { e.stopPropagation(); onToggleExpand() }}>
          {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </TableCell>
        <TableCell>
          <div className="font-medium text-sm text-foreground">{emp.nombre}</div>
          <div className="text-xs text-muted-foreground">{emp.puesto}</div>
          {emp.numero && <div className="text-xs text-muted-foreground">#{emp.numero}</div>}
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">{emp.departamento}</span>
          {emp.area && <div className="text-xs text-muted-foreground">{emp.area}</div>}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            {cumpleTemp !== null && (cumpleTemp ? <CheckCircle2 size={13} className="text-success flex-shrink-0" /> : <XCircle size={13} className="text-destructive flex-shrink-0" />)}
            <span className="text-sm text-foreground whitespace-nowrap">{formatMeses(meses)}</span>
          </div>
          {regla && <div className="text-xs text-muted-foreground mt-0.5">mín {formatMeses(regla.minTemporalidadMeses)}</div>}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 mb-1">
            {cumpleCursos !== null && (cumpleCursos ? <CheckCircle2 size={13} className="text-success flex-shrink-0" /> : <XCircle size={13} className="text-destructive flex-shrink-0" />)}
            <span className={`text-sm font-semibold ${pctCursos >= 80 ? "text-success" : pctCursos >= 50 ? "text-warning" : "text-destructive"}`}>{pctCursos}%</span>
            <span className="text-xs text-muted-foreground">({emp.cursosRequeridos.filter((c) => c.completado).length}/{emp.cursosRequeridos.length})</span>
          </div>
          <Progress value={pctCursos} className="h-1.5 w-24" />
        </TableCell>
        <TableCell>
          {evalActual ? (
            <div className="flex items-center gap-1.5">
              {cumpleEval !== null && (cumpleEval ? <CheckCircle2 size={13} className="text-success flex-shrink-0" /> : <XCircle size={13} className="text-destructive flex-shrink-0" />)}
              <span className={`text-sm font-bold ${evalActual.calificacion >= 80 ? "text-success" : evalActual.calificacion >= 60 ? "text-warning" : "text-destructive"}`}>{evalActual.calificacion}</span>
              {evalActual.periodo && <span className="text-xs text-muted-foreground">{evalActual.periodo}</span>}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Sin evaluar</span>
          )}
          {regla && <div className="text-xs text-muted-foreground mt-0.5">mín {regla.minCalificacionEvaluacion}</div>}
        </TableCell>
        <TableCell><AptitudBadge status={aptitud} /></TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={onDetalle}
                  aria-label="Ver detalle del empleado"
                >
                  <Info size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalle</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 focus-visible:ring-2 focus-visible:ring-ring ${aptitud === "apto" ? "text-primary hover:text-primary" : "text-muted-foreground"}`}
                  onClick={onPromover}
                  aria-label={aptitud === "apto" ? "Promover empleado" : "Registrar examen"}
                >
                  <TrendingUp size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{aptitud === "apto" ? "Promover empleado" : "Registrar examen / intentar promoción"}</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/30">
          <TableCell></TableCell>
          <TableCell colSpan={7} className="py-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cursos requeridos</div>
            {emp.cursosRequeridos.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Sin cursos asignados para este puesto</span>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {emp.cursosRequeridos.map((curso) => (
                  <div key={curso.nombre} className={`flex items-center gap-2 text-xs rounded px-2 py-1.5 ${curso.completado ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
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
}

function DesktopRowInhabilitado({ emp, onDesempeño }: { emp: EmpleadoPromocion; onDesempeño: () => void }) {
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  return (
    <TableRow className="opacity-60">
      <TableCell />
      <TableCell>
        <div className="font-medium text-sm text-foreground">{emp.nombre}</div>
        <div className="text-xs text-muted-foreground">{emp.puesto}</div>
        {emp.numero && <div className="text-xs text-muted-foreground">#{emp.numero}</div>}
      </TableCell>
      <TableCell><span className="text-sm text-muted-foreground">{emp.departamento}</span></TableCell>
      <TableCell />
      <TableCell />
      <TableCell>
        {evalActual ? (
          <span className={`text-sm font-semibold ${evalActual.calificacion >= 80 ? "text-success" : evalActual.calificacion >= 60 ? "text-warning" : "text-destructive"}`}>{evalActual.calificacion}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin evaluar</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs text-muted-foreground border-border">
          {/\s[A]$/i.test(emp.puesto.trim()) ? "Cat. A" : "Sin categoría"}
        </Badge>
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-warning hover:text-warning/80 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onDesempeño}
              aria-label="Capturar evaluación de desempeño"
            >
              <Star size={15} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Capturar evaluación de desempeño</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}
