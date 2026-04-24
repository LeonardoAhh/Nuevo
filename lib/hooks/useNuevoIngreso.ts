import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type TipoContrato = 'A prueba' | 'Indeterminado'
export type EstadoRG = 'Pendiente' | 'Entregado'

export interface NuevoIngreso {
  id: string
  numero: string | null
  nombre: string
  puesto: string | null
  departamento: string | null
  area: string | null
  turno: string | null
  fecha_ingreso: string           // YYYY-MM-DD
  curp: string | null
  escolaridad: string | null
  jefe_area: string | null
  eval_1_fecha: string | null
  eval_1_calificacion: number | null
  eval_2_fecha: string | null
  eval_2_calificacion: number | null
  eval_3_fecha: string | null
  eval_3_calificacion: number | null
  termino_contrato: string | null
  tipo_contrato: TipoContrato
  rg_rec_048: EstadoRG
  fecha_vencimiento_rg: string | null
  created_at: string
  updated_at: string
}

export type NuevoIngresoUpdate = Partial<Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'>>


// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de fecha
// ─────────────────────────────────────────────────────────────────────────────


/** YYYY-MM-DD → DD/MM/YYYY para mostrar */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Añade N días a una fecha ISO sin zona horaria */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().split('T')[0]
}

/** Diferencia en días entre hoy y una fecha ISO (negativo = pasado) */
export function daysFromToday(iso: string | null): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  const today = new Date()
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - todayUTC) / 86400000)
}

export type EvalStatus = 'completada' | 'proxima' | 'hoy' | 'vencida' | 'pendiente'

export function evalStatus(fecha: string | null, calificacion: number | null): EvalStatus {
  if (calificacion != null) return 'completada'
  const diff = daysFromToday(fecha)
  if (diff === null) return 'pendiente'
  if (diff < 0) return 'vencida'
  if (diff === 0) return 'hoy'
  if (diff <= 7) return 'proxima'
  return 'pendiente'
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useNuevoIngreso() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable reference so components can depend on it in useEffect / useCallback
  // without triggering re-fetch loops.
  const fetchAll = useCallback(async (): Promise<NuevoIngreso[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('nuevo_ingreso')
        .select('*')
        .order('fecha_ingreso', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as NuevoIngreso[]
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(msg)
      notify.error('Error al cargar registros')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const importRecords = async (raw: unknown[]): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    setError(null)
    try {
      if (raw.length === 0) throw new Error('El array está vacío')
      const { error } = await supabase.from('nuevo_ingreso').insert(raw)
      if (error) throw new Error(error.message)
      notify.success(`${raw.length} registros importados`)
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(msg)
      notify.error('Error al importar')
      return { success: false, error: msg }
    } finally {
      setSaving(false)
    }
  }

  const updateRecord = async (id: string, updates: NuevoIngresoUpdate): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('nuevo_ingreso')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
      notify.success('Registro actualizado')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(msg)
      notify.error('Error al actualizar')
      return { success: false, error: msg }
    } finally {
      setSaving(false)
    }
  }

  const deleteRecord = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    try {
      const { error } = await supabase.from('nuevo_ingreso').delete().eq('id', id)
      if (error) throw new Error(error.message)
      notify.success('Registro eliminado')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      notify.error('Error al eliminar')
      return { success: false, error: msg }
    } finally {
      setSaving(false)
    }
  }

  const createRecord = async (
    data: Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('nuevo_ingreso').insert([data])
      if (error) throw new Error(error.message)
      notify.success('Registro creado')
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(msg)
      notify.error('Error al crear registro')
      return { success: false, error: msg }
    } finally {
      setSaving(false)
    }
  }

  return { loading, saving, error, fetchAll, importRecords, updateRecord, deleteRecord, createRecord }
}
