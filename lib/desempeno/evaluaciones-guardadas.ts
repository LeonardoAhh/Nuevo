import { getPeriodosDesempeno, normalizarPeriodoDesempeno } from "@/lib/catalogo"
import { supabase } from "@/lib/supabase/client"

/** El mes de la fecha programada determina el mes final del periodo mensual. */
export function periodoMensualDeFecha(fecha: string | null): string | null {
  const match = fecha?.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return getPeriodosDesempeno(year).mensuales[month - 1]
}

/** Consulta las evaluaciones guardadas sin depender de los campos de calificación de nuevo_ingreso. */
export async function cargarPeriodosGuardados(numeros: Array<string | null>): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>()
  const unique = [...new Set(numeros.filter((numero): numero is string => Boolean(numero)))]
  const batchSize = 100
  const pageSize = 1000

  for (let start = 0; start < unique.length; start += batchSize) {
    const batch = unique.slice(start, start + batchSize)
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("evaluaciones_desempeno")
        .select("id, numero_empleado, periodo")
        .in("numero_empleado", batch)
        .order("id")
        .range(offset, offset + pageSize - 1)
      if (error) throw error
      for (const row of data ?? []) {
        if (!row.numero_empleado || !row.periodo) continue
        const periods = result.get(row.numero_empleado) ?? new Set<string>()
        periods.add(normalizarPeriodoDesempeno(row.periodo))
        result.set(row.numero_empleado, periods)
      }
      if ((data?.length ?? 0) < pageSize) break
    }
  }

  return result
}

export function tieneEvaluacionGuardada(
  periodos: Map<string, Set<string>>,
  numero: string | null,
  fecha: string | null,
): boolean {
  if (!numero) return false
  const periodo = periodoMensualDeFecha(fecha)
  return periodo ? (periodos.get(numero)?.has(normalizarPeriodoDesempeno(periodo)) ?? false) : false
}
