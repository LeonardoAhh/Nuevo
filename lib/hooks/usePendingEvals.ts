"use client"

import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { daysFromToday } from "@/lib/hooks/useNuevoIngreso"
import { notify } from "@/lib/notify"

// ─── Types ──────────────────────────────────────────────────────────────────

export type EvalPeriodo = "1er Mes" | "2° Mes" | "3er Mes"

export interface PendingEvalEntry {
  periodo: EvalPeriodo
  fecha: string
  diasDiff: number
}

/** One record per employee, with all pending evals grouped */
export interface EmployeePending {
  dbId: string
  numero: string | null
  nombre: string
  departamento: string | null
  area: string | null
  turno: string | null
  fecha_ingreso: string | null
  termino_contrato: string | null
  rg_rec_048: "Pendiente" | "Entregado"
  fecha_vencimiento_rg: string | null
  rg_dias_diff: number | null
  evals: PendingEvalEntry[]
  /** true if any eval is vencida (diasDiff < 0) */
  hasVencida: boolean
}

export interface DeptGroup {
  departamento: string
  items: EmployeePending[]
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePendingEvals() {
  const [loading, setLoading] = useState(true)
  const [deptGroups, setDeptGroups] = useState<DeptGroup[]>([])
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [totalEvals, setTotalEvals] = useState(0)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const COLS = [
        "id",
        "numero",
        "nombre",
        "departamento",
        "area",
        "turno",
        "fecha_ingreso",
        "termino_contrato",
        "rg_rec_048",
        "fecha_vencimiento_rg",
        "eval_1_fecha",
        "eval_1_calificacion",
        "eval_2_fecha",
        "eval_2_calificacion",
        "eval_3_fecha",
        "eval_3_calificacion",
      ].join(", ")

      const { data, error } = await supabase
        .from("nuevo_ingreso")
        .select(COLS)
        .order("nombre")

      if (error) throw new Error(error.message)

      const registros = (data ?? []) as unknown as Array<{
        id: string
        numero: string | null
        nombre: string
        departamento: string | null
        area: string | null
        turno: string | null
        fecha_ingreso: string | null
        termino_contrato: string | null
        rg_rec_048: "Pendiente" | "Entregado"
        fecha_vencimiento_rg: string | null
        eval_1_fecha: string | null
        eval_1_calificacion: number | null
        eval_2_fecha: string | null
        eval_2_calificacion: number | null
        eval_3_fecha: string | null
        eval_3_calificacion: number | null
      }>

      // Build one EmployeePending per employee (only if they have pending evals)
      const employeeMap = new Map<string, EmployeePending>()
      let evalCount = 0

      for (const r of registros) {
        const evalDefs: [string | null, number | null, EvalPeriodo][] = [
          [r.eval_1_fecha, r.eval_1_calificacion, "1er Mes"],
          [r.eval_2_fecha, r.eval_2_calificacion, "2° Mes"],
          [r.eval_3_fecha, r.eval_3_calificacion, "3er Mes"],
        ]

        const pendingEvals: PendingEvalEntry[] = []
        for (const [fecha, cal, periodo] of evalDefs) {
          if (!fecha || cal != null) continue
          const diff = daysFromToday(fecha)
          if (diff === null) continue
          pendingEvals.push({ periodo, fecha, diasDiff: diff })
        }

        if (pendingEvals.length === 0) continue
        evalCount += pendingEvals.length

        const rgDiff = r.fecha_vencimiento_rg ? daysFromToday(r.fecha_vencimiento_rg) : null

        employeeMap.set(r.id, {
          dbId: r.id,
          numero: r.numero,
          nombre: r.nombre,
          departamento: r.departamento,
          area: r.area,
          turno: r.turno,
          fecha_ingreso: r.fecha_ingreso,
          termino_contrato: r.termino_contrato,
          rg_rec_048: r.rg_rec_048,
          fecha_vencimiento_rg: r.fecha_vencimiento_rg,
          rg_dias_diff: rgDiff,
          evals: pendingEvals.sort((a, b) => a.diasDiff - b.diasDiff),
          hasVencida: pendingEvals.some((e) => e.diasDiff < 0),
        })
      }

      // Group by departamento
      const deptMap = new Map<string, EmployeePending[]>()
      for (const emp of employeeMap.values()) {
        const key = emp.departamento ?? "Sin departamento"
        if (!deptMap.has(key)) deptMap.set(key, [])
        deptMap.get(key)!.push(emp)
      }

      const groups: DeptGroup[] = Array.from(deptMap.entries())
        .map(([departamento, items]) => ({
          departamento,
          // Vencidas first, then by name
          items: items.sort((a, b) => {
            if (a.hasVencida !== b.hasVencida) return a.hasVencida ? -1 : 1
            return a.nombre.localeCompare(b.nombre, "es")
          }),
        }))
        .sort((a, b) => a.departamento.localeCompare(b.departamento, "es"))

      setDeptGroups(groups)
      setTotalEmployees(employeeMap.size)
      setTotalEvals(evalCount)
    } catch (err) {
      console.error("usePendingEvals:", err)
      notify.error("No se pudieron cargar las evaluaciones pendientes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { loading, deptGroups, totalEmployees, totalEvals, cargar }
}
