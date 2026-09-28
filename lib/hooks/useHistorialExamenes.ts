"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import type { PreguntaExamen } from "./useExamenes"

export interface ExamenHistorial {
  id: string
  empleado_id: string
  departamento: string
  categoria_actual: string
  categoria_destino: string
  preguntas: PreguntaExamen[]
  created_at: string
  empleado?: {
    nombre: string
    numero: string | null
  } | null
}

export function useHistorialExamenes() {
  const [examenes, setExamenes] = useState<ExamenHistorial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async (term: string) => {
    setLoading(true)
    setError(null)
    try {
      // Traemos los últimos 100 exámenes generados
      const { data, error: err } = await supabase
        .from("historial_examenes")
        .select(`
          *,
          empleado:employees(nombre, numero)
        `)
        .order("created_at", { ascending: false })
        .limit(100)
      
      if (err) throw err
      
      let resultados = (data as any) ?? []
      
      // Filtrado en el cliente para búsqueda rápida (por folio o nombre)
      if (term.trim()) {
        const t = term.trim().toLowerCase()
        resultados = resultados.filter((ex: any) => 
          ex.id.toLowerCase().includes(t) ||
          ex.empleado?.nombre?.toLowerCase().includes(t) ||
          ex.empleado?.numero?.toLowerCase().includes(t)
        )
      }

      setExamenes(resultados as ExamenHistorial[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar historial")
      notify.error("Error al cargar historial de exámenes")
    } finally {
      setLoading(false)
    }
  }, [])

  const eliminar = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("historial_examenes")
        .delete()
        .eq("id", id)

      if (error) throw error

      setExamenes((prev) => prev.filter((ex) => ex.id !== id))
      notify.success("Examen eliminado correctamente")
      return true
    } catch (e: unknown) {
      console.error(e)
      notify.error("Error al eliminar el examen")
      return false
    }
  }, [])

  return { examenes, loading, error, buscar, eliminar }
}
