export type NewEmpCourseRow = {
  course_id: string
  course_name: string
  fecha_aplicacion: string
  calificacion: string
}

export type BulkCourseRow = {
  id: number
  numero: string
  employeeId: string | null
  employeeName: string
  cursoRaw: string
  courseId: string | null
  fecha: string
  calificacion: string
}
