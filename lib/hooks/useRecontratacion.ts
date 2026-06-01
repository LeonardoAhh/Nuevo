"use client"

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { describeSupabaseError } from '@/lib/supabase/errors'
import type { NuevoIngreso } from './useNuevoIngreso'
import type { IncidenciaRecord } from './useIncidencias'
import {
  mesesIncidencias,
  periodosMensuales,
} from '@/lib/recontratacion'
import type {
  RecontratacionPrintData,
  IncidenciaMesRow,
  EvaluacionRow,
} from '@/components/content/recontratacion-print'

/** Umbral de calificación aprobatoria; por debajo se asume plan de seguimiento. */
const APROBATORIA = 70

/**
 * Detecta el jefe directo de un empleado desde el roster (tabla `employees`),
 * usando su número. Cae a `jefe_area` del registro de nuevo ingreso o "#N/D".
 */
export async function detectarJefeDirecto(
  numero: string | null,
  jefeAreaFallback: string | null,
): Promise<string> {
  if (numero) {
    try {
      const { data } = await supabase
        .from('employees')
        .select('jefe_directo')
        .eq('numero', numero)
        .not('jefe_directo', 'is', null)
        .limit(1)
        .maybeSingle()
      if (data?.jefe_directo) return data.jefe_directo as string
    } catch {
      // ignora y usa fallback
    }
  }
  return jefeAreaFallback || '#N/D'
}

/** Deriva el plan de seguimiento a partir de la calificación. */
function planSeguimiento(calificacion: number | null): string {
  if (calificacion == null) return ''
  return calificacion < APROBATORIA ? 'SÍ' : 'NO'
}

/** Ensambla los datos del formato a partir de un registro de nuevo ingreso. */
export async function buildRecontratacionData(
  record: NuevoIngreso,
): Promise<RecontratacionPrintData> {
  const meses = mesesIncidencias(record.fecha_ingreso)

  // Incidencias dentro de la ventana de 90 días
  let incidenciaRecords: IncidenciaRecord[] = []
  if (record.numero && meses.length > 0) {
    try {
      const { data } = await supabase
        .from('incidencias')
        .select('*')
        .eq('numero_empleado', record.numero)
        .in('mes', meses)
      incidenciaRecords = (data ?? []) as IncidenciaRecord[]
    } catch {
      incidenciaRecords = []
    }
  }

  const incidencias: IncidenciaMesRow[] = meses.map((mes) => {
    const delMes = incidenciaRecords.filter((r) => r.mes === mes)
    const valores: Record<string, number> = {}
    const notas: string[] = []
    delMes.forEach((r) => {
      valores[r.categoria] = r.valor
      if (r.notas) notas.push(r.notas)
    })
    return { mes, valores, comentarios: notas.join(' · ') }
  })

  const periodos = periodosMensuales(record.fecha_ingreso, 3)
  const calificaciones = [
    record.eval_1_calificacion,
    record.eval_2_calificacion,
    record.eval_3_calificacion,
  ]
  const evaluaciones: EvaluacionRow[] = periodos.map((periodo, i) => ({
    periodo,
    calificacion: calificaciones[i] ?? null,
    planSeguimiento: planSeguimiento(calificaciones[i] ?? null),
    observaciones: '',
  }))

  const jefeDirecto = await detectarJefeDirecto(record.numero, record.jefe_area)

  return {
    nombre: record.nombre,
    numero: record.numero ?? '',
    puesto: record.puesto ?? '',
    departamento: record.departamento ?? '',
    turno: record.turno ?? '',
    fechaIngresoISO: record.fecha_ingreso,
    terminoContratoISO: record.termino_contrato,
    jefeDirecto,
    rgEntregado: record.rg_rec_048,
    incidencias,
    evaluaciones,
  }
}

/** Hook: carga un registro de nuevo ingreso por número y ensambla el formato. */
export function useRecontratacion() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByNumero = useCallback(
    async (numero: string): Promise<RecontratacionPrintData | null> => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('nuevo_ingreso')
          .select('*')
          .eq('numero', numero)
          .maybeSingle()
        if (error) throw new Error(error.message)
        if (!data) return null
        return await buildRecontratacionData(data as NuevoIngreso)
      } catch (err) {
        setError(describeSupabaseError(err, 'Error al cargar el registro'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { loading, error, fetchByNumero, buildRecontratacionData }
}
