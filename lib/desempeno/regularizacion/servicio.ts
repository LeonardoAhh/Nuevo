import { supabase } from "@/lib/supabase/client"
import { calcularPonderacion, type DesempenoData } from "@/lib/types/desempeno"

export interface EvaluacionVencida {
  numero: string
  nombre: string
  puesto: string
  periodo: string
  fecha_limite: string
  origen: "nuevo_ingreso" | "planta"
  hito_nuevo_ingreso: 1 | 2 | 3 | null
}

export async function cargarEvaluacionesVencidas(): Promise<EvaluacionVencida[]> {
  const { data, error } = await supabase.rpc("desempeno_regularizacion_pendientes")
  if (error) throw error
  return (data ?? []) as EvaluacionVencida[]
}

export async function guardarEvaluacionTardia(
  evaluacion: DesempenoData,
  motivo: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("desempeno_guardar_regularizacion", {
    p_evaluacion: {
      numero_empleado: evaluacion.numero_empleado,
      evaluador_nombre: evaluacion.evaluador_nombre,
      evaluador_puesto: evaluacion.evaluador_puesto,
      tipo: evaluacion.tipo,
      periodo: evaluacion.periodo,
      hito_nuevo_ingreso: evaluacion.hito_nuevo_ingreso ?? null,
      objetivos: evaluacion.objetivos,
      cumplimiento_responsabilidades: evaluacion.cumplimiento_responsabilidades,
      competencias: evaluacion.competencias,
      compromisos: evaluacion.compromisos,
      observaciones: evaluacion.observaciones,
      calificacion_final: calcularPonderacion(evaluacion).calificacionFinal,
    },
    p_motivo: motivo.trim(),
  })
  if (error) throw error
  return data as string
}
