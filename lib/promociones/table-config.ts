export const PROMOTION_TABLE_COPY = {
  accessibleName: "Seguimiento de promociones",
  employee: "Empleado",
  department: "Departamento",
  tenure: "Temporalidad",
  tenureHelp: "Tiempo en el puesto actual",
  courses: "Cursos",
  performance: "Desempeño",
  exam: "Examen",
  status: "Estado",
  actions: "Acciones",
  unavailableGroup: "Categoría A o sin categoría",
  noEvaluation: "Sin evaluar",
  unavailableValue: "—",
  notApplicable: "No aplica",
  required: "Requerido",
  minimum: "mín",
  meets: "Cumple",
  doesNotMeet: "No cumple",
} as const

export function getUnavailableCategoryLabel(position: string): string {
  return /\sA$/i.test(position.trim()) ? "Categoría A" : "Sin categoría"
}

export const PROMOTION_TABLE_STYLE = {
  mobileMetricLabel: "text-xs font-medium text-muted-foreground",
  supportingText: "text-xs text-muted-foreground",
  mobileMetricGrid: "grid grid-cols-2 gap-3 xs:grid-cols-4",
} as const

export function getCriterionTone(result: boolean | null): string {
  if (result === true) return "text-success"
  if (result === false) return "text-destructive"
  return "text-foreground"
}

export function formatShortPromotionDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}
