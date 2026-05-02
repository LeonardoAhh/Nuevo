"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { daysFromToday, formatDate } from "@/lib/hooks/useNuevoIngreso"
import { notify } from "@/lib/notify"
import type { NuevoIngreso } from "@/lib/hooks/useNuevoIngreso"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EvalItem {
  id: string
  dbId: string
  numero: string | null
  nombre: string
  departamento: string | null
  area: string | null
  turno: string | null
  fecha: string
  diasDiff: number
}

export interface FechaItem {
  id: string
  nombre: string
  departamento: string | null
  puesto: string | null
  etiqueta: string
  fecha: string
  diasDiff: number
}

export type DialogTipo =
  | "eval1_vencidas" | "eval1_por_vencer"
  | "eval2_vencidas" | "eval2_por_vencer"
  | "eval3_vencidas" | "eval3_por_vencer"
  | "rg_vencidas"    | "rg_por_vencer"
  | "termino_vencidos" | "termino_por_vencer"
  | null

// ─── Constants ──────────────────────────────────────────────────────────────

export const EVAL_UMBRAL_DIAS    = 7
export const RG_UMBRAL_DIAS      = 14
export const TERMINO_UMBRAL_DIAS = 30

// ─── Helpers ────────────────────────────────────────────────────────────────

export { formatDate }

export function dias(diff: number): string {
  if (diff === 0) return "Hoy"
  if (diff < 0)  return `Hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? "s" : ""}`
  return `En ${diff} día${diff !== 1 ? "s" : ""}`
}

function clasificarEval(
  registros: NuevoIngreso[],
  fechaKey: keyof NuevoIngreso,
  calKey: keyof NuevoIngreso,
  sufijo: string,
): { vencidas: EvalItem[]; porVencer: EvalItem[] } {
  const vencidas:  EvalItem[] = []
  const porVencer: EvalItem[] = []

  for (const r of registros) {
    const fecha = r[fechaKey] as string | null
    const cal   = r[calKey]  as number | null
    if (!fecha || cal != null) continue
    const diff = daysFromToday(fecha)
    if (diff === null) continue

    const item: EvalItem = {
      id: `${r.id}-${sufijo}`,
      dbId: r.id,
      numero: r.numero,
      nombre: r.nombre,
      departamento: r.departamento,
      area: r.area,
      turno: r.turno,
      fecha,
      diasDiff: diff,
    }
    if (diff < 0)                      vencidas.push(item)
    else if (diff <= EVAL_UMBRAL_DIAS)  porVencer.push(item)
  }

  vencidas.sort((a, b)  => a.diasDiff - b.diasDiff)
  porVencer.sort((a, b) => a.diasDiff - b.diasDiff)
  return { vencidas, porVencer }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDashboardAlertas() {
  const [loading, setLoading]       = useState(true)
  const [dialogTipo, setDialogTipo] = useState<DialogTipo>(null)

  const [eval1Venc,  setEval1Venc]  = useState<EvalItem[]>([])
  const [eval1Prox,  setEval1Prox]  = useState<EvalItem[]>([])
  const [eval2Venc,  setEval2Venc]  = useState<EvalItem[]>([])
  const [eval2Prox,  setEval2Prox]  = useState<EvalItem[]>([])
  const [eval3Venc,  setEval3Venc]  = useState<EvalItem[]>([])
  const [eval3Prox,  setEval3Prox]  = useState<EvalItem[]>([])
  const [rgVenc,     setRgVenc]     = useState<FechaItem[]>([])
  const [rgProx,     setRgProx]     = useState<FechaItem[]>([])
  const [termVenc,   setTermVenc]   = useState<FechaItem[]>([])
  const [termProx,   setTermProx]   = useState<FechaItem[]>([])

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      // Solo columnas necesarias para este dashboard (reduce payload ~40%)
      const COLS = [
        "id",
        "nombre",
        "departamento",
        "turno",
        "puesto",
        "eval_1_fecha",
        "eval_1_calificacion",
        "eval_2_fecha",
        "eval_2_calificacion",
        "eval_3_fecha",
        "eval_3_calificacion",
        "rg_rec_048",
        "fecha_vencimiento_rg",
        "tipo_contrato",
        "termino_contrato",
      ].join(", ")

      const { data, error } = await supabase
        .from("nuevo_ingreso")
        .select(COLS)
        .order("nombre")

      if (error) throw new Error(error.message)
      const registros = (data ?? []) as unknown as NuevoIngreso[]

      const e1 = clasificarEval(registros, "eval_1_fecha", "eval_1_calificacion", "e1")
      const e2 = clasificarEval(registros, "eval_2_fecha", "eval_2_calificacion", "e2")
      const e3 = clasificarEval(registros, "eval_3_fecha", "eval_3_calificacion", "e3")

      setEval1Venc(e1.vencidas);  setEval1Prox(e1.porVencer)
      setEval2Venc(e2.vencidas);  setEval2Prox(e2.porVencer)
      setEval3Venc(e3.vencidas);  setEval3Prox(e3.porVencer)

      const _rgVenc: FechaItem[] = []
      const _rgProx: FechaItem[] = []
      for (const r of registros) {
        if (r.rg_rec_048 === "Entregado") continue
        const fecha = r.fecha_vencimiento_rg
        if (!fecha) continue
        const diff = daysFromToday(fecha)
        if (diff === null) continue
        const item: FechaItem = {
          id: r.id, nombre: r.nombre, departamento: r.departamento,
          puesto: r.puesto, etiqueta: "Pendiente", fecha, diasDiff: diff,
        }
        if (diff < 0)             _rgVenc.push(item)
        else if (diff <= RG_UMBRAL_DIAS) _rgProx.push(item)
      }
      _rgVenc.sort((a, b) => a.diasDiff - b.diasDiff)
      _rgProx.sort((a, b) => a.diasDiff - b.diasDiff)
      setRgVenc(_rgVenc); setRgProx(_rgProx)

      const _termVenc: FechaItem[] = []
      const _termProx: FechaItem[] = []
      for (const r of registros) {
        if (r.tipo_contrato === "Indeterminado") continue
        const fecha = r.termino_contrato
        if (!fecha) continue
        const diff = daysFromToday(fecha)
        if (diff === null) continue
        const item: FechaItem = {
          id: r.id, nombre: r.nombre, departamento: r.departamento,
          puesto: r.puesto, etiqueta: r.tipo_contrato ?? "A prueba", fecha, diasDiff: diff,
        }
        if (diff < 0)                    _termVenc.push(item)
        else if (diff <= TERMINO_UMBRAL_DIAS) _termProx.push(item)
      }
      _termVenc.sort((a, b) => a.diasDiff - b.diasDiff)
      _termProx.sort((a, b) => a.diasDiff - b.diasDiff)
      setTermVenc(_termVenc); setTermProx(_termProx)
    } catch (err) {
      console.error("DashboardAlertas error:", err)
      notify.error("No se pudieron cargar las alertas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Mutations
  const calificarEval = useCallback(async (dbId: string, col: string, cal: number) => {
    await supabase.from("nuevo_ingreso").update({ [col]: cal }).eq("id", dbId)
  }, [])

  const marcarRgEntregado = useCallback(async (id: string) => {
    await supabase.from("nuevo_ingreso").update({ rg_rec_048: "Entregado" }).eq("id", id)
  }, [])

  const marcarIndeterminado = useCallback(async (id: string) => {
    await supabase.from("nuevo_ingreso").update({ tipo_contrato: "Indeterminado" }).eq("id", id)
  }, [])

  const n = (arr: unknown[]) => arr.length

  const totalAlertas =
    n(eval1Venc) + n(eval1Prox) + n(eval2Venc) + n(eval2Prox) +
    n(eval3Venc) + n(eval3Prox) + n(rgVenc)    + n(rgProx)    +
    n(termVenc)  + n(termProx)

  return {
    loading, dialogTipo, setDialogTipo, cargarDatos,
    eval1Venc, eval1Prox, setEval1Venc, setEval1Prox,
    eval2Venc, eval2Prox, setEval2Venc, setEval2Prox,
    eval3Venc, eval3Prox, setEval3Venc, setEval3Prox,
    rgVenc, rgProx, setRgVenc, setRgProx,
    termVenc, termProx, setTermVenc, setTermProx,
    totalAlertas,
    calificarEval, marcarRgEntregado, marcarIndeterminado,
  }
}
