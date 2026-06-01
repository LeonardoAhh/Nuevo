// ─────────────────────────────────────────────────────────────────────────────
// Recontratación — lógica pura para el formato de Autorización de Continuidad
// de Contrato (RG-REC-048).
//
// Reglas de negocio:
//   • Incidencias: solo el periodo [fecha_ingreso, fecha_ingreso + 90 días].
//   • Evaluación de desempeño: una evaluación por mes (3 periodos mensuales
//     a partir de la fecha de ingreso).
//   • Firmas fijas: Recursos Humanos y Gerente de Planta (catálogo).
//   • Jefe directo: se detecta automáticamente desde el roster (tabla employees).
// ─────────────────────────────────────────────────────────────────────────────

import type { IncidenciaCategory } from '@/lib/hooks/useIncidencias'

/** Periodo de evaluación mensual con su fecha de inicio/fin en ISO y etiqueta. */
export interface PeriodoMensual {
  /** YYYY-MM-DD inicio del periodo */
  desdeISO: string
  /** YYYY-MM-DD fin del periodo */
  hastaISO: string
  /** Etiqueta para impresión: "DD/MM/YYYY → DD/MM/YYYY" */
  label: string
}

/** Firmantes fijos del formato (no cambian). */
export const FIRMA_RECURSOS_HUMANOS = 'HERNANDEZ GUDIÑO NOEMI'
export const FIRMA_GERENTE_PLANTA = 'TERRAZAS MARTINEZ JAIME'

/**
 * Columnas de incidencias mostradas en el formato impreso, en orden, mapeadas
 * a las categorías canónicas de la tabla `incidencias`.
 */
export const INCIDENCIA_COLUMNS: { header: string; categoria: IncidenciaCategory }[] = [
  { header: 'F. INJUST', categoria: 'FALTA INJUSTIFICADA' },
  { header: 'FALTAS JUSTIF', categoria: 'FALTAS JUST' },
  { header: 'SANCIÓN', categoria: 'SANCIÓN' },
  { header: 'PERMISO', categoria: 'PERMISO' },
  { header: 'P. HORAS', categoria: 'PERMISO HORAS' },
  { header: 'INCAPACIDAD', categoria: 'INCAPACIDAD' },
]

const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
]

/** Parsea YYYY-MM-DD a partes numéricas sin zona horaria. */
function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

/** Añade N días a una fecha ISO (UTC, sin zona horaria). */
export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split('T')[0]
}

/**
 * Añade N meses a una fecha ISO conservando el día (con clamp al último día
 * del mes destino cuando el día original no existe, ej. 31 → 30/28).
 */
export function addMonths(iso: string, months: number): string {
  const { y, m, d } = parseISO(iso)
  const targetMonthIdx = m - 1 + months
  const targetYear = y + Math.floor(targetMonthIdx / 12)
  const targetMonth = ((targetMonthIdx % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const day = Math.min(d, lastDay)
  return new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().split('T')[0]
}

/** YYYY-MM-DD → DD/MM/YYYY (— si vacío). */
export function formatDMY(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** YYYY-MM → "MES YYYY" en mayúsculas (para etiqueta de mes de incidencias). */
export function formatMesLargo(ym: string): string {
  const [y, m] = ym.split('-')
  const idx = parseInt(m, 10) - 1
  return `${MESES[idx] ?? m} ${y}`
}

/**
 * Genera los periodos de evaluación mensual a partir de la fecha de ingreso.
 * Una evaluación por mes: [ingreso, +1m], [+1m, +2m], [+2m, +3m]...
 */
export function periodosMensuales(fechaIngresoISO: string | null, count = 3): PeriodoMensual[] {
  if (!fechaIngresoISO) {
    return Array.from({ length: count }, () => ({ desdeISO: '', hastaISO: '', label: '' }))
  }
  return Array.from({ length: count }, (_, i) => {
    const desdeISO = addMonths(fechaIngresoISO, i)
    const hastaISO = addMonths(fechaIngresoISO, i + 1)
    return { desdeISO, hastaISO, label: `${formatDMY(desdeISO)} → ${formatDMY(hastaISO)}` }
  })
}

/**
 * Lista de meses (YYYY-MM) que se intersectan con la ventana
 * [fecha_ingreso, fecha_ingreso + windowDays]. Solo este periodo se muestra
 * en el apartado de incidencias.
 */
export function mesesIncidencias(fechaIngresoISO: string | null, windowDays = 90): string[] {
  if (!fechaIngresoISO) return []
  const finISO = addDays(fechaIngresoISO, windowDays)
  const start = parseISO(fechaIngresoISO)
  const end = parseISO(finISO)

  const meses: string[] = []
  let y = start.y
  let m = start.m
  while (y < end.y || (y === end.y && m <= end.m)) {
    meses.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) { m = 1; y += 1 }
  }
  return meses
}
