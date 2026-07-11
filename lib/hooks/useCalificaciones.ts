"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalificacionCurso {
  id: string
  raw_course_name: string
  course_name: string | null
  fecha_aplicacion: string | null
  calificacion: number | null
}

export interface EmpleadoCalificaciones {
  id: string
  numero: string | null
  nombre: string
  puesto: string | null
  departamento: string | null
  area: string | null
  turno: string | null
  cursos: CalificacionCurso[]
  promedio: number | null
  totalAprobados: number
  totalReprobados: number
  totalPendientes: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCalificaciones() {
  const [data, setData] = useState<EmpleadoCalificaciones[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: employees, error: empErr } = await supabase
        .from("employees")
        .select(`
          id, numero, nombre, puesto, departamento, area, turno,
          employee_courses(id, raw_course_name, fecha_aplicacion, calificacion, course:courses(name))
        `)
        .order("nombre")

      if (empErr) throw empErr

      const result: EmpleadoCalificaciones[] = (employees ?? []).map((emp) => {
        const rawCourses = ((emp.employee_courses ?? []) as unknown) as Array<{
          id: string
          raw_course_name: string
          fecha_aplicacion: string | null
          calificacion: number | null
          course: { name: string } | { name: string }[] | null
        }>

        const cursos: CalificacionCurso[] = rawCourses.map((c) => {
          const courseName = Array.isArray(c.course)
            ? c.course[0]?.name ?? null
            : c.course?.name ?? null
          return {
            id: c.id,
            raw_course_name: c.raw_course_name,
            course_name: courseName,
            fecha_aplicacion: c.fecha_aplicacion,
            calificacion: c.calificacion,
          }
        })

        const withCal = cursos.filter((c) => c.calificacion !== null)
        const promedio =
          withCal.length > 0
            ? Math.round(withCal.reduce((s, c) => s + (c.calificacion ?? 0), 0) / withCal.length)
            : null
        const totalAprobados = cursos.filter((c) => c.calificacion !== null && c.calificacion >= 70).length
        const totalReprobados = cursos.filter((c) => c.calificacion !== null && c.calificacion < 70).length
        const totalPendientes = cursos.filter((c) => c.calificacion === null).length

        return {
          id: emp.id,
          numero: emp.numero,
          nombre: emp.nombre,
          puesto: emp.puesto,
          departamento: emp.departamento,
          area: emp.area,
          turno: emp.turno,
          cursos,
          promedio,
          totalAprobados,
          totalReprobados,
          totalPendientes,
        }
      })

      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar calificaciones")
      notify.error("Error al cargar calificaciones")
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetch }
}
