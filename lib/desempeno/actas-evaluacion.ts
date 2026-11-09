import { mesesDePeriodo } from "@/lib/catalogo"
import { CumplimientoOperativoIndex, type DesempenoData } from "@/lib/types/desempeno"
import { supabase } from "@/lib/supabase/client"

export function calcularPorcentajePorCantidad(cantidad: number): number {
  if (!Number.isSafeInteger(cantidad) || cantidad < 0) {
    throw new RangeError("La cantidad debe ser un entero no negativo.")
  }
  if (cantidad === 0) return 100
  if (cantidad === 1) return 66
  if (cantidad === 2) return 33
  return 0
}

export async function aplicarActasDelPeriodo(data: DesempenoData): Promise<DesempenoData> {
  const index = CumplimientoOperativoIndex.Compromisos
  if (data.tipo === "jefe" || !data.cumplimiento_responsabilidades[index]) return data

  const meses = mesesDePeriodo(data.periodo)
  if (meses.length === 0) {
    throw new Error(`No se puede determinar el rango de fechas del periodo "${data.periodo}".`)
  }

  const fechaInicio = `${meses[0]}-01`
  const [ultimoAnio, ultimoMes] = meses[meses.length - 1].split("-").map(Number)
  const fechaFin = new Date(Date.UTC(ultimoAnio, ultimoMes, 1)).toISOString().slice(0, 10)
  const { count, error } = await supabase
    .from("actas_seguimiento")
    .select("id", { count: "exact", head: true })
    .eq("numero_empleado", data.numero_empleado)
    .eq("tipo", "ACTA ADMINISTRATIVA")
    .gte("fecha", fechaInicio)
    .lt("fecha", fechaFin)

  if (error) throw error
  if (count === null) throw new Error("La consulta de actas no devolvió un conteo.")

  const cumplimiento_responsabilidades = data.cumplimiento_responsabilidades.map((item, itemIndex) =>
    itemIndex === index
      ? { ...item, porcentaje: String(calcularPorcentajePorCantidad(count)), no_aplica: false }
      : item
  )

  return { ...data, cumplimiento_responsabilidades }
}

export async function aplicarIncumplimientosReglamentoDelPeriodo(data: DesempenoData): Promise<DesempenoData> {
  const index = CumplimientoOperativoIndex.Reglamento
  if (data.tipo === "jefe" || !data.cumplimiento_responsabilidades[index]) return data

  const meses = mesesDePeriodo(data.periodo)
  if (meses.length === 0) {
    throw new Error(`No se puede determinar el rango de fechas del periodo "${data.periodo}".`)
  }

  const { data: registros, error } = await supabase
    .from("incumplimientos_reglamento")
    .select("cantidad")
    .eq("numero_empleado", data.numero_empleado)
    .in("mes", meses)

  if (error) throw error

  const cantidad = (registros ?? []).reduce((total, registro) => total + registro.cantidad, 0)
  const cumplimiento_responsabilidades = data.cumplimiento_responsabilidades.map((item, itemIndex) =>
    itemIndex === index
      ? { ...item, porcentaje: String(calcularPorcentajePorCantidad(cantidad)), no_aplica: false }
      : item
  )

  return { ...data, cumplimiento_responsabilidades }
}
