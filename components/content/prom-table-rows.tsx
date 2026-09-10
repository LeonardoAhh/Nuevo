"use client"

import {
  CircleCheck,
  CircleX,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { PROMOTION_ICON } from "@/lib/promociones/icon-styles"
import {
  formatShortPromotionDate,
  getCriterionTone,
  getUnavailableCategoryLabel,
  PROMOTION_TABLE_COPY,
  PROMOTION_TABLE_STYLE,
} from "@/lib/promociones/table-config"
import { formatMeses, ultimaEvaluacion } from "@/lib/promociones/utils"
import { getPromotionRowView } from "@/lib/promociones/table-view"
import { AptitudBadge } from "./prom-shared"
import { PromAccionesMenu } from "./prom-acciones-menu"

// ─── Constants ──────────────────────────────────────────────────────────────

const LABEL_CLASS = PROMOTION_TABLE_STYLE.mobileMetricLabel
const MIN_CLASS = PROMOTION_TABLE_STYLE.supportingText

// ─── Desktop Table ──────────────────────────────────────────────────────────

export function DesktopTable({
  conCategoria,
  sinCategoria,
  onDetalle,
  onPromover,
  onCapturarExamen,
  onDesempeño,
}: {
  conCategoria: EmpleadoPromocion[]
  sinCategoria: EmpleadoPromocion[]
  onDetalle: (emp: EmpleadoPromocion) => void
  onPromover: (emp: EmpleadoPromocion) => void
  onCapturarExamen: (emp: EmpleadoPromocion) => void
  onDesempeño: (emp: EmpleadoPromocion) => void
}) {
  return (
    <div className="hidden md:block rounded-lg border overflow-hidden bg-background">
      <Table aria-label={PROMOTION_TABLE_COPY.accessibleName}>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>{PROMOTION_TABLE_COPY.employee}</TableHead>
            <TableHead>{PROMOTION_TABLE_COPY.department}</TableHead>
            <TableHead className="text-center">
              <Tooltip>
                <TooltipTrigger className="mx-auto flex items-center gap-1 cursor-default">
                  {PROMOTION_TABLE_COPY.tenure}
                </TooltipTrigger>
                <TooltipContent>{PROMOTION_TABLE_COPY.tenureHelp}</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="text-center">{PROMOTION_TABLE_COPY.courses}</TableHead>
            <TableHead className="text-center">{PROMOTION_TABLE_COPY.performance}</TableHead>
            <TableHead className="text-center">{PROMOTION_TABLE_COPY.exam}</TableHead>
            <TableHead>{PROMOTION_TABLE_COPY.status}</TableHead>
            <TableHead className="w-16 text-right">{PROMOTION_TABLE_COPY.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conCategoria.map((emp) => (
            <DesktopRow
              key={emp.id}
              emp={emp}
              onDetalle={() => onDetalle(emp)}
              onPromover={() => onPromover(emp)}
              onCapturarExamen={() => onCapturarExamen(emp)}
              onDesempeño={() => onDesempeño(emp)}
            />
          ))}
          {sinCategoria.length > 0 && (
            <TableRow>
              <TableCell colSpan={8} className="bg-muted/50 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                  {PROMOTION_TABLE_COPY.unavailableGroup}
                </span>
              </TableCell>
            </TableRow>
          )}
          {sinCategoria.map((emp) => (
            <DesktopRowInhabilitado
              key={emp.id}
              emp={emp}
              onDetalle={() => onDetalle(emp)}
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
  onCapturarExamen,
  onDesempeño,
}: {
  conCategoria: EmpleadoPromocion[]
  sinCategoria: EmpleadoPromocion[]
  onDetalle: (emp: EmpleadoPromocion) => void
  onPromover: (emp: EmpleadoPromocion) => void
  onCapturarExamen: (emp: EmpleadoPromocion) => void
  onDesempeño: (emp: EmpleadoPromocion) => void
}) {
  return (
    <ul className="flex flex-col gap-2 md:hidden" aria-label={PROMOTION_TABLE_COPY.accessibleName}>
      {conCategoria.map((emp) => (
        <MobileRow
          key={emp.id}
          emp={emp}
          onDetalle={() => onDetalle(emp)}
          onPromover={() => onPromover(emp)}
          onCapturarExamen={() => onCapturarExamen(emp)}
          onDesempeño={() => onDesempeño(emp)}
        />
      ))}
      {sinCategoria.length > 0 && (
        <li className="mt-1 flex items-center gap-2 px-1 py-1">
          <div className="h-px flex-1 bg-muted" />
          <span className="text-xs text-muted-foreground">
            {PROMOTION_TABLE_COPY.unavailableGroup}
          </span>
          <div className="h-px flex-1 bg-muted" />
        </li>
      )}
      {sinCategoria.map((emp) => (
        <MobileCardInhabilitado
          key={emp.id}
          emp={emp}
          onDetalle={() => onDetalle(emp)}
          onDesempeño={() => onDesempeño(emp)}
        />
      ))}
    </ul>
  )
}

// ─── Desktop Row ────────────────────────────────────────────────────────────

function DesktopRow({
  emp,
  onDetalle,
  onPromover,
  onCapturarExamen,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onDetalle: () => void
  onPromover: () => void
  onCapturarExamen: () => void
  onDesempeño: () => void
}) {
  const {
    aptitud,
    regla,
    meses,
    porcentajeCompletado: pctCursos,
    cursosCompletados,
    evaluacion: evalActual,
    cumpleTemporalidad: cumpleTemp,
    cumpleCursos,
    cumpleEvaluacion: cumpleEval,
    cumpleExamen,
  } = getPromotionRowView(emp)

  return (
      <TableRow>
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
              <TooltipTrigger
                className="cursor-default inline-flex items-center justify-center"
                aria-label={`${cumpleTemp ? PROMOTION_TABLE_COPY.meets : PROMOTION_TABLE_COPY.doesNotMeet} ${PROMOTION_TABLE_COPY.tenure.toLowerCase()}: ${formatMeses(meses)}`}
              >
                {cumpleTemp ? (
                  <CircleCheck aria-hidden="true" className={`${PROMOTION_ICON.control} text-success`} />
                ) : (
                  <CircleX aria-hidden="true" className={`${PROMOTION_ICON.control} text-destructive`} />
                )}
                <span className="ml-1 text-sm text-foreground">{formatMeses(meses)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{formatMeses(meses)}</p>
                {regla && <p className="text-xs text-muted-foreground mt-0.5">{PROMOTION_TABLE_COPY.required}: {formatMeses(regla.minTemporalidadMeses)}</p>}
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
                  <CircleCheck aria-hidden="true" className={`${PROMOTION_ICON.control} shrink-0 text-success`} />
                ) : (
                  <CircleX aria-hidden="true" className={`${PROMOTION_ICON.control} shrink-0 text-destructive`} />
                ))}
              <span
                className={`text-sm font-semibold ${getCriterionTone(cumpleCursos)}`}
              >
                {pctCursos}%
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {cursosCompletados} de {emp.cursosRequeridos.length} cursos completados
              </p>
              {regla && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {PROMOTION_TABLE_COPY.required}: {regla.minPorcentajeCursos}%
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
                    <CircleCheck aria-hidden="true" className={`${PROMOTION_ICON.control} shrink-0 text-success`} />
                  ) : (
                    <CircleX aria-hidden="true" className={`${PROMOTION_ICON.control} shrink-0 text-destructive`} />
                  ))}
                <span
                  className={`text-sm font-semibold ${getCriterionTone(cumpleEval)}`}
                >
                  {evalActual.calificacion}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {evalActual.periodo && <p className="font-medium uppercase tracking-wide">{evalActual.periodo}</p>}
                {regla && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {PROMOTION_TABLE_COPY.required}: {regla.minCalificacionEvaluacion}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              {PROMOTION_TABLE_COPY.noEvaluation}
            </span>
          )}
        </TableCell>
        <TableCell className="text-center">
          {emp.calificacionExamen != null ? (
            <div className="flex flex-col items-center justify-center leading-tight">
              <span
                className={`text-sm font-semibold ${
                  getCriterionTone(cumpleExamen)
                }`}
              >
                {emp.calificacionExamen}
              </span>
              {emp.fechaExamenGuardada && (
                <span className={PROMOTION_TABLE_STYLE.supportingText}>
                  {formatShortPromotionDate(emp.fechaExamenGuardada)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              {PROMOTION_TABLE_COPY.unavailableValue}
            </span>
          )}
        </TableCell>
        <TableCell>
          <AptitudBadge status={aptitud} />
        </TableCell>
        <TableCell className="text-right">
          <PromAccionesMenu
            empleado={emp}
            onDetalle={onDetalle}
            onPromover={onPromover}
            onCapturarExamen={onCapturarExamen}
            onDesempeño={onDesempeño}
          />
        </TableCell>
      </TableRow>
  )
}

// ─── Desktop Row Inhabilitado ───────────────────────────────────────────────

function DesktopRowInhabilitado({
  emp,
  onDetalle,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onDetalle: () => void
  onDesempeño: () => void
}) {
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  return (
    <TableRow className="bg-muted/20">
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
      <UnavailableCell />
      <UnavailableCell />
      <TableCell className="text-center">
        {evalActual ? (
          <span
            className="text-sm font-semibold text-foreground"
          >
            {evalActual.calificacion}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground">
            {PROMOTION_TABLE_COPY.noEvaluation}
          </span>
        )}
      </TableCell>
      <UnavailableCell />
      <TableCell>
        <Badge
          variant="outline"
          className="text-xs text-muted-foreground border-border"
        >
          {getUnavailableCategoryLabel(emp.puesto)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
          <PromAccionesMenu
            empleado={emp}
            onDetalle={onDetalle}
            onDesempeño={onDesempeño}
          />
        </TableCell>
      </TableRow>
  )
}

// ─── Mobile Row ────────────────────────────────────────────────────────────

function MobileRow({
  emp,
  onDetalle,
  onPromover,
  onCapturarExamen,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onDetalle: () => void
  onPromover: () => void
  onCapturarExamen: () => void
  onDesempeño: () => void
}) {
  const {
    aptitud,
    regla,
    meses,
    porcentajeCompletado: pctCursos,
    cursosCompletados,
    evaluacion: evalActual,
    cumpleTemporalidad: cumpleTemp,
    cumpleCursos,
    cumpleEvaluacion: cumpleEval,
    cumpleExamen,
  } = getPromotionRowView(emp)

  return (
    <li className="w-full rounded-xl border bg-background px-4 py-3 text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-tight">
            {emp.numero && <span className="text-muted-foreground font-normal mr-1.5">#{emp.numero}</span>}
            {emp.nombre}
          </h3>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">
            {emp.puesto}
          </div>
        </div>
        <PromAccionesMenu
          empleado={emp}
          onDetalle={onDetalle}
          onPromover={onPromover}
          onCapturarExamen={onCapturarExamen}
          onDesempeño={onDesempeño}
        />
      </div>

      <div className="mb-3 mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{emp.departamento}</p>
        <AptitudBadge status={aptitud} />
      </div>

      <div className={`${PROMOTION_TABLE_STYLE.mobileMetricGrid} text-xs`}>
        <MetricaMobile
          label={PROMOTION_TABLE_COPY.tenure}
          cumple={cumpleTemp}
          valor={formatMeses(meses)}
          min={regla ? `${PROMOTION_TABLE_COPY.minimum} ${formatMeses(regla.minTemporalidadMeses)}` : undefined}
        />
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>{PROMOTION_TABLE_COPY.courses}</span>
          <div className="flex items-center gap-1">
            {cumpleCursos !== null &&
              (cumpleCursos ? (
                <CircleCheck aria-hidden="true" className={`${PROMOTION_ICON.metric} shrink-0 text-success`} />
              ) : (
                <CircleX aria-hidden="true" className={`${PROMOTION_ICON.metric} shrink-0 text-destructive`} />
              ))}
            <span
              className={`font-semibold ${getCriterionTone(cumpleCursos)}`}
            >
              {pctCursos}%
            </span>
            <span className="text-muted-foreground">
              ({cursosCompletados}/
              {emp.cursosRequeridos.length})
            </span>
          </div>
          <Progress value={pctCursos} className="h-1 mt-0.5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>{PROMOTION_TABLE_COPY.performance}</span>
          <div className="flex items-center gap-1">
            {evalActual ? (
              <>
                {cumpleEval !== null &&
                  (cumpleEval ? (
                    <CircleCheck aria-hidden="true" className={`${PROMOTION_ICON.metric} shrink-0 text-success`} />
                  ) : (
                    <CircleX aria-hidden="true" className={`${PROMOTION_ICON.metric} shrink-0 text-destructive`} />
                  ))}
                <span
                  className={`font-semibold ${getCriterionTone(cumpleEval)}`}
                >
                  {evalActual.calificacion}
                </span>
              </>
            ) : (
              <span className="italic text-muted-foreground">{PROMOTION_TABLE_COPY.noEvaluation}</span>
            )}
          </div>
          {regla && (
            <span className={MIN_CLASS}>{PROMOTION_TABLE_COPY.minimum} {regla.minCalificacionEvaluacion}</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={LABEL_CLASS}>{PROMOTION_TABLE_COPY.exam}</span>
          <div className="flex items-center gap-1">
            {emp.calificacionExamen != null ? (
              <div className="flex flex-col">
                <span
                  className={`font-semibold ${
                    getCriterionTone(cumpleExamen)
                  }`}
                >
                  {emp.calificacionExamen}
                </span>
                {emp.fechaExamenGuardada && (
                  <span className={`${PROMOTION_TABLE_STYLE.supportingText} mt-0.5 leading-none`}>
                    {formatShortPromotionDate(emp.fechaExamenGuardada)}
                  </span>
                )}
              </div>
            ) : (
              <span className="italic text-muted-foreground">{PROMOTION_TABLE_COPY.unavailableValue}</span>
            )}
          </div>
          {regla?.minCalificacionExamen != null && (
            <span className={MIN_CLASS}>{PROMOTION_TABLE_COPY.minimum} {regla.minCalificacionExamen}</span>
          )}
        </div>
      </div>

    </li>
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
            <CircleCheck aria-hidden="true" className={`${PROMOTION_ICON.metric} shrink-0 text-success`} />
          ) : (
            <CircleX aria-hidden="true" className={`${PROMOTION_ICON.metric} shrink-0 text-destructive`} />
          ))}
        <span className="font-medium text-foreground">{valor}</span>
      </div>
      {min && <span className={MIN_CLASS}>{min}</span>}
    </div>
  )
}

function UnavailableCell() {
  return (
    <TableCell className="text-center text-muted-foreground">
      <span aria-hidden="true">{PROMOTION_TABLE_COPY.unavailableValue}</span>
      <span className="sr-only">{PROMOTION_TABLE_COPY.notApplicable}</span>
    </TableCell>
  )
}

// ─── Mobile Card Inhabilitado ───────────────────────────────────────────────

function MobileCardInhabilitado({
  emp,
  onDetalle,
  onDesempeño,
}: {
  emp: EmpleadoPromocion
  onDetalle: () => void
  onDesempeño: () => void
}) {
  const evalActual = ultimaEvaluacion(emp.evaluaciones)
  return (
    <li className="rounded-xl border bg-muted/30 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-tight">
            {emp.numero && <span className="text-muted-foreground font-normal mr-1.5">#{emp.numero}</span>}
            {emp.nombre}
          </h3>
          <div className="text-xs text-muted-foreground leading-tight mt-0.5">
            {emp.puesto}
          </div>
        </div>
        <PromAccionesMenu empleado={emp} onDetalle={onDetalle} onDesempeño={onDesempeño} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{emp.departamento}</span>
        </div>
        <Badge variant="outline" className="shrink-0 border-border text-xs text-muted-foreground">
          {getUnavailableCategoryLabel(emp.puesto)}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {PROMOTION_TABLE_COPY.performance}: {evalActual?.calificacion ?? PROMOTION_TABLE_COPY.noEvaluation}
      </p>
    </li>
  )
}
