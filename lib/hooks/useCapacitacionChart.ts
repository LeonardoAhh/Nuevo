"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MonthlyPoint {
  month: string
  "2024": number; "2024_trend": number
  "2025": number; "2025_trend": number
  "2026": number; "2026_trend": number
}

interface Department { id: string; name: string }

// ─── Constants ──────────────────────────────────────────────────────────────

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
export const YEARS = ["2024","2025","2026"] as const

export const COLORS_CHART: Record<string, string> = {
  "2024": "hsl(var(--chart-3))",
  "2025": "hsl(var(--chart-5))",
  "2026": "hsl(var(--chart-1))",
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function linearTrend(values: number[]): number[] {
  const n = values.length
  const xs = values.map((_, i) => i)
  const sumX  = xs.reduce((a, b) => a + b, 0)
  const sumY  = values.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * values[i], 0)
  const sumX2 = xs.reduce((s, x) => s + x * x, 0)
  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return xs.map(x => Math.max(0, Math.round((slope * x + intercept) * 10) / 10))
}

function buildEmpty(): MonthlyPoint[] {
  return MONTHS.map(m => ({
    month: m,
    "2024": 0, "2024_trend": 0,
    "2025": 0, "2025_trend": 0,
    "2026": 0, "2026_trend": 0,
  }))
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCapacitacionChart() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const [chartData, setChartData] = useState<MonthlyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [yearTotals, setYearTotals] = useState<{ year: string; total: number }[]>([])

  useEffect(() => {
    supabase.from("departments").select("id, name").order("name")
      .then(({ data }) => setDepartments(data ?? []))
  }, [])

  const loadData = useCallback(async (deptId: string) => {
    setLoading(true)
    try {
      let employeeIds: string[] | null = null

      if (deptId !== "all") {
        const deptName = departments.find(d => d.id === deptId)?.name ?? ""
        const { data: empData, error: empError } = await supabase
          .from("employees").select("id").ilike("departamento", deptName)
        if (empError) throw new Error(empError.message)
        employeeIds = (empData ?? []).map(e => e.id)
        if (employeeIds.length === 0) {
          setChartData(buildEmpty())
          setYearTotals(YEARS.map(y => ({ year: y, total: 0 })))
          return
        }
      }

      const PAGE_SIZE = 1000
      let allRows: { employee_id: string; course_id: string | null; raw_course_name: string; fecha_aplicacion: string | null }[] = []
      let from = 0
      let hasMore = true

      while (hasMore) {
        let query = supabase
          .from("employee_courses")
          .select("employee_id, course_id, raw_course_name, fecha_aplicacion")
          .not("fecha_aplicacion", "is", null)
          .range(from, from + PAGE_SIZE - 1)

        if (employeeIds) {
          query = query.in("employee_id", employeeIds)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)
        allRows = allRows.concat(data ?? [])
        hasMore = (data?.length ?? 0) === PAGE_SIZE
        from += PAGE_SIZE
      }

      const grid: Record<string, Record<number, Set<string>>> = {}
      for (const y of YEARS) {
        grid[y] = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i, new Set<string>()]))
      }

      for (const r of allRows) {
        if (!r.fecha_aplicacion) continue
        const parts = r.fecha_aplicacion.split("-")
        if (parts.length !== 3) continue
        const year  = parts[0]
        const month = parseInt(parts[1], 10) - 1
        if (!grid[year] || month < 0 || month > 11) continue
        const key = r.course_id ?? r.raw_course_name.trim().toUpperCase()
        grid[year][month].add(key)
      }

      const rawValues: Record<string, number[]> = {}
      for (const y of YEARS) rawValues[y] = MONTHS.map((_, i) => grid[y][i].size)

      const trends: Record<string, number[]> = {}
      for (const y of YEARS) trends[y] = linearTrend(rawValues[y])

      const points: MonthlyPoint[] = MONTHS.map((label, i) => ({
        month: label,
        "2024": rawValues["2024"][i], "2024_trend": trends["2024"][i],
        "2025": rawValues["2025"][i], "2025_trend": trends["2025"][i],
        "2026": rawValues["2026"][i], "2026_trend": trends["2026"][i],
      }))

      setChartData(points)
      setYearTotals(YEARS.map(y => ({ year: y, total: rawValues[y].reduce((s, v) => s + v, 0) })))
    } catch (err) {
      console.error("Chart error:", err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }, [departments])

  useEffect(() => { loadData(selectedDept) }, [selectedDept, loadData])

  return {
    loading, departments, selectedDept, setSelectedDept,
    chartData, yearTotals,
    refresh: () => loadData(selectedDept),
  }
}
