import { daysFromToday, formatDate, type NuevoIngreso } from "@/lib/hooks"
import type { RecontratacionPrintData } from "@/components/content/recontratacion-print"

export type Recomendacion = "viable" | "revisar" | "no-viable" | "sin-datos"
export type UrgencyLevel = "critical" | "warning" | "expired" | "normal" | "indefinite"

export const URGENCY_THRESHOLDS = { critical: 7, warning: 15 } as const
export const EVAL_THRESHOLDS = { minPass: 70, goodAvg: 85, maxFaltas: 3 } as const
export const SKELETON_COUNT = 8
export const PAGE_SIZE = 6

export function evaluarRecomendacion(data: RecontratacionPrintData): Recomendacion {
  const califs = data.evaluaciones
    .map((evaluation) => evaluation.calificacion)
    .filter((calificacion): calificacion is number => calificacion != null)

  if (califs.length === 0) return "sin-datos"

  const faltasInjust = data.incidencias.reduce(
    (total, mes) => total + (mes.valores["FALTA INJUSTIFICADA"] ?? 0),
    0,
  )

  if (
    califs.some((calificacion) => calificacion < EVAL_THRESHOLDS.minPass) ||
    faltasInjust >= EVAL_THRESHOLDS.maxFaltas
  ) return "no-viable"

  const promedio = califs.reduce((total, calificacion) => total + calificacion, 0) / califs.length
  return promedio >= EVAL_THRESHOLDS.goodAvg && faltasInjust === 0 ? "viable" : "revisar"
}

export function getUrgencyLevel(record: NuevoIngreso): UrgencyLevel {
  if (record.tipo_contrato === "Indeterminado") return "indefinite"
  const diferencia = daysFromToday(record.termino_contrato)
  if (diferencia == null) return "normal"
  if (diferencia < 0) return "expired"
  if (diferencia <= URGENCY_THRESHOLDS.critical) return "critical"
  if (diferencia <= URGENCY_THRESHOLDS.warning) return "warning"
  return "normal"
}

export function sortByTermino(a: NuevoIngreso, b: NuevoIngreso): number {
  const diferenciaA = daysFromToday(a.termino_contrato) ?? Infinity
  const diferenciaB = daysFromToday(b.termino_contrato) ?? Infinity
  return diferenciaA - diferenciaB
}

export type DetalleState =
  | { status: "closed" }
  | { status: "loading" }
  | { status: "ready"; data: RecontratacionPrintData }
  | { status: "error"; message: string }

export type DetalleAction =
  | { type: "open" }
  | { type: "loaded"; data: RecontratacionPrintData }
  | { type: "failed"; message: string }
  | { type: "close" }

export function detalleReducer(_: DetalleState, action: DetalleAction): DetalleState {
  switch (action.type) {
    case "open":
      return { status: "loading" }
    case "loaded":
      return { status: "ready", data: action.data }
    case "failed":
      return { status: "error", message: action.message }
    case "close":
      return { status: "closed" }
  }
}

export function urgencyLabel(urgency: UrgencyLevel, record: NuevoIngreso): string {
  const diferencia = daysFromToday(record.termino_contrato)
  switch (urgency) {
    case "expired":
      return "Contrato vencido"
    case "critical":
      return `Vence en ${diferencia} día${diferencia === 1 ? "" : "s"}`
    case "warning":
      return `Vence en ${diferencia} días`
    case "indefinite":
      return "Contrato indeterminado"
    default:
      return record.termino_contrato
        ? `Término ${formatDate(record.termino_contrato)}`
        : "Sin fecha de término"
  }
}
