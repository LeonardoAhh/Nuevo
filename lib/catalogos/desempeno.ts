export const TIPO_LABEL: Record<string, string> = {
  operativo: "Operativo",
  administrativo: "Administrativo",
  jefe: "Jefe",
}

export const TIPO_DESEMPENO_POR_PUESTO = {
  jefe: [
    "GERENTE",
    "JEFE",
    "SUPERVISOR",
    "COORDINADOR",
    "LIDER",
    "DIRECTOR",
    "GERENTE DE",
    "JEFE DE",
    "SUPERVISOR DE",
    "COORDINADOR DE",
    "LÍDER DE",
  ],
  administrativo: [
    "ADMINISTRATIVO",
    "AUXILIAR ADMINISTRATIVO",
    "ANALISTA",
    "ASISTENTE",
    "SECRETARIA",
    "PROGRAMADOR",
    "AUXILIAR DE RECURSOS HUMANOS",
    "AUXILIAR DE CONTABILIDAD",
    "METRÓLOGO",
    "AUXILIAR DE METROLOGÍA",
    "AUXILIAR DE PROYECTOS",
    "INGENIERO DE PROYECTOS",
    "AUXILIAR DEL SGI",
    "PLANEADOR DE PRODUCCIÓN",
    "INGENIERO DE PROCESO",
    "INGENIERO DE CALIDAD",
    "INSPECTOR DE CALIDAD",
    "INSPECTOR RECIBO",
    "RESIDENTE DE CALIDAD",
    "LIDER DE COTIZACIONES",
    "SUPERVISOR DE LOGISTICA",
    "LIDER DE PROYECTOS",
    "LÍDER DE PROYECTOS",
    "COORDINADOR DE RPS",
  ],
  operativo: [
    "OPERADOR",
    "AUXILIAR",
    "MATERIALISTA",
    "PREPARADOR",
    "MONTADOR",
    "TÉCNICO",
    "INSPECTOR",
    "METRÓLOGO",
    "CHOFER",
    "RESIDENTE",
    "AUXILIAR DE MANTENIMIENTO",
  ],
} as const

export type TipoDesempeno = keyof typeof TIPO_DESEMPENO_POR_PUESTO

export function getTipoDesempenoByPuesto(puesto: string): TipoDesempeno {
  const normalized = puesto.toUpperCase().trim()

  const matchList = (tipo: TipoDesempeno) =>
    TIPO_DESEMPENO_POR_PUESTO[tipo].some((keyword) => normalized.includes(keyword))

  if (
    matchList("jefe") &&
    !normalized.includes("AUXILIAR ADMINISTRATIVO") &&
    !normalized.includes("AUXILIAR DE SUPERVISOR") &&
    !normalized.includes("LIDER DE COTIZACIONES") &&
    !normalized.includes("SUPERVISOR DE LOGISTICA") &&
    !normalized.includes("LIDER DE PROYECTOS") &&
    !normalized.includes("LÍDER DE PROYECTOS") &&
    !normalized.includes("COORDINADOR DE RPS")
  ) {
    return "jefe"
  }

  if (matchList("administrativo")) {
    return "administrativo"
  }

  return "operativo"
}

const MESES_DESEMPENO = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"] as const

export type DesempenoPeriodo = string
export type PeriodoModo = "semestrales" | "mensuales"

/** Devuelve periodos cuyo año corresponde al mes final del rango. */
export function getPeriodosDesempeno(year: number): Record<PeriodoModo, string[]> {
  return {
    semestrales: [`DIC-MAY ${year}`, `JUN-NOV ${year}`],
    mensuales: MESES_DESEMPENO.map((mesFinal, index) => {
      const mesInicial = MESES_DESEMPENO[(index + 11) % 12]
      return `${mesInicial}-${mesFinal} ${year}`
    }),
  }
}

export function normalizarPeriodoDesempeno(periodo: string): string {
  return periodo.trim().replace(/\s*-\s*/g, "-").replace(/\s+/g, " ").toUpperCase()
}

export function getPeriodoActual(modo: PeriodoModo, fecha = new Date()): string {
  if (modo === "mensuales") return getPeriodosDesempeno(fecha.getFullYear()).mensuales[fecha.getMonth()]
  if (fecha.getMonth() === 11) return getPeriodosDesempeno(fecha.getFullYear() + 1).semestrales[0]
  const periodos = getPeriodosDesempeno(fecha.getFullYear()).semestrales
  return fecha.getMonth() <= 4 ? periodos[0] : periodos[1]
}

const CURRENT_DESEMPENO_YEAR = new Date().getFullYear()
export const PERIODOS_DESEMPENO = getPeriodosDesempeno(CURRENT_DESEMPENO_YEAR)

// Mapa abreviatura de mes (ES) → número 1-12.
const MES_ABREV_A_NUM: Record<string, number> = {
  ENE: 1, FEB: 2, MAR: 3, ABR: 4, MAY: 5, JUN: 6,
  JUL: 7, AGO: 8, SEP: 9, OCT: 10, NOV: 11, DIC: 12,
}

/**
 * Convierte un label de periodo de desempeño a la lista de meses `YYYY-MM`
 * que abarca, en orden ascendente.
 *
 * El año del label corresponde al mes FINAL. Si el mes inicial es mayor que
 * el final, el inicio cae en el año anterior (p.ej. "DIC-MAY 2026" →
 * 2025-12 … 2026-05).
 *
 * - Mensual ("ENE-FEB 2026") → 2 meses.
 * - Semestral ("DIC-MAY 2026") → 6 meses.
 *
 * Devuelve `[]` si el label no tiene el formato esperado.
 */
export function mesesDePeriodo(periodo: string | null | undefined): string[] {
  if (!periodo) return []
  const m = normalizarPeriodoDesempeno(periodo).match(/^([A-ZÁÉÍÓÚ]{3})-([A-ZÁÉÍÓÚ]{3})\s+(\d{4})$/i)
  if (!m) return []

  const startNum = MES_ABREV_A_NUM[m[1].toUpperCase()]
  const endNum = MES_ABREV_A_NUM[m[2].toUpperCase()]
  const endYear = Number(m[3])
  if (!startNum || !endNum || !Number.isFinite(endYear)) return []

  const startYear = startNum <= endNum ? endYear : endYear - 1

  const meses: string[] = []
  let y = startYear
  let mm = startNum
  // Límite de seguridad: máx 24 meses para evitar loop infinito ante datos raros.
  for (let i = 0; i < 24; i++) {
    meses.push(`${y}-${String(mm).padStart(2, "0")}`)
    if (y === endYear && mm === endNum) break
    mm += 1
    if (mm > 12) { mm = 1; y += 1 }
  }
  return meses
}

export const SECCIONES_PONDERACION_DESEMPENO = {
  operativo: [
    { nombre: "Primera parte", peso: 40, descripcion: "Evaluación de objetivos productivos y operativos." },
    { nombre: "Segunda parte", peso: 30, descripcion: "Evaluación de cumplimiento de responsabilidades y reglamentos." },
    { nombre: "Tercera parte", peso: 30, descripcion: "Evaluación de competencias y compromisos." },
  ] as const,
  administrativo: [
    { nombre: "Primera parte", peso: 40, descripcion: "Evaluación de metas administrativas y de gestión." },
    { nombre: "Segunda parte", peso: 30, descripcion: "Evaluación de cumplimiento de procesos y comunicación." },
    { nombre: "Tercera parte", peso: 30, descripcion: "Evaluación de competencias y resultados internos." },
  ] as const,
  jefe: [
    { nombre: "Primera parte", peso: 40, descripcion: "Evaluación de liderazgo, seguimiento y resultados del equipo." },
    { nombre: "Segunda parte", peso: 30, descripcion: "Evaluación de gestión de recursos y cumplimiento de metas." },
    { nombre: "Tercera parte", peso: 30, descripcion: "Evaluación de competencias directivas y comunicación." },
  ] as const,
} as const
