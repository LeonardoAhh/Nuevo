import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type TipoContrato = 'A prueba' | 'Indeterminado'
export type EstadoRG     = 'Pendiente' | 'Entregado'

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

export interface RawNuevoIngresoRecord {
  'N.N': string
  'Nombre': string
  'Puesto': string
  'Departamento': string
  'Área': string
  'Turno': string
  'Fecha Ingreso': string | number
  'CURP': string
  'Escolaridad': string
  'Jefe de Área': string
  'Evaluación 1r Mes': string
  'Calificación Obtenida': string
  'Evaluación 2o Mes': string
  'Evaluación 3r Mes': string
  'Término de Contrato': string
  'Tipo de Contrato': string
  'RG-REC-048': string
  'Fecha Vencimiento RG-REC-048': string
  [key: string]: string | number
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de fecha
// ─────────────────────────────────────────────────────────────────────────────

/** Convierte número serial de Excel a YYYY-MM-DD sin conversión de zona horaria */
export function excelSerialToISO(serial: number): string {
  // Excel epoch = Dec 30, 1899; ajuste por bug año bisiesto 1900
  const ms   = Math.round((serial - 25569) * 86400 * 1000)
  const date = new Date(ms)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Convierte DD/MM/YYYY → YYYY-MM-DD */
export function parseDMY(s: string): string | null {
  if (!s?.trim()) return null
  const parts = s.trim().split('/')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return null
}

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
  const today  = new Date()
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - todayUTC) / 86400000)
}

export type EvalStatus = 'completada' | 'proxima' | 'hoy' | 'vencida' | 'pendiente'

export function evalStatus(fecha: string | null, calificacion: number | null): EvalStatus {
  if (calificacion != null) return 'completada'
  const diff = daysFromToday(fecha)
  if (diff === null) return 'pendiente'
  if (diff < 0)  return 'vencida'
  if (diff === 0) return 'hoy'
  if (diff <= 7)  return 'proxima'
  return 'pendiente'
}

// ─────────────────────────────────────────────────────────────────────────────
// Parseo del JSON raw
// ─────────────────────────────────────────────────────────────────────────────

export function parseNuevoIngresoRecord(r: RawNuevoIngresoRecord): Omit<NuevoIngreso, 'id' | 'created_at' | 'updated_at'> {
  // Normaliza claves — el JSON puede venir con distintas variantes
  const nombre  = (r['Nombre'] || r['Nombre Completo'] || r['NOMBRE'] || '')?.trim()
  const numero  = (r['N.N'] || r['ID'] || r['Numero'] || r['N'] || '')?.toString().trim() || null
  const rawFecha = r['Fecha Ingreso'] || r['Fecha ingreso'] || r['FECHA INGRESO'] || ''
  let fechaIngreso: string
  if (typeof rawFecha === 'number' || (typeof rawFecha === 'string' && /^\d{4,5}$/.test(rawFecha.trim()))) {
    fechaIngreso = excelSerialToISO(Number(rawFecha))
  } else {
    fechaIngreso = parseDMY(String(rawFecha)) ?? new Date().toISOString().split('T')[0]
  }

  // Evaluaciones: usa las del JSON si existen, sino calcula
  const eval1   = parseDMY(r['Evaluación 1r Mes']  || r['Evaluacion 1r Mes']  || '') ?? addDays(fechaIngreso, 30)
  const eval2   = parseDMY(r['Evaluación 2o Mes']  || r['Evaluacion 2o Mes']  || '') ?? addDays(fechaIngreso, 60)
  const eval3   = parseDMY(r['Evaluación 3r Mes']  || r['Evaluacion 3r Mes']  || '') ?? addDays(fechaIngreso, 80)
  const termino = parseDMY(r['Término de Contrato'] || r['Termino de Contrato'] || '') ?? addDays(fechaIngreso, 90)
  const vencRG  = parseDMY(r['Fecha Vencimiento RG-REC-048'] || r['Fecha Vencimiento RG REC 048'] || '') ?? addDays(fechaIngreso, 91)

  const parseCal = (keys: string[]): number | null => {
    for (const k of keys) {
      const v = r[k]?.toString().trim()
      if (v && !isNaN(Number(v))) return Number(v)
    }
    return null
  }
  const cal1 = parseCal(['Calificación Obtenida 1er Mes', 'Calificacion Obtenida 1er Mes', 'Calificación Obtenida'])
  const cal2 = parseCal(['Calificación Obtenida 2o Mes',  'Calificacion Obtenida 2o Mes'])
  const cal3 = parseCal(['Calificación Obtenida 3r Mes',  'Calificacion Obtenida 3r Mes'])

  const tipoRaw = (r['Tipo de Contrato'] || '')?.toString().trim()
  const tipo: TipoContrato = tipoRaw === 'Indeterminado' ? 'Indeterminado' : 'A prueba'

  const rgRaw = (r['RG-REC-048'] || '')?.toString().trim()
  const rg: EstadoRG = rgRaw === 'Entregado' ? 'Entregado' : 'Pendiente'

  const str = (keys: string[]) => {
    for (const k of keys) { const v = r[k]?.toString().trim(); if (v) return v }
    return null
  }

  return {
    numero,
    nombre,
    puesto:               str(['Puesto', 'PUESTO']),
    departamento:         str(['Departamento', 'DEPARTAMENTO']),
    area:                 str(['Área', 'Area', 'ÁREA']),
    turno:                str(['Turno', 'TURNO']),
    fecha_ingreso:        fechaIngreso,
    curp:                 str(['CURP']),
    escolaridad:          str(['Escolaridad', 'ESCOLARIDAD']),
    jefe_area:            str(['Jefe de Área', 'Jefe de Area', 'Jefe Area', 'Jefe de Área']),
    eval_1_fecha:         eval1,
    eval_1_calificacion:  cal1,
    eval_2_fecha:         eval2,
    eval_2_calificacion:  cal2,
    eval_3_fecha:         eval3,
    eval_3_calificacion:  cal3,
    termino_contrato:     termino,
    tipo_contrato:        tipo,
    rg_rec_048:           rg,
    fecha_vencimiento_rg: vencRG,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useNuevoIngreso() {
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const fetchAll = async (): Promise<NuevoIngreso[]> => {
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
      return []
    } finally {
      setLoading(false)
    }
  }

  const importRecords = async (raw: RawNuevoIngresoRecord[]): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    setError(null)
    try {
      const records = raw
        .filter(r => (r['Nombre'] || r['Nombre Completo'] || r['NOMBRE'])?.toString().trim())
        .map(r => {
          try { return parseNuevoIngresoRecord(r) }
          catch(e) { return null }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)

      // Separa los que tienen número (upsert por numero) y los que no (insert directo)
      const withNumero    = records.filter(r => r.numero)
      const withoutNumero = records.filter(r => !r.numero)

      if (withNumero.length > 0) {
        const { error } = await supabase
          .from('nuevo_ingreso')
          .upsert(withNumero, { onConflict: 'numero' })
        if (error) throw new Error(error.message)
      }

      if (withoutNumero.length > 0) {
        const { error } = await supabase
          .from('nuevo_ingreso')
          .insert(withoutNumero)
        if (error) throw new Error(error.message)
      }

      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(msg)
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
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(msg)
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
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      return { success: false, error: msg }
    } finally {
      setSaving(false)
    }
  }

  return { loading, saving, error, fetchAll, importRecords, updateRecord, deleteRecord }
}
