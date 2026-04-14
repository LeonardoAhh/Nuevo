"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface PositionRow { id: string; name: string; department_id: string }
interface PositionCourseRow { position_id: string; course_id: string }
interface EmployeeRow { id: string; puesto: string | null; departamento: string | null; fecha_ingreso: string | null }
interface EmployeeCourseRow { employee_id: string; course_id: string | null; calificacion: number | null }
interface DepartmentRow { id: string; name: string }

interface YearStats {
  year: string
  empleados: number
  asignados: number
  aprobados: number
  reprobados: number
  pendientes: number
  pct: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const APROBADO_MIN = 70
const YEARS_NUM = [2024, 2025, 2026] as const

const COLORS = {
  aprobado:  "hsl(var(--chart-2))",
  reprobado: "hsl(var(--destructive))",
  pendiente: "hsl(var(--chart-3))",
}

// ─────────────────────────────────────────────────────────────────────────────
// Paginación helper
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const PAGE = 1000
  let all: T[] = []
  let from = 0
  let hasMore = true
  while (hasMore) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    all = all.concat((data ?? []) as T[])
    hasMore = (data?.length ?? 0) === PAGE
    from += PAGE
  }
  return all
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipEntry { dataKey: string; value: number; color: string }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  const row = (payload[0] as unknown as { payload: YearStats }).payload
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1 text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS.aprobado }} />
            Aprobados
          </span>
          <span className="font-bold" style={{ color: COLORS.aprobado }}>{row.aprobados}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS.reprobado }} />
            Reprobados
          </span>
          <span className="font-bold text-destructive">{row.reprobados}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS.pendiente }} />
            Pendientes
          </span>
          <span className="font-medium">{row.pendientes}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t">
          <span>Cumplimiento</span>
          <span className="font-bold" style={{ color: COLORS.aprobado }}>{row.pct}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Empleados</span>
          <span className="font-medium">{row.empleados}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardYearlyCompliance() {
  const [loading, setLoading] = useState(true)
  const [yearStats, setYearStats] = useState<YearStats[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [depts, positions, posCourses, employees, empCourses] = await Promise.all([
        fetchAll<DepartmentRow>("departments", "id, name"),
        fetchAll<PositionRow>("positions", "id, name, department_id"),
        fetchAll<PositionCourseRow>("position_courses", "position_id, course_id"),
        fetchAll<EmployeeRow>("employees", "id, puesto, departamento, fecha_ingreso"),
        fetchAll<EmployeeCourseRow>("employee_courses", "employee_id, course_id, calificacion"),
      ])

      const deptNameToId = new Map<string, string>()
      for (const d of depts) deptNameToId.set(d.name.toLowerCase().trim(), d.id)

      const posKey = (name: string, deptId: string) => `${name.toLowerCase().trim()}|${deptId}`
      const posMap = new Map<string, string>()
      for (const p of positions) posMap.set(posKey(p.name, p.department_id), p.id)

      const posCourseMap = new Map<string, Set<string>>()
      for (const pc of posCourses) {
        if (!posCourseMap.has(pc.position_id)) posCourseMap.set(pc.position_id, new Set())
        posCourseMap.get(pc.position_id)!.add(pc.course_id)
      }

      const empCourseMap = new Map<string, Map<string, number | null>>()
      for (const ec of empCourses) {
        if (!ec.course_id) continue
        if (!empCourseMap.has(ec.employee_id)) empCourseMap.set(ec.employee_id, new Map())
        empCourseMap.get(ec.employee_id)!.set(ec.course_id, ec.calificacion)
      }

      const accum = new Map<number, { empleados: number; asignados: number; aprobados: number; reprobados: number; pendientes: number }>()
      for (const y of YEARS_NUM) accum.set(y, { empleados: 0, asignados: 0, aprobados: 0, reprobados: 0, pendientes: 0 })

      for (const emp of employees) {
        if (!emp.fecha_ingreso || !emp.puesto || !emp.departamento) continue
        const hireYear = new Date(emp.fecha_ingreso + "T00:00:00").getFullYear()
        const effectiveYear = hireYear <= 2024 ? 2024 : hireYear
        const bucket = accum.get(effectiveYear)
        if (!bucket) continue

        bucket.empleados++

        const deptId = deptNameToId.get(emp.departamento.toLowerCase().trim())
        if (!deptId) continue
        const posId = posMap.get(posKey(emp.puesto, deptId))
        if (!posId) continue
        const required = posCourseMap.get(posId)
        if (!required || required.size === 0) continue

        const taken = empCourseMap.get(emp.id) ?? new Map()
        for (const courseId of required) {
          bucket.asignados++
          const cal = taken.get(courseId)
          if (cal === undefined) {
            bucket.pendientes++
          } else if (cal !== null && cal >= APROBADO_MIN) {
            bucket.aprobados++
          } else {
            bucket.reprobados++
          }
        }
      }

      const stats: YearStats[] = YEARS_NUM.map(y => {
        const b = accum.get(y)!
        return {
          year: y === 2024 ? '≤ 2024' : String(y),
          ...b,
          pct: b.asignados > 0 ? Math.round((b.aprobados / b.asignados) * 100) : 0,
        }
      })

      setYearStats(stats)
    } catch (err) {
      console.error("YearlyCompliance error:", err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const isEmpty = yearStats.every(s => s.asignados === 0)
  const totalEmpleados = yearStats.reduce((s, y) => s + y.empleados, 0)
  const totalAprobados = yearStats.reduce((s, y) => s + y.aprobados, 0)
  const totalAsignados = yearStats.reduce((s, y) => s + y.asignados, 0)
  const pctGlobal = totalAsignados > 0 ? Math.round((totalAprobados / totalAsignados) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/15">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                Cumplimiento por Año de Ingreso
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Avance en cursos asignados por puesto según fecha de ingreso
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-3">
              {yearStats.map(s => (
                <div key={s.year} className="flex items-center gap-1.5">
                  <Users size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{s.year}</span>
                  <Badge variant="secondary" className="text-xs px-1.5">{s.empleados}</Badge>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cargar} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <TrendingUp size={32} className="opacity-30" />
            <p className="text-sm">No hay datos de cumplimiento por año aún.</p>
          </div>
        ) : (
          <>
            {/* Resumen compacto */}
            <div className="flex flex-wrap items-center gap-4 mb-5 p-3 rounded-xl bg-muted/50 border">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary"><Users size={14} /></span>
                <div>
                  <span className="text-lg font-bold leading-none">{totalEmpleados}</span>
                  <span className="text-[11px] text-muted-foreground ml-1">empleados</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg" style={{ background: `color-mix(in srgb, ${COLORS.aprobado} 15%, transparent)` }}>
                  <CheckCircle2 size={14} style={{ color: COLORS.aprobado }} />
                </span>
                <div>
                  <span className="text-lg font-bold leading-none">{totalAprobados}</span>
                  <span className="text-[11px] text-muted-foreground ml-1">aprobados</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold leading-none" style={{ color: COLORS.aprobado }}>{pctGlobal}%</span>
                <span className="text-[11px] text-muted-foreground">cumplimiento global</span>
              </div>
            </div>

            {/* Gráfica de barras apiladas */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yearStats} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/15" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                <YAxis
                  type="category" dataKey="year" tick={{ fontSize: 12, fontWeight: 600 }}
                  className="text-muted-foreground" axisLine={false} tickLine={false} width={55}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value: string) => (
                    <span className="text-muted-foreground capitalize">{value === 'aprobados' ? 'Aprobados' : value === 'reprobados' ? 'Reprobados' : 'Pendientes'}</span>
                  )}
                />
                <Bar dataKey="aprobados" stackId="a" fill={COLORS.aprobado} radius={[0, 0, 0, 0]} />
                <Bar dataKey="reprobados" stackId="a" fill={COLORS.reprobado} />
                <Bar dataKey="pendientes" stackId="a" fill={COLORS.pendiente} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Barras de porcentaje por año */}
            <div className="mt-5 space-y-3">
              {yearStats.map(s => (
                <div key={s.year} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{s.year}</span>
                    <span className="text-muted-foreground">
                      {s.aprobados} / {s.asignados} cursos
                      <span className="ml-2 font-semibold" style={{ color: COLORS.aprobado }}>{s.pct}%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.pct}%`, background: COLORS.aprobado }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
