import { CircleCheck, CircleX } from "lucide-react"
import { calcularAptitud, formatMeses, mesesEnPuesto, porcentajeCursos, ultimaEvaluacion } from "@/lib/promociones/utils"
import type { EmpleadoPromocion } from "@/lib/promociones/types"
import { PROMOTION_DIALOG_COPY, PROMOTION_DIALOG_TYPE } from "@/lib/promociones/dialog-config"
import { PROMOTION_ICON } from "@/lib/promociones/icon-styles"
import { AptitudBadge } from "./prom-shared"

interface PromotionCriterionProps {
  label: string
  meets: boolean
  value: string | number
  minimum: string | number
  unit?: string
}

function PromotionCriterion({ label, meets, value, minimum, unit = "" }: PromotionCriterionProps) {
  const Icon = meets ? CircleCheck : CircleX
  const status = meets ? PROMOTION_DIALOG_COPY.meetsCriterion : PROMOTION_DIALOG_COPY.missesCriterion

  return (
    <li className="min-w-0 space-y-2 bg-background p-3">
      <div className="flex items-center gap-2">
        <Icon
          aria-hidden="true"
          className={`${PROMOTION_ICON.control} shrink-0 ${meets ? "text-success" : "text-destructive"}`}
        />
        <span className={PROMOTION_DIALOG_TYPE.label}>{label}</span>
        <span className="sr-only">: {status}</span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <strong className={`${PROMOTION_DIALOG_TYPE.primaryValue} ${meets ? "text-success" : "text-destructive"}`}>
          {value}{unit}
        </strong>
        <span className={PROMOTION_DIALOG_TYPE.supporting}>
          {PROMOTION_DIALOG_COPY.minimumLabel} {minimum}{unit}
        </span>
      </div>
    </li>
  )
}

export function PromPromotionCriteria({ empleado }: { empleado: EmpleadoPromocion }) {
  const { regla } = empleado
  if (!regla) return null

  const meses = mesesEnPuesto(empleado.fechaIngresoPuesto)
  const cursos = porcentajeCursos(empleado.cursosRequeridos)
  const evaluacion = ultimaEvaluacion(empleado.evaluaciones)
  const fechaExamen = empleado.fechaExamenGuardada
    ? new Date(`${empleado.fechaExamenGuardada}T12:00:00`)
    : null
  const fechaInicio = new Date(`${empleado.fechaIngresoPuesto}T12:00:00`)
  const examenVigente = !!fechaExamen && fechaExamen > fechaInicio
  const criteria: PromotionCriterionProps[] = [
    {
      label: PROMOTION_DIALOG_COPY.tenureCriterion,
      meets: meses >= regla.minTemporalidadMeses,
      value: formatMeses(meses),
      minimum: formatMeses(regla.minTemporalidadMeses),
    },
    {
      label: PROMOTION_DIALOG_COPY.coursesCriterion,
      meets: cursos >= regla.minPorcentajeCursos,
      value: cursos,
      minimum: regla.minPorcentajeCursos,
      unit: "%",
    },
    {
      label: PROMOTION_DIALOG_COPY.performanceCriterion,
      meets: !!evaluacion && evaluacion.calificacion >= regla.minCalificacionEvaluacion,
      value: evaluacion?.calificacion ?? "—",
      minimum: regla.minCalificacionEvaluacion,
    },
  ]

  if (regla.minCalificacionExamen != null) {
    criteria.push({
      label: PROMOTION_DIALOG_COPY.examCriterion,
      meets: examenVigente && empleado.calificacionExamen != null && empleado.calificacionExamen >= regla.minCalificacionExamen,
      value: examenVigente ? empleado.calificacionExamen ?? "—" : "—",
      minimum: regla.minCalificacionExamen,
    })
  }

  return (
    <section aria-labelledby="criterios-promocion" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id="criterios-promocion" className={PROMOTION_DIALOG_TYPE.sectionTitle}>
          {PROMOTION_DIALOG_COPY.criteriaTitle}
        </h3>
        <AptitudBadge status={calcularAptitud(empleado)} />
      </div>
      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border xs:grid-cols-2">
        {criteria.map(criterion => <PromotionCriterion key={criterion.label} {...criterion} />)}
      </ul>
    </section>
  )
}
