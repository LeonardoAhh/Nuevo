"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

export interface PreguntaExamen {
  id: string
  departamento: string
  pregunta: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  respuesta_correcta: "a" | "b" | "c"
  created_at: string
}

export type PreguntaInsert = Omit<PreguntaExamen, "id" | "created_at">
export type PreguntaUpdate = Partial<PreguntaInsert>

export function useExamenes() {
  const [preguntas, setPreguntas] = useState<PreguntaExamen[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscar = useCallback(async (term: string) => {
    if (!term.trim()) {
      setPreguntas([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from("preguntas_examen")
        .select("*")
        .or(`pregunta.ilike.%${term}%,departamento.ilike.%${term}%,opcion_a.ilike.%${term}%,opcion_b.ilike.%${term}%,opcion_c.ilike.%${term}%`)
        .order("departamento")
        .order("created_at", { ascending: false })
      if (err) throw err
      setPreguntas(data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al buscar preguntas")
    } finally {
      setLoading(false)
    }
  }, [])

  const crear = useCallback(async (pregunta: PreguntaInsert) => {
    const { data, error: err } = await supabase
      .from("preguntas_examen")
      .insert(pregunta)
      .select()
      .single()
    if (err) throw err
    setPreguntas((prev) => [data, ...prev])
    return data as PreguntaExamen
  }, [])

  const actualizar = useCallback(async (id: string, cambios: PreguntaUpdate) => {
    const { data, error: err } = await supabase
      .from("preguntas_examen")
      .update(cambios)
      .eq("id", id)
      .select()
      .single()
    if (err) throw err
    setPreguntas((prev) => prev.map((p) => (p.id === id ? (data as PreguntaExamen) : p)))
    return data as PreguntaExamen
  }, [])

  const eliminar = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from("preguntas_examen")
      .delete()
      .eq("id", id)
    if (err) throw err
    setPreguntas((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const normalizarDepartamentos = useCallback(async () => {
    // Trae todas las preguntas y actualiza las que tengan departamento en minúsculas
    const { data, error: err } = await supabase
      .from("preguntas_examen")
      .select("id, departamento")
    if (err) throw err
    const filas = (data ?? []) as { id: string; departamento: string }[]
    const aActualizar = filas.filter((f) => f.departamento !== f.departamento.toUpperCase())
    await Promise.all(
      aActualizar.map((f) =>
        supabase
          .from("preguntas_examen")
          .update({ departamento: f.departamento.toUpperCase() })
          .eq("id", f.id)
      )
    )
    return aActualizar.length
  }, [])

  return { preguntas, loading, error, buscar, crear, actualizar, eliminar, normalizarDepartamentos }
}
