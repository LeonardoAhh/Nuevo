"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAllRows } from "@/lib/supabase/fetchAll"
import { notify } from "@/lib/notify"

// ─── Types ──────────────────────────────────────────────────────────────────

interface PositionRow { id: string; name: string; department_id: string }
interface PositionCourseRow { position_id: string; course_id: string }
interface EmployeeRow { id: string; puesto: string | null; departamento: string | null; fecha_ingreso: string | null }
interface EmployeeCourseRow { employee_id: string; course_id: string | null; calificacion: number | null }
interface DepartmentRow { id: string; name: string }

export interface YearStats {
  year: string
  empleados: number
  asignados: number
  aprobados: number
  reprobados: number
  pendientes: number
  pct: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const APROBADO_MIN = 70
const YEARS_NUM = [2024, 2025, 2026] as const

export const COLORS_YEARLY = {
  aprobado:  "hsl(var(--chart-2))",
  reprobado: "hsl(var(--destructive))",
  pendiente: "hsl(var(--chart-3))",
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useYearlyCompliance() {
  const [loading, setLoading] = useState(true)
  const [yearStats, setYearStats] = useState<YearStats[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [depts, positions, posCourses, employees, empCourses] = await Promise.all([
        fetchAllRows<DepartmentRow>("departments", "id, name"),
        fetchAllRows<PositionRow>("positions", "id, name, department_id"),
        fetchAllRows<PositionCourseRow>("position_courses", "position_id, course_id"),
        fetchAllRows<EmployeeRow>("employees", "id, puesto, departamento, fecha_ingreso"),
        fetchAllRows<EmployeeCourseRow>("employee_courses", "employee_id, course_id, calificacion"),
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
          if (cal === undefined) { bucket.pendientes++ }
          else if (cal !== null && cal >= APROBADO_MIN) { bucket.aprobados++ }
          else { bucket.reprobados++ }
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
      notify.error("Error al cargar cumplimiento anual")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { loading, yearStats, cargar }
}
