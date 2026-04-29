"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import type { DesempenoData } from "@/lib/types/desempeno"
import { getTipoDesempenoByPuesto } from "@/lib/catalogo"

export function useDesempeno() {
  const [data, setData] = useState<DesempenoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar empleado por numero
  const buscarEmpleado = useCallback(async (numero: string) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Buscar empleado base
      const { data: emp } = await supabase
        .from("employees")
        .select("id, numero, nombre, puesto")
        .eq("numero", numero)
        .single()

      if (!emp) throw new Error("Empleado no encontrado")

      // 2. Buscar evaluación existente
      const { data: evalData } = await supabase
        .from("evaluaciones_desempeno")
        .select("*")
        .eq("numero_empleado", numero)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // 3. Buscar incidencias relacionadas
      const { data: incidenciaData, error: incidenciaError } = await supabase
        .from("incidencias")
        .select("categoria, valor, notas, mes")
        .eq("numero_empleado", numero)
        .order("mes", { ascending: false })

      if (incidenciaError) throw incidenciaError

      const tipoPuesto = getTipoDesempenoByPuesto(emp.puesto || "")
      const result: DesempenoData = {
        numero_empleado: emp.numero!,
        nombre: emp.nombre,
        puesto: emp.puesto || "",
        evaluador_nombre: evalData?.evaluador_nombre || "",
        evaluador_puesto: evalData?.evaluador_puesto || "",
        tipo: (evalData?.tipo as any) || tipoPuesto,
        periodo: evalData?.periodo || "",
        objetivos: evalData?.objetivos || [],
        cumplimiento_responsabilidades: evalData?.cumplimiento_responsabilidades || [],
        competencias: evalData?.competencias || [],
        compromisos: evalData?.compromisos || "",
        fecha_revision: evalData?.fecha_revision || "",
        observaciones: evalData?.observaciones || "",
        calificacion_final: evalData?.calificacion_final || 0,
        incidencias: (incidenciaData ?? []).map((item: any) => ({
          categoria: item.categoria ?? "",
          valor: item.valor ?? null,
          notas: item.notas ?? null,
          mes: item.mes ?? null,
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

  // Guardar evaluación
  const guardar = useCallback(async (data: DesempenoData) => {
    // TODO: upsert evaluaciones_desempeno
  }, [])

  return { data, loading, error, buscarEmpleado, guardar }
}
