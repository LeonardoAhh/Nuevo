"use client"

import { useCallback, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { describeSupabaseError } from "@/lib/supabase/errors"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ActaTipo = "ACTA ADMINISTRATIVA" | "PLAN DE SEGUIMIENTO"
export type ActaEstatus = "ACTIVO" | "EN SEGUIMIENTO" | "CERRADO"

export const ACTA_TIPOS: ActaTipo[] = ["ACTA ADMINISTRATIVA", "PLAN DE SEGUIMIENTO"]
export const ACTA_ESTATUSES: ActaEstatus[] = ["ACTIVO", "EN SEGUIMIENTO", "CERRADO"]

export interface ActaSeguimiento {
  id: string
  numero_empleado: string
  tipo: ActaTipo
  fecha: string           // ISO date (YYYY-MM-DD)
  descripcion: string | null
  fecha_seguimiento: string | null  // ISO date
  estatus: ActaEstatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ActaSeguimientoInsert = Omit<ActaSeguimiento, "id" | "created_at" | "updated_at">
export type ActaSeguimientoUpdate = Partial<Omit<ActaSeguimiento, "id" | "created_at" | "updated_at" | "numero_empleado">>

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useActasSeguimiento() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Fetch all actas/planes for a given employee number, newest first */
  const fetchByEmpleado = useCallback(async (numero: string): Promise<ActaSeguimiento[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from("actas_seguimiento")
        .select("*")
        .eq("numero_empleado", numero)
        .order("fecha", { ascending: false })
      if (dbError) throw new Error(dbError.message)
      return (data ?? []) as ActaSeguimiento[]
    } catch (err) {
      const msg = describeSupabaseError(err, "Error al cargar actas/planes")
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /** Insert a new acta or plan de seguimiento */
  const create = useCallback(
    async (payload: ActaSeguimientoInsert): Promise<{ success: boolean; error?: string }> => {
      setSaving(true)
      setError(null)
      try {
        const { error: dbError } = await supabase
          .from("actas_seguimiento")
          .insert([payload])
        if (dbError) throw new Error(dbError.message)
        return { success: true }
      } catch (err) {
        const msg = describeSupabaseError(err, "Error al guardar")
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  /** Update estatus or any field by id */
  const update = useCallback(
    async (id: string, patch: ActaSeguimientoUpdate): Promise<{ success: boolean; error?: string }> => {
      setSaving(true)
      setError(null)
      try {
        const { error: dbError } = await supabase
          .from("actas_seguimiento")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id)
        if (dbError) throw new Error(dbError.message)
        return { success: true }
      } catch (err) {
        const msg = describeSupabaseError(err, "Error al actualizar")
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  /** Delete an acta/plan by id */
  const remove = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      setSaving(true)
      setError(null)
      try {
        const { error: dbError } = await supabase
          .from("actas_seguimiento")
          .delete()
          .eq("id", id)
        if (dbError) throw new Error(dbError.message)
        return { success: true }
      } catch (err) {
        const msg = describeSupabaseError(err, "Error al eliminar")
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  return { loading, saving, error, fetchByEmpleado, create, update, remove }
}

/** Fetch all open actas/planes across all employees (for global dashboard) */
export async function fetchActasAbiertas(): Promise<ActaSeguimiento[]> {
  const { data, error } = await supabase
    .from("actas_seguimiento")
    .select("*")
    .in("estatus", ["ACTIVO", "EN SEGUIMIENTO"])
    .order("fecha_seguimiento", { ascending: true, nullsFirst: false })
  if (error) return []
  return (data ?? []) as ActaSeguimiento[]
}
