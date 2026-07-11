"use client"

import React from "react"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EmpleadoPromocion } from "@/lib/promociones/types"
import {
  calcularAptitud,
  formatMeses,
  mesesEnPuesto,
  porcentajeCursos,
  ultimaEvaluacion,
} from "@/lib/promociones/utils"
import { AptitudBadge } from "./prom-shared"

// ─── Constants ──────────────────────────────────────────────────────────────

const LABEL_CLASS = "text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
const MIN_CLASS = "text-[11px] text-muted-foreground"

// ─── Desktop Table ──────────────────────────────────────────────────────────

export function DesktopTable({
  conCategoria,
  sinCategoria,
  expandidos,
  onToggleExpand,
  onDetalle,
  onPromover,
  onDesempeño,
}: {
  conCategoria: EmpleadoPromocion[]
  sinCategoria: EmpleadoPromocion[]
  expandidos: Set<string>
  onToggleExpand: (id: string) => void
  onDetalle: (emp: EmpleadoPromocion) => void
  onPromover: (emp: EmpleadoPromocion) => void
  onDesempeño: (emp: EmpleadoPromocion) => void
}) {
  return (
    <div className="hidden md:block rounded-lg border overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="w-8" />
            <TableHead>Empleado</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1 cursor-help">
                  Temporalidad
                </TooltipTrigger>
                <TooltipContent>Tiempo en el puesto actual</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead>Cursos</TableHead>
            <TableHead>Evaluación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {conCategoria.map((emp) => (
            <DesktopRow
              key={emp.id}
              emp={emp}
              isExpanded={expandidos.has(emp.id)}
              onToggleExpand={() => onToggleExpand(emp.id)}
              onDetalle={() => onDetalle(emp)}
              onPromover={() => onPromover(emp)}
            />
          ))}
          {sinCategoria.length > 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-2 bg-muted/50">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Categoría A / Sin categoría — inhabilitados
                </span>
              </TableCell>
            </TableRow>
          )}
          {sinCategoria.map((emp) => (
            <DesktopRowInhabilitado
              key={emp.id}
              emp={emp}
              onDesempeño={() => onDesempeño(emp)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Mobile List ────────────────────────────────────────────────────────────

export function MobileList({
  conCategoria,
  sinCategoria,
  onPromover,
  onDesempeño,
}: {
  conCategoria: EmpleadoPromocion[]
  sinCategoria: EmpleadoPromocion[]
  onPromover: (emp: EmpleadoPromocion) => void
  onDesempeño: (emp: EmpleadoPromocion) => void
}) {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      {conCategoria.map((emp) => (
        <MobileCard key={emp.id} emp={emp} onClick={() => onPromover(emp)} />
      ))}
      {sinCategoria.length > 0 && (
        <div className="flex items-center gap-2 py-1 px-1 mt-1">
          <div className="h-px flex-1 bg-muted" />
          <span className="text-xs text-muted-foreground">
            Categoría A / Sin categoría — inhabilitados
          </span>
          <div className="h-px flex-1 bg-muted" />
        </div>
      )}
      {sinCategoria.map((emp) => (
        <MobileCardInhabilitado
          key={emp.id}
          emp={emp}
          onDesempeño={() => onDesempeño(emp)}
        />
      ))}
    </div>
  )
}

// ─── Desktop Row ────────────────────────────────────────────────────────────

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
  const cumpleTemp = regla ? meses >= regla.minTemporalidadMeses : null
  const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : null
  const cumpleEval =
    regla && evalActual
      ? evalActual.calificacion >= regla.minCalificacionEvaluacion
      : null

  return (
    <React.Fragment>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onPromover}
      >
        <TableCell
          className="pr-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
        >
          {isExpanded ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
        </TableCell>
        <TableCell>
          <div className="font-medium text-sm text-foreground">{emp.nombre}</div>
          <div className="text-xs text-muted-foreground">{emp.puesto}</div>
          {emp.numero && (
            <div className="text-xs text-muted-foreground">#{emp.numero}</div>
          )}
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">{emp.departamento}</span>
          {emp.area && (
            <div className="text-xs text-muted-foreground">{emp.area}</div>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            {cumpleTemp !== null &&
              (cumpleTemp ? (
                <CheckCircle2 size={13} className="text-success flex-shrink-0" />
              ) : (
                <XCircle size={13} className="text-destructive flex-shrink-0" />
              ))}
            <span className="text-sm text-foreground whitespace-nowrap">
              {formatMeses(meses)}
            </span>
          </div>
          {regla && (
            <div className="text-xs text-muted-foreground mt-0.5">
              mín {formatMeses(regla.minTemporalidadMeses)}
            </div>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 mb-1">
            {cumpleCursos !== null &&
              (cumpleCursos ? (
                <CheckCircle2 size={13} className="text-success flex-shrink-0" />
              ) : (
                <XCircle size={13} className="text-destructive flex-shrink-0" />
              ))}
            <span
              className={`text-sm font-semibold ${pctCursos >= 80 ? "text-success" : pctCursos >= 50 ? "text-warning" : "text-destructive"}`}
            >
              {pctCursos}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({emp.cursosRequeridos.filter((c) => c.completado).length}/
              {emp.cursosRequeridos.length})
            </span>
          </div>
          <Progress value={pctCursos} className="h-1.5 w-24" />
        </TableCell>
        <TableCell>
          {evalActual ? (
            <div className="flex items-center gap-1.5">
              {cumpleEval !== null &&
                (cumpleEval ? (
                  <CheckCircle2
                    size={13}
                    className="text-success flex-shrink-0"
                  />
                ) : (
                  <XCircle
                    size={13}
                    className="text-destructive flex-shrink-0"
                  />
                ))}
              <span
                className={`text-sm font-bold ${evalActual.calificacion >= 80 ? "text-success" : evalActual.calificacion >= 60 ? "text-warning" : "text-destructive"}`}
              >
                {evalActual.calificacion}
              </span>
              {evalActual.periodo && (
                <span className="text-xs text-muted-foreground">
                  {evalActual.periodo}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Sin evaluar
            </span>
          )}
          {regla && (
            <div className="text-xs text-muted-foreground mt-0.5">
              mín {regla.minCalificacionEvaluacion}
            </div>
          )}
        </TableCell>
        <TableCell>
          <AptitudBadge status={aptitud} />
        </TableCell>
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
                  aria-label={
                    aptitud === "apto"
                      ? "Promover empleado"
                      : "Registrar examen"
                  }
                >
                  <TrendingUp size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {aptitud === "apto"
                  ? "Promover empleado"
                  : "Registrar examen / intentar promoción"}
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/30">
          <TableCell />
          <TableCell colSpan={7} className="py-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Cursos requeridos
            </div>
            {emp.cursosRequeridos.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                Sin cursos asignados para este puesto
              </span>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {emp.cursosRequeridos.map((curso) => (
                  <div
                    key={curso.nombre}
                    className={`flex items-center gap-2 text-xs rounded px-2 py-1.5 ${curso.completado ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                  >
                    {curso.completado ? (
                      <CheckCircle2 size={12} className="flex-shrink-0" />
                    ) : (
                      <XCircle size={12} className="flex-shrink-0" />
                    )}
                    <span className="truncate">{curso.nombre}</span>
                    {curso.calificacion !== undefined && (
                      <span className="ml-auto font-semibold">
                        {curso.calificacion}
                      </span>
                    )}
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

// ─── Desktop Row Inhabilitado ───────────────────────────────────────────────

function DesktopRowInhabilitado({
  emp,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onDesempeño: () => void
}) {
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  return (
    <TableRow className="opacity-60">
      <TableCell />
      <TableCell>
        <div className="font-medium text-sm text-foreground">{emp.nombre}</div>
        <div className="text-xs text-muted-foreground">{emp.puesto}</div>
        {emp.numero && (
          <div className="text-xs text-muted-foreground">#{emp.numero}</div>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{emp.departamento}</span>
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell>
        {evalActual ? (
          <span
            className={`text-sm font-semibold ${evalActual.calificacion >= 80 ? "text-success" : evalActual.calificacion >= 60 ? "text-warning" : "text-destructive"}`}
          >
            {evalActual.calificacion}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground">
            Sin evaluar
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="text-xs text-muted-foreground border-border"
        >
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

// ─── Mobile Card ────────────────────────────────────────────────────────────

function MobileCard({
  emp,
  onClick,
}: {
  emp: EmpleadoPromocion
  onClick: () => void
}) {
  const aptitud = calcularAptitud(emp)
  const meses = mesesEnPuesto(emp.fechaIngresoPuesto)
  const pctCursos = porcentajeCursos(emp.cursosRequeridos)
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  const { regla } = emp
  const cumpleTemp = regla ? meses >= regla.minTemporalidadMeses : null
  const cumpleCursos = regla ? pctCursos >= regla.minPorcentajeCursos : null
  const cumpleEval =
    regla && evalActual
      ? evalActual.calificacion >= regla.minCalificacionEvaluacion
      : null

  return (
    <div
      className="bg-background border rounded-xl px-4 py-3 cursor-pointer active:bg-muted/70 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground leading-tight">
            {emp.nombre}
          </div>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">
            {emp.puesto}
          </div>
        </div>
        <AptitudBadge status={aptitud} />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
        <span>{emp.departamento}</span>
        {emp.numero && (
          <>
            <span>·</span>
            <span>#{emp.numero}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <MetricaMobile
          label="Temporalidad"
          cumple={cumpleTemp}
          valor={formatMeses(meses)}
          min={regla ? `mín ${formatMeses(regla.minTemporalidadMeses)}` : undefined}
        />
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>Cursos</span>
          <div className="flex items-center gap-1">
            {cumpleCursos !== null &&
              (cumpleCursos ? (
                <CheckCircle2 size={12} className="text-success shrink-0" />
              ) : (
                <XCircle size={12} className="text-destructive shrink-0" />
              ))}
            <span
              className={`font-semibold ${pctCursos >= 80 ? "text-success" : pctCursos >= 50 ? "text-warning" : "text-destructive"}`}
            >
              {pctCursos}%
            </span>
            <span className="text-muted-foreground">
              ({emp.cursosRequeridos.filter((c) => c.completado).length}/
              {emp.cursosRequeridos.length})
            </span>
          </div>
          <Progress value={pctCursos} className="h-1 mt-0.5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>Evaluación</span>
          <div className="flex items-center gap-1">
            {evalActual ? (
              <>
                {cumpleEval !== null &&
                  (cumpleEval ? (
                    <CheckCircle2 size={12} className="text-success shrink-0" />
                  ) : (
                    <XCircle size={12} className="text-destructive shrink-0" />
                  ))}
                <span
                  className={`font-bold ${evalActual.calificacion >= 80 ? "text-success" : evalActual.calificacion >= 60 ? "text-warning" : "text-destructive"}`}
                >
                  {evalActual.calificacion}
                </span>
              </>
            ) : (
              <span className="italic text-muted-foreground">Sin evaluar</span>
            )}
          </div>
          {regla && (
            <span className={MIN_CLASS}>mín {regla.minCalificacionEvaluacion}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Metric ──────────────────────────────────────────────────────────

function MetricaMobile({
  label,
  cumple,
  valor,
  min,
}: {
  label: string
  cumple: boolean | null
  valor: string
  min?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={LABEL_CLASS}>{label}</span>
      <div className="flex items-center gap-1">
        {cumple !== null &&
          (cumple ? (
            <CheckCircle2 size={12} className="text-success shrink-0" />
          ) : (
            <XCircle size={12} className="text-destructive shrink-0" />
          ))}
        <span className="font-medium text-foreground">{valor}</span>
      </div>
      {min && <span className={MIN_CLASS}>{min}</span>}
    </div>
  )
}

// ─── Mobile Card Inhabilitado ───────────────────────────────────────────────

function MobileCardInhabilitado({
  emp,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onDesempeño: () => void
}) {
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  return (
    <div className="bg-background border rounded-xl px-4 py-3 opacity-60 select-none">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground leading-tight">
            {emp.nombre}
          </div>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">
            {emp.puesto}
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-xs text-muted-foreground border-border shrink-0"
        >
          {/\s[A]$/i.test(emp.puesto.trim()) ? "Cat. A" : "Sin categoría"}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{emp.departamento}</span>
          {emp.numero && (
            <>
              <span>·</span>
              <span>#{emp.numero}</span>
            </>
          )}
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
