import { calcularPonderacion, type DesempenoData } from "@/lib/types/desempeno"

/** Consulta documental: conserva el total persistido y la interpretación histórica de ceros. */
export function ponderacionParaImpresion(data: DesempenoData) {
  const ponderacion = calcularPonderacion({
    ...data,
    competencias: data.competencias.map(item => ({
      ...item,
      evaluada: item.evaluada ?? item.calificacion > 0,
    })),
  })
  return { ...ponderacion, calificacionFinal: data.calificacion_final }
}

export function porcentajeParaImpresion(
  item: { porcentaje: string; no_aplica?: boolean },
  blankMode = false,
): string {
  if (blankMode) return "\u00a0"
  if (item.no_aplica === true) return "NA"
  return item.porcentaje.trim() || "—"
}

export function fechaParaImpresion(fecha: string): string {
  // Evita conversiones de zona horaria; conserva las fechas históricas de texto libre.
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha.split("-").reverse().join("/") : fecha
}
