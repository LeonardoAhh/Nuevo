export const PROMOTION_DIALOG_COPY = {
  title: "Cambio de puesto",
  currentPosition: "Puesto actual",
  newPosition: "Nuevo puesto",
  undefinedPosition: "Sin definir",
  criteriaTitle: "Criterios de promoción",
  tenureCriterion: "Temporalidad",
  coursesCriterion: "Cursos completados",
  performanceCriterion: "Evaluación de desempeño",
  examCriterion: "Examen",
  meetsCriterion: "Cumple",
  missesCriterion: "No cumple",
  minimumLabel: "Mínimo",
  dateLabel: "Inicio en el nuevo puesto",
  confirmLabel: "Promover",
  invalidDate: "Selecciona la fecha de inicio del nuevo puesto.",
  notEligible: "El colaborador todavía no cumple todos los criterios para la promoción.",
  saveError: "No se pudo completar la promoción.",
} as const

export const EXAM_DIALOG_COPY = {
  title: "Capturar examen",
  dateLabel: "Fecha del examen",
  scoreLabel: "Calificación",
  scoreHint: "Valor de 0 a 100",
  attemptsLabel: "Intentos registrados",
  minimumLabel: "Calificación mínima",
  saveLabel: "Guardar examen",
  deleteLabel: "Borrar examen",
  missingDate: "Selecciona la fecha del examen.",
  invalidDate: "La fecha del examen debe ser posterior al inicio en el puesto actual.",
  invalidScore: "Captura una calificación entre 0 y 100.",
  saveError: "No se pudo guardar el examen.",
  deleteError: "No se pudo borrar el examen.",
} as const

/** Shared semantic type scale for promotion dialogs. Uses the global rem scale. */
export const PROMOTION_DIALOG_TYPE = {
  primaryValue: "text-base font-semibold leading-snug text-foreground",
  accentValue: "text-base font-semibold leading-snug text-primary",
  sectionTitle: "text-sm font-semibold leading-snug text-foreground",
  label: "text-sm font-medium leading-snug text-muted-foreground",
  value: "text-sm font-medium leading-snug text-foreground",
  supporting: "text-sm leading-relaxed text-muted-foreground",
} as const

export function todayAsLocalDate(): string {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function formatPromotionDate(date: Date): string {
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
