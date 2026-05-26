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
 * - Agregar nuevo periodo semestral → agregar entrada en `PERIODO_FIN`.
 * - Cambiar fecha fin de un periodo → editar su valor en `PERIODO_FIN`.
 *
 * IMPORTANTE: la migration `20260526_eval_desempeno_elegibilidad.sql`
 * tiene los MISMOS valores hardcodeados en la fn
 * `desempeno_es_elegible_periodo()`. Si cambias algo aquí, actualizar
 * también la migration (o crear una nueva) para mantener UI y DB en sync.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MESES_MIN_ANTIGUEDAD_SEMESTRAL = 3

/**
 * Mapa periodo → fecha fin (inclusive). Solo periodos semestrales.
 * Formato YYYY-MM-DD.
 */
export const PERIODO_FIN: Record<string, string> = {
  "DIC-MAY 2026": "2026-05-31",
  "JUN-NOV 2026": "2026-11-30",
}

export function esPeriodoSemestral(periodo: string): boolean {
  return periodo in PERIODO_FIN
}

/**
 * Calcula el cutoff (último ingreso permitido) para un periodo semestral.
 * Devuelve string YYYY-MM-DD, o null si el periodo no es semestral.
 */
export function getCutoffParaPeriodo(periodo: string): string | null {
  const fin = PERIODO_FIN[periodo]
  if (!fin) return null
  const date = new Date(fin + "T00:00:00")
  date.setMonth(date.getMonth() - MESES_MIN_ANTIGUEDAD_SEMESTRAL)
  return date.toISOString().slice(0, 10)
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
