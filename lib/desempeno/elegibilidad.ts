import { mesesDePeriodo, normalizarPeriodoDesempeno } from "@/lib/catalogo"

/**
 * Elegibilidad para evaluaciones de desempeño semestrales.
 *
 * REGLA DE NEGOCIO:
 * Un empleado NO puede ser evaluado en una evaluación semestral si tuvo
 * menos de N meses de antigüedad al cierre del periodo evaluado.
 *
 * Cutoff = (fecha fin del periodo) − N meses.
 * Si `fecha_ingreso > cutoff` → NO elegible.
 * Si `fecha_ingreso` es NULL → NO elegible (regla estricta, dato faltante).
 *
 * Periodos no semestrales (mensuales, etc.) siempre son elegibles.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠ AJUSTES FUTUROS — TODOS LOS PARÁMETROS VIVEN AQUÍ.
 *
 * - Cambiar N meses → editar `MESES_MIN_ANTIGUEDAD_SEMESTRAL`.
 * Los cierres se derivan del propio periodo para evitar catálogos por año.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MESES_MIN_ANTIGUEDAD_SEMESTRAL = 3

export function esPeriodoSemestral(periodo: string): boolean {
  const normalizado = normalizarPeriodoDesempeno(periodo)
  return /^(DIC-MAY|JUN-NOV) \d{4}$/.test(normalizado) && mesesDePeriodo(normalizado).length === 6
}

/**
 * Calcula el cutoff (último ingreso permitido) para un periodo semestral.
 * Devuelve string YYYY-MM-DD, o null si el periodo no es semestral.
 *
 * Implementación manual para evitar el bug de desborde de `Date.setMonth()`
 * cuando el día origen no existe en el mes destino (p.ej. 31-may - 3 meses
 * NO debe rodar a 03-mar, sino al último día válido = 28-feb).
 */
export function getCutoffParaPeriodo(periodo: string): string | null {
  if (!esPeriodoSemestral(periodo)) return null
  const meses = mesesDePeriodo(periodo)
  const ultimoMes = meses.at(-1)
  if (!ultimoMes) return null
  const [y, m] = ultimoMes.split("-").map(Number)
  const d = new Date(y, m, 0).getDate()
  let targetMonth = m - MESES_MIN_ANTIGUEDAD_SEMESTRAL // 1-indexed
  let targetYear = y
  while (targetMonth <= 0) {
    targetMonth += 12
    targetYear -= 1
  }
  // Último día del mes destino: Date(y, month, 0) usa month 1-indexed aquí.
  const lastDay = new Date(targetYear, targetMonth, 0).getDate()
  const targetDay = Math.min(d, lastDay)
  const mm = String(targetMonth).padStart(2, "0")
  const dd = String(targetDay).padStart(2, "0")
  return `${targetYear}-${mm}-${dd}`
}

export interface ElegibilidadResultado {
  elegible: boolean
  motivo: string
  cutoff: string | null
  /** true si la regla aplica (periodo semestral). Si false, siempre elegible. */
  reglaAplica: boolean
}

/**
 * Determina si un empleado es elegible para evaluación en un periodo.
 *
 * @param fechaIngreso YYYY-MM-DD o null
 * @param periodo p.ej. "DIC-MAY 2026"
 */
export function esElegibleParaPeriodo(
  fechaIngreso: string | null | undefined,
  periodo: string,
): ElegibilidadResultado {
  if (!esPeriodoSemestral(periodo)) {
    return { elegible: true, motivo: "", cutoff: null, reglaAplica: false }
  }

  const cutoff = getCutoffParaPeriodo(periodo)!

  if (!fechaIngreso) {
    return {
      elegible: false,
      motivo: `No elegible: falta fecha_ingreso (regla: ≥ ${MESES_MIN_ANTIGUEDAD_SEMESTRAL} meses antes de ${cutoff}).`,
      cutoff,
      reglaAplica: true,
    }
  }

  // Comparación lexicográfica funciona con YYYY-MM-DD.
  const ingresoStr = fechaIngreso.slice(0, 10)
  if (ingresoStr > cutoff) {
    return {
      elegible: false,
      motivo: `No elegible: ingresó ${ingresoStr}, debe ser ≤ ${cutoff} (${MESES_MIN_ANTIGUEDAD_SEMESTRAL} meses antes del cierre del periodo ${periodo}).`,
      cutoff,
      reglaAplica: true,
    }
  }

  return { elegible: true, motivo: "", cutoff, reglaAplica: true }
}
