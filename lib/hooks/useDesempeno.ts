"use client"

import { useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import {
  OBJETIVOS_POR_PUESTO,
  DEFAULT_OBJETIVOS_POR_TIPO,
  DEFAULT_CUMPLIMIENTO,
  DEFAULT_COMPETENCIAS,
  calcularPonderacion,
  type DesempenoData,
  type CumplimientoItem,
  type Competencia,
} from "@/lib/types/desempeno"
import { getTipoDesempenoByPuesto } from "@/lib/catalogo"

export interface EvaluacionHistorial {
  id: string
  numero_empleado: string
  nombre?: string
  puesto?: string
  evaluador_nombre: string | null
  tipo: string
  periodo: string | null
  calificacion_final: number
  created_at: string
}

export function useDesempeno() {
  const [data, setData] = useState<DesempenoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historial, setHistorial] = useState<EvaluacionHistorial[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const lastEvalId = useRef<string | null>(null)

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

      lastEvalId.current = evalData?.id ?? null

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

  const guardar = useCallback(async (evalData: DesempenoData) => {
    setSaving(true)
    try {
      const ponderacion = calcularPonderacion(evalData)
      const row = {
        numero_empleado: evalData.numero_empleado,
        evaluador_nombre: evalData.evaluador_nombre || null,
        evaluador_puesto: evalData.evaluador_puesto || null,
        tipo: evalData.tipo,
        periodo: evalData.periodo || null,
        objetivos: evalData.objetivos,
        cumplimiento_responsabilidades: evalData.cumplimiento_responsabilidades,
        competencias: evalData.competencias,
        compromisos: evalData.compromisos || null,
        fecha_revision: evalData.fecha_revision || null,
        observaciones: evalData.observaciones || null,
        calificacion_final: ponderacion.calificacionFinal,
      }

      if (lastEvalId.current) {
        const { error: err } = await supabase
          .from("evaluaciones_desempeno")
          .update(row)
          .eq("id", lastEvalId.current)
        if (err) throw err
      } else {
        const { data: inserted, error: err } = await supabase
          .from("evaluaciones_desempeno")
          .insert(row)
          .select("id")
          .single()
        if (err) throw err
        lastEvalId.current = inserted.id
      }

      setData({ ...evalData, calificacion_final: ponderacion.calificacionFinal })
      notify.success("Evaluación guardada")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message
        : typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message)
        : "Error al guardar"
      console.error("[guardar]", e)
      notify.error(msg)
    } finally {
      setSaving(false)
    }
  }, [])

  const fetchHistorial = useCallback(async () => {
    setHistorialLoading(true)
    try {
      const { data: evals, error: err } = await supabase
        .from("evaluaciones_desempeno")
        .select("id, numero_empleado, evaluador_nombre, tipo, periodo, calificacion_final, created_at")
        .order("created_at", { ascending: false })
        .limit(200)

      if (err) throw err

      // Fetch employee names for each unique numero_empleado
      const numeros = [...new Set((evals ?? []).map((e) => e.numero_empleado))]
      const empleadoMap: Record<string, { nombre: string; puesto: string }> = {}

      if (numeros.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("numero, nombre, puesto")
          .in("numero", numeros)
        for (const e of emps ?? []) {
          if (e.numero) empleadoMap[e.numero] = { nombre: e.nombre, puesto: e.puesto || "" }
        }

        const missingNumeros = numeros.filter((n) => !empleadoMap[n])
        if (missingNumeros.length > 0) {
          const { data: niEmps } = await supabase
            .from("nuevo_ingreso")
            .select("numero, nombre, puesto")
            .in("numero", missingNumeros)
          for (const e of niEmps ?? []) {
            if (e.numero) empleadoMap[e.numero] = { nombre: e.nombre, puesto: e.puesto || "" }
          }
        }
      }

      setHistorial(
        (evals ?? []).map((e) => ({
          id: e.id,
          numero_empleado: e.numero_empleado,
          nombre: empleadoMap[e.numero_empleado]?.nombre,
          puesto: empleadoMap[e.numero_empleado]?.puesto,
          evaluador_nombre: e.evaluador_nombre,
          tipo: e.tipo,
          periodo: e.periodo,
          calificacion_final: e.calificacion_final,
          created_at: e.created_at,
        }))
      )
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Error al cargar historial")
    } finally {
      setHistorialLoading(false)
    }
  }, [])

  const cargarEvaluacion = useCallback(async (evalId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: evalRow, error: err } = await supabase
        .from("evaluaciones_desempeno")
        .select("*")
        .eq("id", evalId)
        .single()

      if (err || !evalRow) throw err ?? new Error("Evaluación no encontrada")

      lastEvalId.current = evalRow.id

      // Find employee info
      let nombre = ""
      let puesto = ""
      const { data: emp } = await supabase
        .from("employees")
        .select("nombre, puesto")
        .eq("numero", evalRow.numero_empleado)
        .maybeSingle()
      if (emp) {
        nombre = emp.nombre
        puesto = emp.puesto || ""
      } else {
        const { data: ni } = await supabase
          .from("nuevo_ingreso")
          .select("nombre, puesto")
          .eq("numero", evalRow.numero_empleado)
          .maybeSingle()
        if (ni) {
          nombre = ni.nombre
          puesto = ni.puesto || ""
        }
      }

      const result: DesempenoData = {
        numero_empleado: evalRow.numero_empleado,
        nombre,
        puesto,
        evaluador_nombre: evalRow.evaluador_nombre || "",
        evaluador_puesto: evalRow.evaluador_puesto || "",
        tipo: (evalRow.tipo as DesempenoData["tipo"]) || "operativo",
        periodo: evalRow.periodo || "",
        objetivos: evalRow.objetivos?.length ? evalRow.objetivos : [],
        cumplimiento_responsabilidades: evalRow.cumplimiento_responsabilidades?.length
          ? (evalRow.cumplimiento_responsabilidades as CumplimientoItem[])
          : DEFAULT_CUMPLIMIENTO.map((c) => ({ ...c })),
        competencias: evalRow.competencias?.length
          ? (evalRow.competencias as Competencia[])
          : DEFAULT_COMPETENCIAS.map((c) => ({ ...c })),
        compromisos: evalRow.compromisos || "",
        fecha_revision: evalRow.fecha_revision || "",
        observaciones: evalRow.observaciones || "",
        calificacion_final: evalRow.calificacion_final || 0,
      }

      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      notify.error("Evaluación no encontrada")
    } finally {
      setLoading(false)
    }
  }, [])

  const eliminarEvaluacion = useCallback(async (evalId: string) => {
    const confirmed = await notify.confirm({
      title: "¿Eliminar esta evaluación?",
      description: "Esta acción no se puede deshacer.",
      tone: "destructive",
    })
    if (!confirmed) return false

    try {
      const { error: err } = await supabase
        .from("evaluaciones_desempeno")
        .delete()
        .eq("id", evalId)
      if (err) throw err

      if (lastEvalId.current === evalId) {
        lastEvalId.current = null
        setData(null)
      }
      setHistorial((prev) => prev.filter((e) => e.id !== evalId))
      notify.success("Evaluación eliminada")
      return true
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Error al eliminar")
      return false
    }
  }, [])

  return {
    data, setData, loading, saving, error,
    buscarEmpleado, guardar,
    historial, historialLoading, fetchHistorial,
    cargarEvaluacion, eliminarEvaluacion,
  }
}
