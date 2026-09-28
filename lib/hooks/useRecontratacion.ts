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
import {
  JEFES_DE_AREA_POR_DEPARTAMENTO,
  normalizeDepartamento,
} from '@/lib/catalogo'
import type {
  RecontratacionPrintData,
  IncidenciaMesRow,
  EvaluacionRow,
} from '@/components/content/recontratacion-print'

/** Umbral de calificación aprobatoria; por debajo se asume plan de seguimiento. */
const APROBATORIA = 7

/**
 * Jefe de área por departamento, con la llave normalizada (sin acentos, minúsculas)
 * para tolerar variaciones de escritura del departamento del empleado.
 */
const JEFE_POR_DEPTO_NORM: Record<string, string> = Object.fromEntries(
  Object.entries(JEFES_DE_AREA_POR_DEPARTAMENTO)
    .map(([dept, jefes]) => [normalizeDepartamento(dept), (jefes[0] ?? '').trim()])
    .filter(([, jefe]) => !!jefe),
)

/**
 * Detecta el jefe directo de un empleado. Fuente de verdad: catalogo
 * (`JEFES_DE_AREA_POR_DEPARTAMENTO` por departamento) — así actualizar el
 * catálogo refleja el cambio en todos los formatos sin tocar la base.
 * Si el departamento no está en catalogo, cae a `employees.jefe_directo`
 * (por número), luego a `jefe_area` del registro, y por último "#N/D".
 */
export async function detectarJefeDirecto(
  numero: string | null,
  jefeAreaFallback: string | null,
  departamento: string | null,
): Promise<string> {
  const fromCatalogo = JEFE_POR_DEPTO_NORM[normalizeDepartamento(departamento)]
  if (fromCatalogo) return fromCatalogo

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

  const jefeDirecto = await detectarJefeDirecto(record.numero, record.jefe_area, record.departamento)

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
