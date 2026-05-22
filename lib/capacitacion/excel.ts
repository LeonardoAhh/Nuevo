import type { Course, Position, PositionCourse, Employee, EmployeeCourse } from "@/lib/hooks"

type FilaRow = {
  Curso: string
  Empleado: string
  Departamento: string
  Puesto: string
  Fecha: string
  Calificacion: string
  Estado: string
}

const ORDEN_ESTADO: Record<string, number> = { Pendiente: 0, Reprobado: 1, Aprobado: 2 }

export async function downloadExcelReport({
  filteredCourses,
  positions,
  positionCourses,
  employees,
  empCourses,
}: {
  filteredCourses: Course[]
  positions: Position[]
  positionCourses: PositionCourse[]
  employees: Employee[]
  empCourses: EmployeeCourse[]
}) {
  const ExcelJS = await import('exceljs')
  // @ts-ignore
  const { saveAs } = await import('file-saver')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Reporte')

  sheet.columns = [
    { header: 'Curso',        key: 'Curso',        width: 32 },
    { header: 'Empleado',     key: 'Empleado',     width: 32 },
    { header: 'Departamento', key: 'Departamento', width: 24 },
    { header: 'Puesto',       key: 'Puesto',       width: 24 },
    { header: 'Fecha',        key: 'Fecha',        width: 14 },
    { header: 'Calificación', key: 'Calificacion', width: 14 },
    { header: 'Estado',       key: 'Estado',       width: 14 },
  ]

  const filas: FilaRow[] = []

  for (const course of filteredCourses) {
    const puestosAsignados = positions
      .filter(pos => positionCourses.some(pc => pc.course_id === course.id && pc.position_id === pos.id))
      .map(pos => pos.name)

    for (const emp of employees.filter(emp => puestosAsignados.includes(emp.puesto ?? ''))) {
      const match = empCourses.find(ec => ec.course_id === course.id && ec.employee_id === emp.id)
      let estado = 'Pendiente', calificacion = '', fecha = ''
      if (match) {
        calificacion = match.calificacion != null ? String(match.calificacion) : ''
        fecha = match.fecha_aplicacion ? match.fecha_aplicacion.split('-').reverse().join('/') : ''
        if (match.calificacion != null) estado = match.calificacion >= 70 ? 'Aprobado' : 'Reprobado'
      }
      filas.push({
        Curso: course.name,
        Empleado: emp.nombre,
        Departamento: emp.departamento ?? '',
        Puesto: emp.puesto ?? '',
        Fecha: fecha,
        Calificacion: calificacion,
        Estado: estado,
      })
    }
  }

  filas.sort((a, b) => {
    const dep = (a.Departamento || '').localeCompare(b.Departamento || '')
    return dep !== 0 ? dep : ORDEN_ESTADO[a.Estado] - ORDEN_ESTADO[b.Estado]
  })

  filas.forEach(row => sheet.addRow(row))

  sheet.getRow(1).font      = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Daytona', size: 12 }
  sheet.getRow(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } }
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.columns.forEach(col => { col.alignment = { vertical: 'middle', horizontal: 'left' } })
  sheet.eachRow((row, idx) => {
    if (idx > 1) {
      row.font      = { name: 'Daytona', size: 11 }
      row.alignment = { vertical: 'middle', horizontal: 'left' }
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const today  = new Date().toISOString().slice(0, 10)
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `reporte-cursos-${today}.xlsx`,
  )
}
