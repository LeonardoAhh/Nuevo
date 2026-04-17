"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAllRows } from "@/lib/supabase/fetchAll"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DeptCumplimiento {
  departamento: string
  asignados: number
  aprobados: number
  reprobados: number
  pendientes: number
  pct: number
}

interface PositionRow { id: string; name: string; department_id: string }
interface PositionCourseRow { position_id: string; course_id: string }
interface EmployeeRow { id: string; nombre: string; puesto: string | null; departamento: string | null }
interface EmployeeCourseRow { employee_id: string; course_id: string | null; calificacion: number | null }
export interface DepartmentRow { id: string; name: string }

// ─── Constants ──────────────────────────────────────────────────────────────

export const META = 80
const APROBADO_MIN = 70

export function colorPct(pct: number): string {
  if (pct >= META) return "hsl(var(--chart-2))"
  if (pct >= 50) return "hsl(var(--chart-3))"
  return "hsl(var(--destructive))"
}

export const COLORS_CUMPLIMIENTO = {
  aprobado:  "hsl(var(--chart-2))",
  reprobado: "hsl(var(--destructive))",
  pendiente: "hsl(var(--chart-3))",
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCumplimiento() {
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [totalAsignados, setTotalAsignados] = useState(0)
  const [totalAprobados, setTotalAprobados] = useState(0)
  const [totalReprobados, setTotalReprobados] = useState(0)
  const [totalPendientes, setTotalPendientes] = useState(0)
  const [totalEmpleados, setTotalEmpleados] = useState(0)
  const [totalEmpleadosConPuesto, setTotalEmpleadosConPuesto] = useState(0)
  const [deptData, setDeptData] = useState<DeptCumplimiento[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [depts, positions, posCourses, employees, empCourses] =
        await Promise.all([
          fetchAllRows<DepartmentRow>("departments", "id, name"),
          fetchAllRows<PositionRow>("positions", "id, name, department_id"),
          fetchAllRows<PositionCourseRow>("position_courses", "position_id, course_id"),
          fetchAllRows<EmployeeRow>("employees", "id, nombre, puesto, departamento"),
          fetchAllRows<EmployeeCourseRow>("employee_courses", "employee_id, course_id, calificacion"),
        ])

      setDepartments(depts.sort((a, b) => a.name.localeCompare(b.name)))

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

      const deptAccum = new Map<string, { asignados: number; aprobados: number; reprobados: number; pendientes: number }>()

      let gAsignados = 0, gAprobados = 0, gReprobados = 0, gPendientes = 0, gConPuesto = 0

      for (const emp of employees) {
        if (!emp.puesto || !emp.departamento) continue
        const deptId = deptNameToId.get(emp.departamento.toLowerCase().trim())
        if (!deptId) continue
        const posId = posMap.get(posKey(emp.puesto, deptId))
        if (!posId) continue
        const requiredCourses = posCourseMap.get(posId)
        if (!requiredCourses || requiredCourses.size === 0) continue

        gConPuesto++
        const taken = empCourseMap.get(emp.id) ?? new Map()
        const deptName = emp.departamento.trim()

        if (!deptAccum.has(deptName))
          deptAccum.set(deptName, { asignados: 0, aprobados: 0, reprobados: 0, pendientes: 0 })
        const acc = deptAccum.get(deptName)!

        for (const courseId of requiredCourses) {
          gAsignados++; acc.asignados++
          const cal = taken.get(courseId)
          if (cal === undefined) { gPendientes++; acc.pendientes++ }
          else if (cal !== null && cal >= APROBADO_MIN) { gAprobados++; acc.aprobados++ }
          else { gReprobados++; acc.reprobados++ }
        }
      }

      setTotalEmpleados(employees.length)
      setTotalEmpleadosConPuesto(gConPuesto)
      setTotalAsignados(gAsignados)
      setTotalAprobados(gAprobados)
      setTotalReprobados(gReprobados)
      setTotalPendientes(gPendientes)

      const deptArr: DeptCumplimiento[] = Array.from(deptAccum.entries())
        .map(([departamento, v]) => ({
          departamento, ...v,
          pct: v.asignados > 0 ? Math.round((v.aprobados / v.asignados) * 100) : 0,
        }))
        .filter((d) => d.asignados > 0)
        .sort((a, b) => b.pct - a.pct)

      setDeptData(deptArr)
    } catch (err) {
      console.error("Cumplimiento error:", err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return {
    loading, departments, deptData,
    totalAsignados, totalAprobados, totalReprobados, totalPendientes,
    totalEmpleados, totalEmpleadosConPuesto,
    cargar,
  }
}
