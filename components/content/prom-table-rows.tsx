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
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const LABEL_CLASS = "text-xs font-medium text-muted-foreground uppercase tracking-wide"
const MIN_CLASS = "text-xs text-muted-foreground"

// ─── Desktop Table ──────────────────────────────────────────────────────────

export function DesktopTable({
  conCategoria,
  sinCategoria,
  onDetalle,
  onPromover,
  onDesempeño,
}: {
  conCategoria: EmpleadoPromocion[]
  sinCategoria: EmpleadoPromocion[]
  onDetalle: (emp: EmpleadoPromocion) => void
  onPromover: (emp: EmpleadoPromocion) => void
  onDesempeño: (emp: EmpleadoPromocion) => void
}) {
  return (
    <div className="hidden md:block rounded-lg border overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Empleado</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead className="text-center">
              <Tooltip>
                <TooltipTrigger className="mx-auto flex items-center gap-1 cursor-default">
                  Temporalidad
                </TooltipTrigger>
                <TooltipContent>Tiempo en el puesto actual</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="text-center">Cursos</TableHead>
            <TableHead className="text-center">Desempeño</TableHead>
            <TableHead className="text-center">Examen</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[88px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conCategoria.map((emp) => (
            <DesktopRow
              key={emp.id}
              emp={emp}
              onDetalle={() => onDetalle(emp)}
              onPromover={() => onPromover(emp)}
              onDesempeño={() => onDesempeño(emp)}
            />
          ))}
          {sinCategoria.length > 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-2 bg-muted/50">
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
  onDetalle,
  onPromover,
  onDesempeño,
}: {
  conCategoria: EmpleadoPromocion[]
  sinCategoria: EmpleadoPromocion[]
  onDetalle: (emp: EmpleadoPromocion) => void
  onPromover: (emp: EmpleadoPromocion) => void
  onDesempeño: (emp: EmpleadoPromocion) => void
}) {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      {conCategoria.map((emp) => (
        <MobileRow key={emp.id} emp={emp} onClick={() => onPromover(emp)} onDesempeño={() => onDesempeño(emp)} />
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
  onDetalle,
  onPromover,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onDetalle: () => void
  onPromover: () => void
  onDesempeño: () => void
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
        <TableCell>
          <div className="font-medium text-sm text-foreground">
            {emp.numero && <span className="text-muted-foreground font-normal mr-1.5">#{emp.numero}</span>}
            {emp.nombre}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{emp.puesto}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-foreground">
            {emp.departamento}
          </div>
          {emp.area && emp.area !== emp.departamento && (
            <div className="text-xs text-muted-foreground mt-0.5">{emp.area}</div>
          )}
        </TableCell>
        <TableCell className="text-center">
          {cumpleTemp !== null ? (
            <Tooltip>
              <TooltipTrigger className="cursor-default inline-flex items-center justify-center">
                {cumpleTemp ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{formatMeses(meses)}</p>
                {regla && <p className="text-xs text-muted-foreground mt-0.5">Requerido: {formatMeses(regla.minTemporalidadMeses)}</p>}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-sm text-foreground whitespace-nowrap">
              {formatMeses(meses)}
            </span>
          )}
        </TableCell>
        <TableCell className="text-center">
          <Tooltip>
            <TooltipTrigger className="cursor-default inline-flex items-center justify-center gap-1.5">
              {cumpleCursos !== null &&
                (cumpleCursos ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                ))}
              <span
                className={`text-sm font-semibold ${pctCursos >= 80 ? "text-success" : pctCursos >= 50 ? "text-warning" : "text-destructive"}`}
              >
                {pctCursos}%
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {emp.cursosRequeridos.filter((c) => c.completado).length} de {emp.cursosRequeridos.length} cursos completados
              </p>
              {regla && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requerido: {regla.minPorcentajeCursos}%
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell className="text-center">
          {evalActual ? (
            <Tooltip>
              <TooltipTrigger className="cursor-default inline-flex items-center justify-center gap-1.5">
                {cumpleEval !== null &&
                  (cumpleEval ? (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  ))}
                <span
                  className={`text-sm font-bold ${evalActual.calificacion >= 80 ? "text-success" : evalActual.calificacion >= 60 ? "text-warning" : "text-destructive"}`}
                >
                  {evalActual.calificacion}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {evalActual.periodo && <p className="font-medium uppercase tracking-wide">{evalActual.periodo}</p>}
                {regla && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Requerido: {regla.minCalificacionEvaluacion}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Sin evaluar
            </span>
          )}
        </TableCell>
        <TableCell className="text-center">
          {emp.calificacionExamen != null ? (
            <div className="flex flex-col items-center justify-center leading-tight">
              <span
                className={`text-sm font-semibold ${
                  !regla || regla.minCalificacionExamen == null || emp.calificacionExamen >= regla.minCalificacionExamen
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {emp.calificacionExamen}
              </span>
              {emp.fechaExamenGuardada && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(emp.fechaExamenGuardada + "T12:00:00").toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              --
            </span>
          )}
        </TableCell>
        <TableCell>
          <AptitudBadge status={aptitud} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring">
                <MoreVertical size={16} />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onDetalle} className="gap-2 cursor-pointer">
                <Info size={15} className="text-muted-foreground" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPromover} className="gap-2 cursor-pointer">
                <TrendingUp size={15} className={aptitud === "apto" ? "text-primary" : "text-muted-foreground"} />
                {aptitud === "apto" ? "Promover empleado" : "Capturar examen"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDesempeño} className="gap-2 cursor-pointer">
                <Star size={15} className="text-warning" />
                Evaluar desempeño
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

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
      <TableCell>
        <div className="font-medium text-sm text-foreground">
          {emp.numero && <span className="text-muted-foreground font-normal mr-1.5">#{emp.numero}</span>}
          {emp.nombre}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{emp.puesto}</div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{emp.departamento}</span>
      </TableCell>
      <TableCell className="text-center" />
      <TableCell className="text-center" />
      <TableCell className="text-center" />
      <TableCell className="text-center">
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
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring">
              <MoreVertical size={16} />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onDesempeño} className="gap-2 cursor-pointer">
              <Star size={15} className="text-warning" />
              Capturar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ─── Mobile Row ────────────────────────────────────────────────────────────

function MobileRow({
  emp,
  onClick,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onClick: () => void
  onDesempeño: () => void
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
      role="button"
      tabIndex={0}
      className="bg-background border rounded-xl px-4 py-3 cursor-pointer active:bg-muted/70 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left w-full"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-foreground leading-tight">
            {emp.numero && <span className="text-muted-foreground font-normal mr-1.5">#{emp.numero}</span>}
            {emp.nombre}
          </div>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">
            {emp.puesto}
          </div>
        </div>
        <AptitudBadge status={aptitud} />
      </div>

      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs text-muted-foreground">{emp.departamento}</span>
        <Button
          variant="outline"
          size="icon"
          className="focus-visible:ring-2 focus-visible:ring-ring h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onDesempeño(); }}
          aria-label="Evaluar desempeño"
          title="Evaluar desempeño"
        >
          <Star size={12} className="text-warning" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
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
          <span className={LABEL_CLASS}>Desempeño</span>
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
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>Examen</span>
          <div className="flex items-center gap-1">
            {emp.calificacionExamen != null ? (
              <div className="flex flex-col">
                <span
                  className={`font-semibold ${
                    !regla || regla.minCalificacionExamen == null || emp.calificacionExamen >= regla.minCalificacionExamen
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {emp.calificacionExamen}
                </span>
                {emp.fechaExamenGuardada && (
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {new Date(emp.fechaExamenGuardada + "T12:00:00").toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </span>
                )}
              </div>
            ) : (
              <span className="italic text-muted-foreground">--</span>
            )}
          </div>
          {regla?.minCalificacionExamen != null && (
            <span className={MIN_CLASS}>mín {regla.minCalificacionExamen}</span>
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
            {emp.numero && <span className="text-muted-foreground font-normal mr-1.5">#{emp.numero}</span>}
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
