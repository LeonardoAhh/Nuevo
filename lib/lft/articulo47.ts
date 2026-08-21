/**
 * Detección del supuesto de rescisión sin responsabilidad para el patrón
 * previsto en la **Ley Federal del Trabajo, Art. 47 Fracc. X**:
 *
 *   «Tener el trabajador más de tres faltas de asistencia en un periodo de
 *    treinta días, sin permiso del patrón o sin causa justificada.»
 *
 * Es decir: **≥ 4 faltas injustificadas dentro de cualquier ventana móvil de
 * 30 días naturales**, contada a partir de la primera de esas faltas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠ AJUSTES FUTUROS — todos los parámetros viven aquí:
 *
 *  - Cambiar el umbral → editar `LFT_FALTAS_MIN`.
 *  - Cambiar la ventana → editar `LFT_VENTANA_DIAS`.
 *  - Cambiar qué código del reporte se considera "falta injustificada"
 *    → editar `CODIGO_FALTA_INJUSTIFICADA`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Umbral mínimo de faltas para que aplique la causal (LFT: "más de tres"). */
export const LFT_FALTAS_MIN = 4

/** Tamaño de la ventana móvil en días naturales. */
export const LFT_VENTANA_DIAS = 30

/**
 * Código en `reportes_diarios.data[i].days[d]` que representa
 * **FALTA INJUSTIFICADA**. La LFT exige que la falta sea sin permiso ni causa
 * justificada, por lo que NO se incluyen `FJ` (justificada), `P` (permiso),
 * `I` (incapacidad), `V` (vacación) ni descansos.
 */
export const CODIGO_FALTA_INJUSTIFICADA = "F"

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export interface LftEvaluacion {
  /** ¿Aplica la causal del Art. 47 Fracc. X? */
  aplica: boolean
  /** Total de faltas injustificadas detectadas en el histórico recibido. */
  totalFaltas: number
  /**
   * Si aplica: fechas (YYYY-MM-DD) de las faltas que conforman la primera
   * ventana de 30 días que dispara la causal. Ordenadas ascendentemente.
   */
  ventana: {
    inicio: string
    fin: string
    fechas: string[]
    conteo: number
  } | null
  /** Todas las fechas de faltas detectadas, ordenadas ascendentemente. */
  fechasFaltas: string[]
}

// ─── Utilidades de fecha ─────────────────────────────────────────────────────

/** Suma `n` días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD (UTC-safe). */
function addDias(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dt.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

// ─── Algoritmo principal ─────────────────────────────────────────────────────

/**
 * Evalúa si una lista de fechas de faltas injustificadas dispara la causal
 * del Art. 47 Fracc. X usando ventana móvil de 30 días.
 *
 * Complejidad O(n²) en el peor caso, n = número de faltas. Para los volúmenes
 * esperados (decenas por empleado) es despreciable.
 *
 * @param fechasISO Fechas YYYY-MM-DD (cualquier orden, pueden repetirse).
 */
export function evaluarArt47(fechasISO: readonly string[]): LftEvaluacion {
  // Dedupe + sort ascendente. Mismo día = misma falta.
  const fechas = Array.from(new Set(fechasISO)).sort()

  if (fechas.length < LFT_FALTAS_MIN) {
    return {
      aplica: false,
      totalFaltas: fechas.length,
      ventana: null,
      fechasFaltas: fechas,
    }
  }

  for (let i = 0; i < fechas.length; i++) {
    const inicio = fechas[i]
    // Ventana cerrada: [inicio, inicio + (VENTANA - 1) días] = 30 días naturales.
    const fin = addDias(inicio, LFT_VENTANA_DIAS - 1)
    const enVentana: string[] = []
    for (let j = i; j < fechas.length; j++) {
      if (fechas[j] <= fin) enVentana.push(fechas[j])
      else break
    }
    if (enVentana.length >= LFT_FALTAS_MIN) {
      return {
        aplica: true,
        totalFaltas: fechas.length,
        ventana: { inicio, fin, fechas: enVentana, conteo: enVentana.length },
        fechasFaltas: fechas,
      }
    }
  }

  return {
    aplica: false,
    totalFaltas: fechas.length,
    ventana: null,
    fechasFaltas: fechas,
  }
}

// ─── Extracción de fechas desde reportes_diarios ─────────────────────────────

/**
 * Fila tal como vive dentro de `reportes_diarios.data` (JSONB).
 * Coincide con `ReporteRow` de `components/content/reporte-diario/types.ts`,
 * pero replicada aquí para evitar acoplar `lib/lft` a `components/`.
 */
interface ReporteDiarioRow {
  mes: string                       // "YYYY-MM"
  numero_empleado: string
  days: Record<string, string>      // { "1": "F", "2": "-", ... }
}

/**
 * Extrae todas las fechas (YYYY-MM-DD) en las que un empleado tiene marcada
 * `FALTA INJUSTIFICADA` a lo largo de uno o varios reportes mensuales.
 *
 * @param reportes Array de meses, cada uno con su propio `data` (JSONB).
 * @param numeroEmpleado Número del empleado a buscar.
 */
export function extraerFechasFaltasInjustificadas(
  reportes: ReadonlyArray<{ mes: string; data: unknown }>,
  numeroEmpleado: string,
): string[] {
  const fechas: string[] = []
  for (const rep of reportes) {
    const rows = Array.isArray(rep.data) ? (rep.data as ReporteDiarioRow[]) : []
    const row = rows.find(
      (r) => r && typeof r === "object" && String(r.numero_empleado) === numeroEmpleado,
    )
    if (!row || !row.days) continue

    const [yearStr, monthStr] = rep.mes.split("-")
    for (const [diaKey, code] of Object.entries(row.days)) {
      if (code !== CODIGO_FALTA_INJUSTIFICADA) continue
      const dia = parseInt(diaKey, 10)
      if (!Number.isFinite(dia) || dia < 1 || dia > 31) continue
      const dd = String(dia).padStart(2, "0")
      fechas.push(`${yearStr}-${monthStr}-${dd}`)
    }
  }
  return fechas
}
