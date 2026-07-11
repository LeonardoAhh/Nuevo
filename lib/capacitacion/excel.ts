import type { Course, Position, PositionCourse, Employee, EmployeeCourse } from "@/lib/hooks"
import { normalizeCourseName } from "@/lib/hooks/useCapacitacion"
import { supabase } from "@/lib/supabase/client"

type FilaRow = {
  'Número empleado': string
  Nombre: string
  Departamento: string
  Puesto: string
  Curso: string
  Tipo: string
  'Fecha de aplicación': string
  Calificación: string
  Tomado: string
  Aprobado: string
  Reprobado: string
}

export async function downloadExcelReport({
  courses,
  positions,
  positionCourses,
  employees,
  empCourses,
}: {
  courses: Course[]
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
    { header: 'Número empleado',    key: 'Número empleado',    width: 18 },
    { header: 'Nombre',             key: 'Nombre',             width: 32 },
    { header: 'Departamento',       key: 'Departamento',       width: 24 },
    { header: 'Puesto',             key: 'Puesto',             width: 24 },
    { header: 'Curso',              key: 'Curso',              width: 32 },
    { header: 'Tipo',               key: 'Tipo',               width: 14 },
    { header: 'Fecha de aplicación', key: 'Fecha de aplicación', width: 18 },
    { header: 'Calificación',       key: 'Calificación',       width: 14 },
    { header: 'Tomado',             key: 'Tomado',             width: 12 },
    { header: 'Aprobado',           key: 'Aprobado',           width: 12 },
    { header: 'Reprobado',          key: 'Reprobado',          width: 12 },
  ]

  const filas: FilaRow[] = []

  // Generar una fila por cada combinación empleado × curso del catálogo.
  const norm = (s: string) => normalizeCourseName(s || '')

  // Cargar aliases para mejorar matching (alias -> course_id)
  let aliasMap = new Map<string, string>()
  try {
    const { data: aliases, error } = await supabase.from('course_aliases').select('alias, course_id')
    if (!error && aliases) {
      aliases.forEach((a: any) => aliasMap.set((a.alias || '').toString(), a.course_id))
    }
  } catch (e) {
    console.error('No se pudo cargar course_aliases para diagnóstico:', e)
  }
  const normPos = (s: string | null | undefined) => (s || '').toString().trim().toLowerCase()
  // Para cada empleado, incluir cursos asignados a su puesto (Requeridos) y adicionales (Extra)
  for (const emp of employees) {
    const puestoNombre = emp.puesto ?? ''
    const pos = puestoNombre ? positions.find(p => normPos(p.name) === normPos(puestoNombre)) : undefined

    const assignedCourseIds = pos ? positionCourses
      .filter(pc => pc.position_id === pos.id)
      .map(pc => pc.course_id) : []

    const assignedCourses = courses.filter(c => assignedCourseIds.includes(c.id))
    
    // Obtener los cursos que el empleado realmente ha tomado
    const myEmpCourses = empCourses.filter(ec => ec.employee_id === emp.id)
    
    // Si no tiene cursos asignados y no ha tomado ningún curso extra, omitimos
    if (assignedCourses.length === 0 && myEmpCourses.length === 0) continue

    const processedCourseNorms = new Set<string>()

    // 1. Cursos Requeridos (del puesto)
    for (const course of assignedCourses) {
      const courseNorm = norm(course.name)
      processedCourseNorms.add(courseNorm)

      const match = myEmpCourses.find(ec => {
        if (ec.course_id && ec.course_id === course.id) return true
        const ecCourseName = ec.course?.name ?? ec.raw_course_name ?? ''
        const ecNorm = norm(ecCourseName)
        if (!ecNorm) return false
        if (ecNorm === courseNorm) return true
        if (ecNorm.includes(courseNorm) || courseNorm.includes(ecNorm)) return true
        if (aliasMap.get(ecNorm) === course.id) return true
        return false
      })

      const tomado = match ? 'Sí' : 'No'
      const aprobado = match?.calificacion != null && match.calificacion >= 7 ? 'Sí' : 'No'
      const reprobado = match?.calificacion != null && match.calificacion < 7 ? 'Sí' : 'No'
      const calificacion = match?.calificacion != null ? String(match.calificacion) : ''
      const fechaAplicacion = match?.fecha_aplicacion ? match.fecha_aplicacion.split('-').reverse().join('/') : ''

      filas.push({
        'Número empleado': emp.numero ?? '',
        Nombre: emp.nombre,
        Departamento: emp.departamento ?? '',
        Puesto: emp.puesto ?? '',
        Curso: course.name,
        Tipo: 'Requerido',
        'Fecha de aplicación': fechaAplicacion,
        Calificación: calificacion,
        Tomado: tomado,
        Aprobado: aprobado,
        Reprobado: reprobado,
      })
    }

    // 2. Cursos Extra (tomados pero no requeridos)
    for (const ec of myEmpCourses) {
      const ecCourseName = ec.course?.name ?? ec.raw_course_name ?? ''
      const ecNorm = norm(ecCourseName)
      if (!ecNorm) continue

      // Verificar si ya fue procesado como curso requerido
      let isRequerido = false
      for (const reqNorm of Array.from(processedCourseNorms)) {
        if (ecNorm === reqNorm || ecNorm.includes(reqNorm) || reqNorm.includes(ecNorm)) {
          isRequerido = true
          break
        }
      }
      if (!isRequerido && ec.course_id && assignedCourseIds.includes(ec.course_id)) {
        isRequerido = true
      }
      if (!isRequerido && aliasMap.has(ecNorm) && assignedCourseIds.includes(aliasMap.get(ecNorm)!)) {
        isRequerido = true
      }

      if (isRequerido) continue // Ya se procesó en el bloque anterior

      // Añadir al set para evitar posibles duplicados si el historial tiene el mismo extra dos veces
      processedCourseNorms.add(ecNorm)

      const tomado = 'Sí' // Si está en el historial (myEmpCourses), por definición ya lo tomó
      const aprobado = ec.calificacion != null && ec.calificacion >= 7 ? 'Sí' : 'No'
      const reprobado = ec.calificacion != null && ec.calificacion < 7 ? 'Sí' : 'No'
      const calificacion = ec.calificacion != null ? String(ec.calificacion) : ''
      const fechaAplicacion = ec.fecha_aplicacion ? ec.fecha_aplicacion.split('-').reverse().join('/') : ''

      filas.push({
        'Número empleado': emp.numero ?? '',
        Nombre: emp.nombre,
        Departamento: emp.departamento ?? '',
        Puesto: emp.puesto ?? '',
        Curso: ecCourseName,
        Tipo: 'Extra',
        'Fecha de aplicación': fechaAplicacion,
        Calificación: calificacion,
        Tomado: tomado,
        Aprobado: aprobado,
        Reprobado: reprobado,
      })
    }
  }

  filas.sort((a, b) => {
    // Primero ordenamos por Número de Empleado
    const empCmp = (a['Número empleado'] || '').localeCompare(b['Número empleado'] || '')
    if (empCmp !== 0) return empCmp

    // Luego ordenamos por Tipo: 'Requerido' antes que 'Extra'
    if (a.Tipo !== b.Tipo) {
      return a.Tipo === 'Requerido' ? -1 : 1
    }

    // Por último, ordenamos por Curso alfabéticamente
    return (a.Curso || '').localeCompare(b.Curso || '')
  })

  filas.forEach(row => sheet.addRow(row))

  // Hoja de diagnóstico: contar registros y mostrar muestra de `empCourses` para depuración
  try {
    const diag = workbook.addWorksheet('Diagnostico')
    diag.columns = [
      { header: 'Clave', key: 'k', width: 24 },
      { header: 'Valor', key: 'v', width: 80 },
    ]
    diag.addRow({ k: 'empleados_count', v: employees.length })
    diag.addRow({ k: 'cursos_count', v: courses.length })
    diag.addRow({ k: 'empCourses_count', v: empCourses.length })
    diag.addRow({ k: 'muestra_empCourses (primeros 20)', v: '' })
    const sample = empCourses.slice(0, 20)
    sample.forEach((ec, idx) => {
      diag.addRow({ k: `#${idx + 1}`, v: JSON.stringify({ id: ec.id, employee_id: ec.employee_id, course_id: ec.course_id, course_name: ec.course?.name ?? null, raw_course_name: ec.raw_course_name, fecha_aplicacion: ec.fecha_aplicacion, calificacion: ec.calificacion }) })
    })
    diag.addRow({ k: '', v: '' })
    diag.addRow({ k: 'positions (name:id)', v: '' })
    positions.forEach((p: any) => diag.addRow({ k: p.name, v: p.id }))
    diag.addRow({ k: '', v: '' })
    diag.addRow({ k: 'employees (nombre | puesto | matched_position_id | assigned_courses_count)', v: '' })
    employees.forEach((e: any) => {
      const matched = positions.find((p: any) => normPos(p.name) === normPos(e.puesto))
      const assignedCount = matched ? positionCourses.filter((pc: any) => pc.position_id === matched.id).length : 0
      diag.addRow({ k: e.nombre, v: `${e.puesto} | ${matched ? matched.id : 'NO_MATCH'} | ${assignedCount}` })
    })
  } catch (e) {
    // no bloquear la exportación por errores de diagnóstico
    console.error('Error creando hoja Diagnostico:', e)
  }

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
