import { normalizarPeriodoDesempeno } from "@/lib/catalogo"
import { periodoMensualDeFecha } from "./evaluaciones-guardadas"

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

export function resolverHitoNuevoIngreso(registro: SeguimientoNuevoIngreso, periodo: string, hoy = new Date()): EstadoHitoNuevoIngreso {
  const normalizado = normalizarPeriodoDesempeno(periodo)
  const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`
  for (const hito of HITOS_NUEVO_INGRESO) {
    const fecha = registro[hito.fecha]
    if (registro[hito.calificacion] !== null || !fecha) continue
    if (fecha < fechaHoy) return { estado: "vencido", hito }
    if (fecha > fechaHoy || normalizarPeriodoDesempeno(periodoMensualDeFecha(fecha) ?? "") !== normalizado) {
      return { estado: "proximo", hito }
    }
    return { estado: "disponible", hito }
  }
  return { estado: "sin_pendientes", hito: null }
}
