"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface TrainingHoursMonthStat {
  month: number
  uniqueCourses: number
}

export interface TrainingHoursYearStat {
  year: string
  totalHours: number
  uniqueEmployees: number
  avgHoursPerEmployee: number
  courseTakings: number
  coursesWithDuration: number
  months: TrainingHoursMonthStat[]
}

export interface TrainingHoursStats {
  loading: boolean
  years: TrainingHoursYearStat[]
  totalCoursesInCatalog: number
  coursesWithDurationCount: number
  refresh: () => void
}

const PAGE_SIZE = 1000

export function useTrainingHours(): TrainingHoursStats {
  const [loading, setLoading] = useState(true)
  const [years, setYears] = useState<TrainingHoursYearStat[]>([])
  const [totalCoursesInCatalog, setTotalCoursesInCatalog] = useState(0)
  const [coursesWithDurationCount, setCoursesWithDurationCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, duration_hours")
      if (coursesError) throw new Error(coursesError.message)

      const allCourses = coursesData ?? []
      const durationMap = new Map<string, number>()
      for (const c of allCourses) {
        if (c.duration_hours != null && Number(c.duration_hours) > 0) {
          durationMap.set(c.id as string, Number(c.duration_hours))
        }
      }
      setTotalCoursesInCatalog(allCourses.length)
      setCoursesWithDurationCount(durationMap.size)

      if (durationMap.size === 0) {
        setYears([])
        return
      }

      const courseIds = Array.from(durationMap.keys())
      let allRows: { employee_id: string; course_id: string; fecha_aplicacion: string }[] = []
      let from = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from("employee_courses")
          .select("employee_id, course_id, fecha_aplicacion")
          .in("course_id", courseIds)
          .not("fecha_aplicacion", "is", null)
          .range(from, from + PAGE_SIZE - 1)
        if (error) throw new Error(error.message)
        const rows = (data ?? []) as { employee_id: string; course_id: string | null; fecha_aplicacion: string | null }[]
        allRows = allRows.concat(
          rows
            .filter(r => r.course_id && r.fecha_aplicacion)
            .map(r => ({ employee_id: r.employee_id, course_id: r.course_id as string, fecha_aplicacion: r.fecha_aplicacion as string })),
        )
        hasMore = rows.length === PAGE_SIZE
        from += PAGE_SIZE
      }

      const grouped = new Map<string, { totalHours: number; emps: Set<string>; takings: number; courses: Set<string>; monthCourses: Map<number, Set<string>> }>()
      for (const r of allRows) {
        const year = r.fecha_aplicacion.slice(0, 4)
        if (!/^\d{4}$/.test(year)) continue
        const month = parseInt(r.fecha_aplicacion.slice(5, 7), 10)
        const hours = durationMap.get(r.course_id) ?? 0
        if (!grouped.has(year)) {
          grouped.set(year, { totalHours: 0, emps: new Set(), takings: 0, courses: new Set(), monthCourses: new Map() })
        }
        const g = grouped.get(year)!
        g.totalHours += hours
        g.emps.add(r.employee_id)
        g.courses.add(r.course_id)
        g.takings += 1

        if (!g.monthCourses.has(month)) {
          g.monthCourses.set(month, new Set())
        }
        g.monthCourses.get(month)!.add(r.course_id)
      }

      const currentYear = new Date().getFullYear()
      const allowedYears = [String(currentYear - 2), String(currentYear - 1), String(currentYear)]

      const stats: TrainingHoursYearStat[] = Array.from(grouped.entries())
        .filter(([year]) => allowedYears.includes(year))
        .map(([year, g]) => {
          const months: TrainingHoursMonthStat[] = []
          for (let m = 1; m <= 12; m++) {
             months.push({ month: m, uniqueCourses: g.monthCourses.get(m)?.size ?? 0 })
          }

          return {
            year,
            totalHours: Math.round(g.totalHours * 100) / 100,
            uniqueEmployees: g.emps.size,
            avgHoursPerEmployee: g.emps.size > 0 ? Math.round((g.totalHours / g.emps.size) * 100) / 100 : 0,
            courseTakings: g.takings,
            coursesWithDuration: g.courses.size,
            months,
          }
        })
        .sort((a, b) => a.year.localeCompare(b.year))

      setYears(stats)
    } catch (err) {
      console.error("training hours error:", err instanceof Error ? err.message : JSON.stringify(err))
      notify.error("Error al cargar horas de capacitación")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    loading,
    years,
    totalCoursesInCatalog,
    coursesWithDurationCount,
    refresh: load,
  }
}
