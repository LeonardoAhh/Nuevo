export type HitoNuevoIngreso = 1 | 2 | 3

export interface SeguimientoNuevoIngreso {
  eval_1_fecha: string | null
  eval_1_calificacion: number | null
  eval_2_fecha: string | null
  eval_2_calificacion: number | null
  eval_3_fecha: string | null
  eval_3_calificacion: number | null
}

export const HITOS_NUEVO_INGRESO = [
  { numero: 1, etiqueta: "1er mes", fecha: "eval_1_fecha", calificacion: "eval_1_calificacion" },
  { numero: 2, etiqueta: "2.º mes", fecha: "eval_2_fecha", calificacion: "eval_2_calificacion" },
  { numero: 3, etiqueta: "3er mes", fecha: "eval_3_fecha", calificacion: "eval_3_calificacion" },
] as const

export type EstadoHitoNuevoIngreso =
  | { estado: "disponible" | "vencido" | "proximo"; hito: typeof HITOS_NUEVO_INGRESO[number] }
  | { estado: "sin_pendientes"; hito: null }

export function estadoVentanaEvaluacion(numero: HitoNuevoIngreso, diasRestantes: number): "disponible" | "vencido" | "proximo" {
  if (!Number.isFinite(diasRestantes)) return "proximo"
  const diasAntes = numero === 3 ? 15 : 1
  const diasDespues = numero === 3 ? 0 : 1
  if (diasRestantes < -diasDespues) return "vencido"
  if (diasRestantes > diasAntes) return "proximo"
  return "disponible"
}

function diasHastaFecha(fecha: string, hoy: Date): number | null {
  const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const anio = Number(match[1])
  const mes = Number(match[2])
  const dia = Number(match[3])
  const fechaProgramada = new Date(Date.UTC(anio, mes - 1, dia))
  if (
    fechaProgramada.getUTCFullYear() !== anio ||
    fechaProgramada.getUTCMonth() !== mes - 1 ||
    fechaProgramada.getUTCDate() !== dia
  ) return null

  const fechaActual = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return (Date.UTC(anio, mes - 1, dia) - fechaActual) / 86_400_000
}

export function resolverHitoNuevoIngreso(registro: SeguimientoNuevoIngreso, hoy = new Date()): EstadoHitoNuevoIngreso {
  for (const hito of HITOS_NUEVO_INGRESO) {
    const fecha = registro[hito.fecha]
    if (registro[hito.calificacion] !== null || !fecha) continue
    const diasRestantes = diasHastaFecha(fecha, hoy)
    if (diasRestantes === null) return { estado: "proximo", hito }
    return { estado: estadoVentanaEvaluacion(hito.numero, diasRestantes), hito }
  }
  return { estado: "sin_pendientes", hito: null }
}
