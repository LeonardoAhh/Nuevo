"use client"

import { useMemo } from "react"
import { useCumplimientoShared } from "@/components/dashboard-cumplimiento-context"

// ─── Types ──────────────────────────────────────────────────────────────────

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

const APROBADO_MIN = 7
const YEARS_NUM = [2024, 2025, 2026] as const

export const COLORS_YEARLY = {
  aprobado:  "hsl(var(--chart-2))",
  reprobado: "hsl(var(--destructive))",
  pendiente: "hsl(var(--chart-3))",
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useYearlyCompliance() {
  const { loading, sourceData, cargar } = useCumplimientoShared()

  const yearStats = useMemo<YearStats[]>(() => {
    if (!sourceData) return []

    const { departments, positions, positionCourses, employees, employeeCourses } = sourceData
    const deptNameToId = new Map<string, string>()
    for (const d of departments) deptNameToId.set(d.name.toLowerCase().trim(), d.id)

    const posKey = (name: string, deptId: string) => `${name.toLowerCase().trim()}|${deptId}`
    const posMap = new Map<string, string>()
    for (const p of positions) posMap.set(posKey(p.name, p.department_id), p.id)

    const posCourseMap = new Map<string, Set<string>>()
    for (const pc of positionCourses) {
      if (!posCourseMap.has(pc.position_id)) posCourseMap.set(pc.position_id, new Set())
      posCourseMap.get(pc.position_id)!.add(pc.course_id)
    }

    const empCourseMap = new Map<string, Map<string, number | null>>()
    for (const ec of employeeCourses) {
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

    return YEARS_NUM.map(y => {
      const b = accum.get(y)!
      return {
        year: y === 2024 ? "≤ 2024" : String(y),
        ...b,
        pct: b.asignados > 0 ? Math.round((b.aprobados / b.asignados) * 100) : 0,
      }
    })
  }, [sourceData])

  return { loading, yearStats, cargar }
}
