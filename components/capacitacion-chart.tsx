"use client"

import { useState, useEffect, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Info, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface MonthlyPoint {
  month: string
  "2024": number; "2024_trend": number
  "2025": number; "2025_trend": number
  "2026": number; "2026_trend": number
}

interface Department { id: string; name: string }

// ─────────────────────────────────────────────────────────────────────────────
// Constantes y utilidades
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const YEARS  = ["2024","2025","2026"] as const
const COLORS: Record<string, string> = {
  "2024": "#f59e0b",   // amber
  "2025": "#ef4444",   // red
  "2026": "#3b82f6",   // blue
}

/** Regresión lineal sobre puntos {x, y}. Devuelve valor en cada x de 0..11. */
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

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const dataPoints = payload.filter((p: any) => !p.dataKey.includes("_trend"))
  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm min-w-[150px]">
      <p className="font-semibold dark:text-white mb-2">{label}</p>
      {dataPoints.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.dataKey}
          </span>
          <span className="font-medium dark:text-white">
            {p.value} {p.value === 1 ? "curso" : "cursos"}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function CapacitacionChart() {
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
      // ── Paso 1: obtener employee_ids del departamento (si aplica) ──────────
      let employeeIds: string[] | null = null

      if (deptId !== "all") {
        const deptName = departments.find(d => d.id === deptId)?.name ?? ""
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select("id")
          .ilike("departamento", deptName)
        if (empError) throw new Error(empError.message)
        employeeIds = (empData ?? []).map(e => e.id)
        // Si no hay empleados en ese dept, la gráfica estará vacía
        if (employeeIds.length === 0) {
          const empty = buildEmpty()
          setChartData(empty)
          setYearTotals(YEARS.map(y => ({ year: y, total: 0 })))
          return
        }
      }

      // ── Paso 2: obtener historial con filtro opcional por empleados ────────
      // Supabase tiene límite de 1000 filas por defecto — paginamos para traer todo
      const PAGE_SIZE = 1000
      let allRows: any[] = []
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

      const data = allRows
      const error = null

      const rows = allRows

      // ── Paso 3: construir grilla año × mes con cursos únicos ──────────────
      // Criterio de unicidad: course_id cuando está mapeado; raw_course_name
      // normalizado como fallback. Así dos variantes del mismo curso cuentan como 1.
      const grid: Record<string, Record<number, Set<string>>> = {}
      for (const y of YEARS) {
        grid[y] = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i, new Set<string>()]))
      }

      for (const r of rows) {
        if (!r.fecha_aplicacion) continue
        // Parseo sin zona horaria: "YYYY-MM-DD" → partes directas
        // new Date("YYYY-MM-DD") interpreta UTC y en UTC-6 el día 1 cae en el mes anterior
        const parts = r.fecha_aplicacion.split("-")
        if (parts.length !== 3) continue
        const year  = parts[0]
        const month = parseInt(parts[1], 10) - 1   // 0-indexed
        if (!grid[year] || month < 0 || month > 11) continue
        // Usa course_id si está disponible (deduplicación correcta entre variantes)
        const key = r.course_id ?? r.raw_course_name.trim().toUpperCase()
        grid[year][month].add(key)
      }

      // ── Paso 4: armar puntos y tendencias ─────────────────────────────────
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
      setYearTotals(YEARS.map(y => ({
        year: y,
        total: rawValues[y].reduce((s, v) => s + v, 0),
      })))
    } catch (err) {
      console.error("Chart error:", err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }, [departments])

  useEffect(() => {
    loadData(selectedDept)
  }, [selectedDept, loadData])

  const isEmpty = chartData.every(
    p => p["2024"] === 0 && p["2025"] === 0 && p["2026"] === 0
  )

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base font-semibold dark:text-white">
            Comparación Anual de Cursos Impartidos
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {yearTotals.map(({ year, total }) => (
              <div key={year} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[year] }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{year}</span>
                <Badge variant="secondary" className="text-xs px-1.5 dark:bg-gray-700 dark:text-gray-300">
                  {total}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            onClick={() => loadData(selectedDept)}
            disabled={loading}
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-full sm:w-56 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 h-8 text-sm">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-72">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400 dark:text-gray-500 gap-2">
            <GraduationCap className="h-10 w-10 opacity-30" />
            <p className="text-sm">No hay datos de historial importados aún.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(156,163,175,0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "rgb(156,163,175)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgb(156,163,175)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => {
                    if (value.includes("_trend")) return null
                    return <span style={{ color: COLORS[value] }}>{value}</span>
                  }}
                  payload={YEARS.map(y => ({
                    value: y,
                    type: "line" as const,
                    color: COLORS[y],
                    id: y,
                  })).concat([{ value: "Tendencia", type: "line" as const, color: "#9ca3af", id: "trend" }])}
                />

                {/* Líneas principales */}
                {YEARS.map(year => (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={year}
                    stroke={COLORS[year]}
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: COLORS[year], strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    connectNulls
                  />
                ))}

                {/* Líneas de tendencia (dashed) */}
                {YEARS.map(year => (
                  <Line
                    key={`${year}_trend`}
                    type="linear"
                    dataKey={`${year}_trend`}
                    stroke={COLORS[year]}
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Nota al pie */}
            <div className="flex items-start gap-1.5 mt-3 text-xs text-gray-400 dark:text-gray-500">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Solo se cuentan cursos únicos por mes (un curso solo se cuenta una vez por mes aunque se haya impartido varias veces)
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildEmpty(): MonthlyPoint[] {
  return MONTHS.map(m => ({
    month: m,
    "2024": 0, "2024_trend": 0,
    "2025": 0, "2025_trend": 0,
    "2026": 0, "2026_trend": 0,
  }))
}
