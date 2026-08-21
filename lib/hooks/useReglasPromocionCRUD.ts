"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

export interface ReglaPromocionRow {
  id: string
  puesto: string
  promocion_a: string | null
  min_temporalidad_meses: number
  min_calificacion_examen: number
  min_calificacion_evaluacion: number
  min_porcentaje_cursos: number
  descripcion: string | null
  activo: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface ReglaPromocionInput {
  id?: string
  puesto: string
  promocion_a: string | null
  min_temporalidad_meses: number
  min_calificacion_examen: number
  min_calificacion_evaluacion: number
  min_porcentaje_cursos: number
  descripcion: string | null
  activo: boolean
}

export function useReglasPromocionCRUD(onChange?: () => void) {
  const [reglas, setReglas] = useState<ReglaPromocionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from("reglas_promocion")
        .select("*")
        .order("puesto")
      if (err) throw err
      setReglas((data as ReglaPromocionRow[]) ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar reglas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = useCallback(
    async (input: ReglaPromocionInput): Promise<void> => {
      const payload = {
        puesto: input.puesto.trim(),
        promocion_a: input.promocion_a?.trim() || null,
        min_temporalidad_meses: input.min_temporalidad_meses,
        min_calificacion_examen: input.min_calificacion_examen,
        min_calificacion_evaluacion: input.min_calificacion_evaluacion,
        min_porcentaje_cursos: input.min_porcentaje_cursos,
        descripcion: input.descripcion?.trim() || null,
        activo: input.activo,
        updated_at: new Date().toISOString(),
      }
      const { data, error: err } = await supabase
        .from("reglas_promocion")
        .upsert(payload, { onConflict: "puesto" })
        .select()
        .single()
      if (err) {
        notify.error("Error al guardar regla")
        throw new Error(err.message)
      }
      const row = data as ReglaPromocionRow
      setReglas((prev) => {
        const idx = prev.findIndex((r) => r.puesto === row.puesto)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = row
          return next
        }
        return [...prev, row].sort((a, b) => a.puesto.localeCompare(b.puesto))
      })
      notify.success(input.id ? "Regla actualizada" : "Regla creada")
      onChange?.()
    },
    [onChange]
  )

  const eliminar = useCallback(
    async (id: string): Promise<void> => {
      const { error: err } = await supabase
        .from("reglas_promocion")
        .delete()
        .eq("id", id)
      if (err) {
        notify.error("Error al eliminar regla")
        throw new Error(err.message)
      }
      setReglas((prev) => prev.filter((r) => r.id !== id))
      notify.success("Regla eliminada")
      onChange?.()
    },
    [onChange]
  )

  const toggleActivo = useCallback(
    async (id: string, activo: boolean): Promise<void> => {
      const { error: err } = await supabase
        .from("reglas_promocion")
        .update({ activo, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (err) {
        notify.error("Error al cambiar estado")
        throw new Error(err.message)
      }
      setReglas((prev) => prev.map((r) => (r.id === id ? { ...r, activo } : r)))
      notify.success(activo ? "Regla activada" : "Regla desactivada")
      onChange?.()
    },
    [onChange]
  )

  return { reglas, loading, error, recargar: cargar, guardar, eliminar, toggleActivo }
}
