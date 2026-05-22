"use client"

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'
import { describeSupabaseError } from '@/lib/supabase/errors'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** All supported incidence categories */
export const INCIDENCIA_CATEGORIES = [
  'FALTA INJUSTIFICADA',
  'DIA FESTIVO',
  'FALTAS JUST',
  'SANCIÓN',
  'PERMISO',
  'CAMBIO TURNO',
  'INCAPACIDAD',
  'VACACIÓN',
  'TXT',
  'DESCANSO',
  'PERMISO HORAS',
] as const

export type IncidenciaCategory = (typeof INCIDENCIA_CATEGORIES)[number]

export interface IncidenciaRecord {
  id: string
  numero_empleado: string
  mes: string               // YYYY-MM format
  categoria: IncidenciaCategory
  valor: number
  notas: string | null
  created_at: string
  updated_at: string
}

export type IncidenciaInsert = Omit<IncidenciaRecord, 'id' | 'created_at' | 'updated_at'>
export type IncidenciaUpdate = Partial<Omit<IncidenciaRecord, 'id' | 'created_at' | 'updated_at'>>

/** Shape of a single month's data for one employee (JSON import format) */
export interface IncidenciaMensual {
  numero_empleado: string
  mes: string               // YYYY-MM
  [key: string]: string | number | null | undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/** YYYY-MM → "Enero 2025" */
export function formatMes(ym: string): string {
  const [y, m] = ym.split('-')
  const idx = parseInt(m, 10) - 1
  return `${MONTH_NAMES[idx] ?? m} ${y}`
}

/** Normalize category key from JSON (case-insensitive, trim) */
function normalizeCategory(key: string): IncidenciaCategory | null {
  const normalized = key.trim().toUpperCase()
  return (INCIDENCIA_CATEGORIES as readonly string[]).includes(normalized)
    ? (normalized as IncidenciaCategory)
    : null
}

/** Parse JSON array into insertable records */
export function parseIncidenciasJSON(
  raw: IncidenciaMensual[],
): { records: IncidenciaInsert[]; errors: string[] } {
  const records: IncidenciaInsert[] = []
  const errors: string[] = []

  raw.forEach((item, idx) => {
    if (!item.numero_empleado) {
      errors.push(`Fila ${idx + 1}: falta numero_empleado`)
      return
    }
    if (!item.mes || !/^\d{4}-\d{2}$/.test(item.mes)) {
      errors.push(`Fila ${idx + 1}: mes inválido (usar YYYY-MM)`)
      return
    }

    // Extract category values from object keys
    for (const [key, value] of Object.entries(item)) {
      if (key === 'numero_empleado' || key === 'mes') continue
      const cat = normalizeCategory(key)
      if (!cat) {
        errors.push(`Fila ${idx + 1}: categoría desconocida "${key}"`)
        continue
      }
      const numVal = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
      if (isNaN(numVal)) continue
      records.push({
        numero_empleado: String(item.numero_empleado),
        mes: item.mes,
        categoria: cat,
        valor: numVal,
        notas: null,
      })
    }
  })

  return { records, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useIncidencias() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Fetch all incidencias for a given employee number */
  const fetchByEmpleado = useCallback(async (numero: string): Promise<IncidenciaRecord[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('incidencias')
        .select('*')
        .eq('numero_empleado', numero)
        .order('mes', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as IncidenciaRecord[]
    } catch (err) {
      const msg = describeSupabaseError(err, 'Error al cargar incidencias')
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /** Fetch incidencias for a specific employee and month */
  const fetchByEmpleadoMes = useCallback(async (
    numero: string,
    mes: string,
  ): Promise<IncidenciaRecord[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('incidencias')
        .select('*')
        .eq('numero_empleado', numero)
        .eq('mes', mes)
        .order('categoria')
      if (error) throw new Error(error.message)
      return (data ?? []) as IncidenciaRecord[]
    } catch (err) {
      const msg = describeSupabaseError(err, 'Error al cargar incidencias')
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /** Upsert a single incidencia record (update if exists, insert if not) */
  const upsertRecord = useCallback(async (
    data: IncidenciaInsert,
  ): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    setError(null)
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('incidencias')
        .select('id')
        .eq('numero_empleado', data.numero_empleado)
        .eq('mes', data.mes)
        .eq('categoria', data.categoria)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('incidencias')
          .update({ valor: data.valor, notas: data.notas, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('incidencias')
          .insert([data])
        if (error) throw error
      }
      return { success: true }
    } catch (err) {
      const msg = describeSupabaseError(err, 'Error al guardar incidencia')
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setSaving(false)
    }
  }, [])

  /** Bulk import incidencias from JSON (upsert logic: delete existing month data first) */
  const importBulk = useCallback(async (
    records: IncidenciaInsert[],
  ): Promise<{ success: boolean; error?: string; count: number }> => {
    setSaving(true)
    setError(null)
    try {
      if (records.length === 0) throw new Error('No hay registros para importar')

      // Native upsert leveraging UNIQUE (numero_empleado, mes, categoria)
      const { error } = await supabase
        .from('incidencias')
        .upsert(records, { 
          onConflict: 'numero_empleado,mes,categoria',
          ignoreDuplicates: false // Update existing, insert new
        })
      if (error) throw error

      notify.success(`${records.length} incidencias importadas`)
      return { success: true, count: records.length }
    } catch (err) {
      const msg = describeSupabaseError(err, 'Error al importar incidencias')
      setError(msg)
      notify.error(msg)
      return { success: false, error: msg, count: 0 }
    } finally {
      setSaving(false)
    }
  }, [])

  /** Delete a single record */
  const deleteRecord = useCallback(async (id: string): Promise<{ success: boolean }> => {
    setSaving(true)
    try {
      const { error } = await supabase.from('incidencias').delete().eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err) {
      const msg = describeSupabaseError(err, 'Error al eliminar')
      notify.error(msg)
      return { success: false }
    } finally {
      setSaving(false)
    }
  }, [])

  /** Save all categories for a given employee+month (full replacement) */
  const saveMonth = useCallback(async (
    numero: string,
    mes: string,
    values: Record<IncidenciaCategory, number>,
    notas: Record<IncidenciaCategory, string>,
  ): Promise<{ success: boolean }> => {
    setSaving(true)
    setError(null)
    try {
      // Delete existing month data
      await supabase
        .from('incidencias')
        .delete()
        .eq('numero_empleado', numero)
        .eq('mes', mes)

      // Build inserts for non-zero values
      const inserts: IncidenciaInsert[] = INCIDENCIA_CATEGORIES
        .filter(cat => values[cat] > 0 || (notas[cat] && notas[cat].trim()))
        .map(cat => ({
          numero_empleado: numero,
          mes,
          categoria: cat,
          valor: values[cat] || 0,
          notas: notas[cat]?.trim() || null,
        }))

      if (inserts.length > 0) {
        const { error } = await supabase.from('incidencias').insert(inserts)
        if (error) throw error
      }

      notify.success('Incidencias guardadas')
      return { success: true }
    } catch (err) {
      const msg = describeSupabaseError(err, 'Error al guardar incidencias')
      setError(msg)
      notify.error(msg)
      return { success: false }
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    loading,
    saving,
    error,
    fetchByEmpleado,
    fetchByEmpleadoMes,
    upsertRecord,
    importBulk,
    deleteRecord,
    saveMonth,
  }
}
