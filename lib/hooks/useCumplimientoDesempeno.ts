"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

export type PeriodoCodigo = "ENE-JUN-2026" | "JUL-DIC-2026"

export const PERIODOS_DISPONIBLES: { codigo: PeriodoCodigo; label: string; short: string }[] = [
  { codigo: "ENE-JUN-2026", label: "Enero – Junio 2026", short: "ENE–JUN 2026" },
  { codigo: "JUL-DIC-2026", label: "Julio – Diciembre 2026", short: "JUL–DIC 2026" },
]

export interface EntregaEvaluaciones {
  id: string
  departamento: string
  periodo_codigo: string
  entregada_at: string
  entregada_by: string
  entregada_by_name: string | null
  evaluaciones_realizadas: number
  evaluaciones_esperadas: number
  nota: string | null
}

export interface CumplimientoRow {
  departamento: string
  esperadas: number
  realizadas: number
  porcentaje: number
  entrega: EntregaEvaluaciones | null
}

interface ResumenCumplimiento {
  totalEsperadas: number
  totalRealizadas: number
  porcentajeGlobal: number
  deptosEntregados: number
  deptosTotal: number
}

export function useCumplimientoDesempeno(periodoCodigo: PeriodoCodigo) {
  const [rows, setRows] = useState<CumplimientoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [empleadosRes, evalsRes, entregasRes] = await Promise.all([
        supabase
          .from("employees")
          .select("departamento")
          .not("departamento", "is", null),
        supabase
          .from("evaluaciones_desempeno")
          .select("departamento")
          .eq("periodo_codigo", periodoCodigo)
          .not("departamento", "is", null),
        supabase
          .from("entregas_evaluaciones")
          .select("*")
          .eq("periodo_codigo", periodoCodigo),
      ])

      if (empleadosRes.error) throw empleadosRes.error
      if (evalsRes.error) throw evalsRes.error
      if (entregasRes.error) throw entregasRes.error

      const universo = new Map<string, number>()
      for (const e of empleadosRes.data ?? []) {
        const depto = (e.departamento ?? "").trim().toUpperCase()
        if (!depto) continue
        universo.set(depto, (universo.get(depto) ?? 0) + 1)
      }

      const realizadas = new Map<string, number>()
      for (const ev of evalsRes.data ?? []) {
        const depto = (ev.departamento ?? "").trim().toUpperCase()
        if (!depto) continue
        realizadas.set(depto, (realizadas.get(depto) ?? 0) + 1)
      }

      const entregaMap = new Map<string, EntregaEvaluaciones>()
      for (const en of (entregasRes.data ?? []) as EntregaEvaluaciones[]) {
        entregaMap.set(en.departamento.trim().toUpperCase(), en)
      }

      const allDeptos = new Set<string>([
        ...universo.keys(),
        ...realizadas.keys(),
        ...entregaMap.keys(),
      ])

      const next: CumplimientoRow[] = Array.from(allDeptos)
        .sort((a, b) => a.localeCompare(b, "es-MX"))
        .map((depto) => {
          const esperadas = universo.get(depto) ?? 0
          const real = realizadas.get(depto) ?? 0
          const porcentaje = esperadas > 0 ? Math.round((real / esperadas) * 100) : 0
          return {
            departamento: depto,
            esperadas,
            realizadas: real,
            porcentaje,
            entrega: entregaMap.get(depto) ?? null,
          }
        })

      setRows(next)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar cumplimiento"
      setError(msg)
      notify.error(msg)
    } finally {
      setLoading(false)
    }
  }, [periodoCodigo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resumen = useMemo<ResumenCumplimiento>(() => {
    const totalEsperadas = rows.reduce((sum, r) => sum + r.esperadas, 0)
    const totalRealizadas = rows.reduce((sum, r) => sum + r.realizadas, 0)
    const porcentajeGlobal = totalEsperadas > 0
      ? Math.round((totalRealizadas / totalEsperadas) * 100)
      : 0
    const deptosEntregados = rows.filter((r) => r.entrega).length
    return {
      totalEsperadas,
      totalRealizadas,
      porcentajeGlobal,
      deptosEntregados,
      deptosTotal: rows.length,
    }
  }, [rows])

  const marcarEntregada = useCallback(
    async (row: CumplimientoRow, nota: string | null) => {
      setBusy(true)
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        if (userErr) throw userErr
        const user = userData.user
        if (!user) throw new Error("Sesión expirada")

        let entregadaByName: string | null = user.email ?? null
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .maybeSingle()
        if (profile?.display_name) entregadaByName = profile.display_name

        const { error: insErr } = await supabase
          .from("entregas_evaluaciones")
          .upsert(
            {
              departamento: row.departamento,
              periodo_codigo: periodoCodigo,
              entregada_by: user.id,
              entregada_by_name: entregadaByName,
              evaluaciones_realizadas: row.realizadas,
              evaluaciones_esperadas: row.esperadas,
              nota: nota ?? null,
            },
            { onConflict: "departamento,periodo_codigo" },
          )

        if (insErr) throw insErr

        notify.success(`${row.departamento} marcado como entregado`)
        await fetchData()
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al marcar entrega"
        notify.error(msg)
      } finally {
        setBusy(false)
      }
    },
    [periodoCodigo, fetchData],
  )

  const revertirEntrega = useCallback(
    async (entregaId: string) => {
      setBusy(true)
      try {
        const { error: delErr } = await supabase
          .from("entregas_evaluaciones")
          .delete()
          .eq("id", entregaId)
        if (delErr) throw delErr
        notify.success("Entrega revertida")
        await fetchData()
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al revertir entrega"
        notify.error(msg)
      } finally {
        setBusy(false)
      }
    },
    [fetchData],
  )

  return {
    rows,
    resumen,
    loading,
    error,
    busy,
    fetchData,
    marcarEntregada,
    revertirEntrega,
  }
}
