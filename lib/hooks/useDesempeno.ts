"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import {
  OBJETIVOS_POR_PUESTO,
  DEFAULT_OBJETIVOS_POR_TIPO,
  DEFAULT_CUMPLIMIENTO,
  DEFAULT_COMPETENCIAS,
  type DesempenoData,
  type CumplimientoItem,
  type Competencia,
} from "@/lib/types/desempeno"
import { getTipoDesempenoByPuesto } from "@/lib/catalogo"

export function useDesempeno() {
  const [data, setData] = useState<DesempenoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscarEmpleado = useCallback(async (numero: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: emp } = await supabase
        .from("employees")
        .select("id, numero, nombre, puesto")
        .eq("numero", numero)
        .single()

      if (!emp) throw new Error("Empleado no encontrado")

      const { data: evalData } = await supabase
        .from("evaluaciones_desempeno")
        .select("*")
        .eq("numero_empleado", numero)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const { data: incidenciaData, error: incidenciaError } = await supabase
        .from("incidencias")
        .select("categoria, valor, notas, mes")
        .eq("numero_empleado", numero)
        .order("mes", { ascending: false })

      if (incidenciaError) throw incidenciaError

      const puesto = emp.puesto || ""
      const tipoPuesto = getTipoDesempenoByPuesto(puesto)
      const objetivosFallback = OBJETIVOS_POR_PUESTO[puesto]
        ?? DEFAULT_OBJETIVOS_POR_TIPO[tipoPuesto]

      // Map cumplimiento from saved data or use defaults
      const cumplimiento: CumplimientoItem[] = evalData?.cumplimiento_responsabilidades?.length
        ? (evalData.cumplimiento_responsabilidades as CumplimientoItem[])
        : DEFAULT_CUMPLIMIENTO.map((c) => ({ ...c }))

      // Map competencias from saved data or use defaults
      const competencias: Competencia[] = evalData?.competencias?.length
        ? (evalData.competencias as Competencia[])
        : DEFAULT_COMPETENCIAS.map((c) => ({ ...c }))

      const result: DesempenoData = {
        numero_empleado: emp.numero!,
        nombre: emp.nombre,
        puesto,
        evaluador_nombre: evalData?.evaluador_nombre || "",
        evaluador_puesto: evalData?.evaluador_puesto || "",
        tipo: (evalData?.tipo as DesempenoData["tipo"]) || tipoPuesto,
        periodo: evalData?.periodo || "",
        objetivos: evalData?.objetivos?.length
          ? evalData.objetivos
          : objetivosFallback.map((obj) => ({ ...obj })),
        cumplimiento_responsabilidades: cumplimiento,
        competencias,
        compromisos: evalData?.compromisos || "",
        fecha_revision: evalData?.fecha_revision || "",
        observaciones: evalData?.observaciones || "",
        calificacion_final: evalData?.calificacion_final || 0,
        incidencias: (incidenciaData ?? []).map((item: Record<string, unknown>) => ({
          categoria: (item.categoria as string) ?? "",
          valor: (item.valor as number) ?? null,
          notas: (item.notas as string) ?? null,
          mes: (item.mes as string) ?? null,
        })),
      }

      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      notify.error("Empleado no encontrado")
    } finally {
      setLoading(false)
    }
  }, [])

  const guardar = useCallback(async (_data: DesempenoData) => {
    // TODO: upsert evaluaciones_desempeno
  }, [])

  return { data, setData, loading, error, buscarEmpleado, guardar }
}
