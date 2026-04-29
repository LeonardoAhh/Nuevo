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
      // Search in both employees and nuevo_ingreso tables
      const { data: emp } = await supabase
        .from("employees")
        .select("id, numero, nombre, puesto")
        .eq("numero", numero)
        .maybeSingle()

      let empleadoData: { numero: string; nombre: string; puesto: string } | null = null

      if (emp) {
        empleadoData = { numero: emp.numero!, nombre: emp.nombre, puesto: emp.puesto || "" }
      } else {
        const { data: ni } = await supabase
          .from("nuevo_ingreso")
          .select("numero, nombre, puesto")
          .eq("numero", numero)
          .maybeSingle()
        if (ni) {
          empleadoData = { numero: ni.numero!, nombre: ni.nombre, puesto: ni.puesto || "" }
        }
      }

      if (!empleadoData) throw new Error("Empleado no encontrado")

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

      const puesto = empleadoData.puesto
      const tipoPuesto = getTipoDesempenoByPuesto(puesto)
      const objetivosFallback = OBJETIVOS_POR_PUESTO[puesto]
        ?? DEFAULT_OBJETIVOS_POR_TIPO[tipoPuesto]

      // Auto-calculate cumplimiento from incidencias
      const incidencias = incidenciaData ?? []
      const tieneFaltaInjustificada = incidencias.some(
        (i: Record<string, unknown>) => i.categoria === 'FALTA INJUSTIFICADA' && (i.valor as number) > 0
      )
      // Group PERMISO + TXT + PERMISO HORAS by month, check if any month > 2
      const permisoCats = ['PERMISO', 'TXT', 'PERMISO HORAS']
      const permisosPorMes: Record<string, number> = {}
      for (const i of incidencias) {
        const cat = i.categoria as string
        if (permisoCats.includes(cat)) {
          const mes = (i.mes as string) ?? ''
          permisosPorMes[mes] = (permisosPorMes[mes] ?? 0) + ((i.valor as number) ?? 0)
        }
      }
      const tieneExcesoPermisos = Object.values(permisosPorMes).some((total) => total > 2)

      // Map cumplimiento from saved data or use defaults
      const cumplimiento: CumplimientoItem[] = evalData?.cumplimiento_responsabilidades?.length
        ? (evalData.cumplimiento_responsabilidades as CumplimientoItem[])
        : DEFAULT_CUMPLIMIENTO.map((c) => ({ ...c }))

      // Override auto-calculated fields (index 2 = asistencia, index 4 = permisos)
      if (cumplimiento[2]) {
        cumplimiento[2].porcentaje = tieneFaltaInjustificada ? "NO CUMPLE" : "CUMPLE"
      }
      if (cumplimiento[4]) {
        cumplimiento[4].porcentaje = tieneExcesoPermisos ? "NO CUMPLE" : "CUMPLE"
      }

      // Map competencias from saved data or use defaults
      const competencias: Competencia[] = evalData?.competencias?.length
        ? (evalData.competencias as Competencia[])
        : DEFAULT_COMPETENCIAS.map((c) => ({ ...c }))

      const result: DesempenoData = {
        numero_empleado: empleadoData.numero,
        nombre: empleadoData.nombre,
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
