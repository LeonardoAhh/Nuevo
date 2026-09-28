"use client"
import { useState } from "react"
import type { Course } from "@/lib/hooks/useCapacitacion"
import type { NewEmpCourseRow } from "@/lib/capacitacion/types"

const EMPTY_ROW: NewEmpCourseRow = {
  course_id: '',
  course_name: '',
  fecha_aplicacion: '',
  calificacion: '',
}

export function useCourseRows(courses: Course[], initial: NewEmpCourseRow[] = []) {
  const [rows, setRows] = useState<NewEmpCourseRow[]>(initial)

  const add = () => setRows(prev => [...prev, { ...EMPTY_ROW }])

  const remove = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const update = (i: number, field: keyof NewEmpCourseRow, value: string) =>
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      if (field === 'course_id') {
        const course = courses.find(c => c.id === value)
        return { ...r, course_id: value, course_name: course?.name ?? '' }
      }
      return { ...r, [field]: value }
    }))

  const reset = (newRows: NewEmpCourseRow[] = []) => setRows(newRows)

  return { rows, add, remove, update, reset }
}
