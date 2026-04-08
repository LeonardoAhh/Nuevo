import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces – catálogo
// ─────────────────────────────────────────────────────────────────────────────

export interface Department {
  id: string
  name: string
  created_at: string
}

export interface Position {
  id: string
  name: string
  department_id: string
  department?: { name: string }
  created_at: string
}

export interface Course {
  id: string
  name: string
  created_at: string
}

export interface PositionCourse {
  id: string
  position_id: string
  course_id: string
  order_index: number
  course: { name: string }
}

export interface RawJsonRecord {
  position: string
  department: string
  [key: string]: string
}

export interface ImportPreview {
  departments: string[]
  positions: { name: string; department: string; courses: string[] }[]
  courses: string[]
  totalRecords: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces – historial
// ─────────────────────────────────────────────────────────────────────────────

export interface Employee {
  id: string
  numero: string | null
  nombre: string
  puesto: string | null
  departamento: string | null
  area: string | null
  turno: string | null
  fecha_ingreso: string | null
  jefe_directo: string | null
  created_at: string
}

export interface EmployeeCourse {
  id: string
  employee_id: string
  course_id: string | null
  raw_course_name: string
  fecha_aplicacion: string | null
  calificacion: number | null
  course?: { name: string } | null
}

export interface CourseProgress {
  courseId: string
  courseName: string
  orderIndex: number
  status: 'aprobado' | 'reprobado' | 'pendiente'
  calificacion: number | null
  fechaAplicacion: string | null
}

export interface EmployeeProgress {
  positionFound: boolean
  positionName: string | null
  totalRequired: number
  aprobados: number
  reprobados: number
  pendientes: number
  courses: CourseProgress[]
}

export interface CourseAlias {
  id: string
  alias: string
  course_id: string
  course?: { name: string }
}

export interface HistorialRawRecord {
  'N.N': string
  'NOMBRE': string
  'PUESTO': string
  'DEPARTAMENTO': string
  'ÁREA': string
  'TURNO': string
  'FECHA DE INGRESO': string
  'JEFE DIRECTO': string
  'CURSO TOMADO': string
  'FECHA DE APLICACIÓN': string
  'CALIFICACIÓN': string
  [key: string]: string
}

export type MatchStatus = 'exact' | 'alias' | 'approximate' | 'unknown'

export interface CourseMatch {
  rawName: string
  normalizedName: string
  status: MatchStatus
  suggestedCourseId: string | null
  suggestedCourseName: string | null
  confidence: number          // 0–1
  resolvedCourseId: string | null
  createNew: boolean
}

export interface HistorialPreview {
  totalRecords: number
  uniqueEmployees: number
  matches: CourseMatch[]
  rawRecords: HistorialRawRecord[]
  catalogSnapshot: Course[]   // catálogo al momento del análisis
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de matching (puras, sin estado)
// ─────────────────────────────────────────────────────────────────────────────

/** Normaliza un nombre de curso: mayúsculas, sin acentos, sin puntuación. */
export function normalizeCourseName(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita acentos
    .replace(/[^A-Z0-9\s]/g, ' ')      // quita puntuación
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Detecta si un nombre normalizado parece un código estructurado.
 * Ejemplos: "NOM-006-STPS-2014", "PR-ASC-027", "ISO 9001:2015", "NOM-035-STPS-2018"
 * Para estos, el Dice produce falsos positivos porque comparten prefijo/sufijo.
 * Regla: contiene al menos un bloque de 2+ dígitos Y guiones o tiene patrón tipo sigla.
 */
function isCodeLike(s: string): boolean {
  // Tiene dígitos agrupados (≥2 consecutivos) Y guiones: NOM-006-STPS-2014, PR-ASC-027
  if (/\d{2,}/.test(s) && /-/.test(s)) return true
  // Empieza con sigla conocida seguida de número: ISO9001, QS9000
  if (/^(NOM|ISO|PR|QS|AS|IATF|VDA|OHSAS|IEC)\s*[-:]?\s*\d/.test(s)) return true
  return false
}

function bigrams(s: string): Set<string> {
  const result = new Set<string>()
  for (let i = 0; i < s.length - 1; i++) result.add(s.slice(i, i + 2))
  return result
}

/** Coeficiente de Dice sobre bigramas. Rango 0–1. */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const ba = bigrams(a)
  const bb = bigrams(b)
  let intersection = 0
  for (const bg of ba) if (bb.has(bg)) intersection++
  return (2 * intersection) / (ba.size + bb.size)
}

function matchCourse(rawName: string, catalog: Course[], aliases: CourseAlias[]): CourseMatch {
  const norm = normalizeCourseName(rawName)
  const isCode = isCodeLike(norm)

  // 1. Alias conocido (variante ya aprendida) — siempre válido
  const alias = aliases.find(a => a.alias === norm)
  if (alias) {
    return {
      rawName, normalizedName: norm,
      status: 'alias',
      suggestedCourseId: alias.course_id,
      suggestedCourseName: alias.course?.name ?? null,
      confidence: 1,
      resolvedCourseId: alias.course_id,
      createNew: false,
    }
  }

  // 2. Coincidencia exacta normalizada — siempre válida
  const exact = catalog.find(c => normalizeCourseName(c.name) === norm)
  if (exact) {
    return {
      rawName, normalizedName: norm,
      status: 'exact',
      suggestedCourseId: exact.id,
      suggestedCourseName: exact.name,
      confidence: 1,
      resolvedCourseId: exact.id,
      createNew: false,
    }
  }

  // 3. Fuzzy: solo para nombres que NO son códigos estructurados
  //    Para NOMs, PRs, ISOs, etc. un Dice alto no garantiza que sean el mismo curso
  if (!isCode) {
    let best: Course | null = null
    let bestScore = 0
    for (const c of catalog) {
      // Tampoco comparar contra un catálogo que sea código si el raw no lo es
      if (isCodeLike(normalizeCourseName(c.name))) continue
      const score = diceCoefficient(norm, normalizeCourseName(c.name))
      if (score > bestScore) { bestScore = score; best = c }
    }

    if (bestScore >= 0.65 && best) {
      return {
        rawName, normalizedName: norm,
        status: 'approximate',
        suggestedCourseId: best.id,
        suggestedCourseName: best.name,
        confidence: bestScore,
        resolvedCourseId: best.id,
        createNew: false,
      }
    }
  }

  // 4. Sin coincidencia: se creará como nuevo curso por defecto
  return {
    rawName, normalizedName: norm,
    status: 'unknown',
    suggestedCourseId: null,
    suggestedCourseName: null,
    confidence: 0,
    resolvedCourseId: null,
    createNew: true,
  }
}

/** Convierte DD/MM/YYYY → YYYY-MM-DD para Supabase DATE. */
function parseDate(s: string): string | null {
  if (!s?.trim()) return null
  const parts = s.trim().split('/')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCapacitacion() {
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [matchingHistorial, setMatchingHistorial] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)

  // ── Parseo del catálogo (puestos / cursos requeridos) ─────────────────────

  const parseJSON = (raw: RawJsonRecord[]): ImportPreview => {
    const departmentsSet = new Set<string>()
    const coursesSet = new Set<string>()
    const positions: ImportPreview['positions'] = []

    for (const record of raw) {
      const posName = record.position?.trim()
      const deptName = record.department?.trim()
      if (!posName || !deptName) continue
      departmentsSet.add(deptName)
      const courses: string[] = []
      for (let i = 1; i <= 34; i++) {
        const val = record[`requiredCourses_${i}`]?.trim()
        if (val) { coursesSet.add(val); courses.push(val) }
      }
      positions.push({ name: posName, department: deptName, courses })
    }

    return {
      departments: Array.from(departmentsSet).sort(),
      positions,
      courses: Array.from(coursesSet).sort(),
      totalRecords: raw.length,
    }
  }

  // ── Importación del catálogo ──────────────────────────────────────────────

  const importData = async (preview: ImportPreview): Promise<{ success: boolean; error?: string }> => {
    setImporting(true)
    setImportError(null)
    try {
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .upsert(preview.departments.map(name => ({ name })), { onConflict: 'name' })
        .select('id, name')
      if (deptError) throw deptError
      const deptMap = new Map<string, string>()
      deptData?.forEach(d => deptMap.set(d.name, d.id))

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .upsert(preview.courses.map(name => ({ name })), { onConflict: 'name' })
        .select('id, name')
      if (courseError) throw courseError
      const courseMap = new Map<string, string>()
      courseData?.forEach(c => courseMap.set(c.name, c.id))

      const positionsToInsert = preview.positions
        .map(p => ({ name: p.name, department_id: deptMap.get(p.department)! }))
        .filter(p => p.department_id)
      const { data: posData, error: posError } = await supabase
        .from('positions')
        .upsert(positionsToInsert, { onConflict: 'name,department_id' })
        .select('id, name, department_id')
      if (posError) throw posError
      const posMap = new Map<string, string>()
      posData?.forEach(p => posMap.set(`${p.name}|||${p.department_id}`, p.id))

      const positionCourses: { position_id: string; course_id: string; order_index: number }[] = []
      for (const pos of preview.positions) {
        const deptId = deptMap.get(pos.department)
        if (!deptId) continue
        const posId = posMap.get(`${pos.name}|||${deptId}`)
        if (!posId) continue
        pos.courses.forEach((courseName, idx) => {
          const courseId = courseMap.get(courseName)
          if (courseId) positionCourses.push({ position_id: posId, course_id: courseId, order_index: idx + 1 })
        })
      }
      if (positionCourses.length > 0) {
        const { error: pcError } = await supabase
          .from('position_courses')
          .upsert(positionCourses, { onConflict: 'position_id,course_id', ignoreDuplicates: true })
        if (pcError) throw pcError
      }
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al importar datos'
      setImportError(msg)
      return { success: false, error: msg }
    } finally {
      setImporting(false)
    }
  }

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchDepartments = async (): Promise<Department[]> => {
    const { data, error } = await supabase.from('departments').select('*').order('name')
    if (error) throw error
    return data ?? []
  }

  const fetchPositions = async (departmentId?: string): Promise<Position[]> => {
    let query = supabase.from('positions').select('*, department:departments(name)').order('name')
    if (departmentId) query = query.eq('department_id', departmentId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Position[]
  }

  const fetchCourses = async (): Promise<Course[]> => {
    const { data, error } = await supabase.from('courses').select('*').order('name')
    if (error) throw error
    return data ?? []
  }

  const fetchPositionCourses = async (positionId: string): Promise<PositionCourse[]> => {
    const { data, error } = await supabase
      .from('position_courses')
      .select('*, course:courses(name)')
      .eq('position_id', positionId)
      .order('order_index')
    if (error) throw error
    return (data ?? []) as PositionCourse[]
  }

  const fetchCourseAliases = async (): Promise<CourseAlias[]> => {
    const { data, error } = await supabase
      .from('course_aliases')
      .select('*, course:courses(name)')
    if (error) throw error
    return (data ?? []) as CourseAlias[]
  }

  const fetchEmployees = async (): Promise<Employee[]> => {
    const { data, error } = await supabase.from('employees').select('*').order('nombre')
    if (error) throw new Error(error.message ?? JSON.stringify(error))
    return data ?? []
  }

  const fetchEmployeeCourses = async (employeeId: string): Promise<EmployeeCourse[]> => {
    const { data, error } = await supabase
      .from('employee_courses')
      .select('*, course:courses(name)')
      .eq('employee_id', employeeId)
      .order('fecha_aplicacion', { ascending: false })
    if (error) throw error
    return (data ?? []) as EmployeeCourse[]
  }

  // ── Historial: análisis con fuzzy matching ────────────────────────────────

  const parseHistorial = async (raw: HistorialRawRecord[]): Promise<HistorialPreview> => {
    setMatchingHistorial(true)
    setMatchError(null)
    try {
      const [catalog, aliases] = await Promise.all([fetchCourses(), fetchCourseAliases()])

      const uniqueEmployees = new Set<string>()
      const seenCourseNames = new Set<string>()
      const matches: CourseMatch[] = []

      for (const r of raw) {
        const nombre = r['NOMBRE']?.trim()
        if (nombre) uniqueEmployees.add(nombre)
        const curso = r['CURSO TOMADO']?.trim()
        if (curso && !seenCourseNames.has(curso)) {
          seenCourseNames.add(curso)
          matches.push(matchCourse(curso, catalog, aliases))
        }
      }

      return {
        totalRecords: raw.length,
        uniqueEmployees: uniqueEmployees.size,
        matches,
        rawRecords: raw,
        catalogSnapshot: catalog,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al analizar historial'
      setMatchError(msg)
      throw err
    } finally {
      setMatchingHistorial(false)
    }
  }

  // ── Historial: importación con resoluciones del usuario ───────────────────

  const importHistorial = async (
    preview: HistorialPreview,
    matches: CourseMatch[],
  ): Promise<{ success: boolean; error?: string }> => {
    setImporting(true)
    setImportError(null)
    try {
      // Copia mutable para actualizar IDs de cursos nuevos
      const matchMap = new Map(matches.map(m => [m.rawName, { ...m }]))

      // 1. Crear cursos nuevos (los que el usuario decidió no mapear)
      const newCourseMatches = matches.filter(m => m.createNew)
      if (newCourseMatches.length > 0) {
        const { data: newCourses, error } = await supabase
          .from('courses')
          .upsert(newCourseMatches.map(m => ({ name: m.rawName })), { onConflict: 'name' })
          .select('id, name')
        if (error) throw error
        newCourses?.forEach(c => {
          const m = matchMap.get(c.name)
          if (m) m.resolvedCourseId = c.id
        })
      }

      // 2. Upsert empleados (deduplicados por nombre)
      const uniqueEmpMap = new Map<string, HistorialRawRecord>()
      for (const r of preview.rawRecords) {
        const nombre = r['NOMBRE']?.trim()
        if (nombre && !uniqueEmpMap.has(nombre)) uniqueEmpMap.set(nombre, r)
      }

      const { data: empData, error: empError } = await supabase
        .from('employees')
        .upsert(
          Array.from(uniqueEmpMap.values()).map(r => ({
            numero:        r['N.N']?.trim() || null,
            nombre:        r['NOMBRE'].trim(),
            puesto:        r['PUESTO']?.trim() || null,
            departamento:  r['DEPARTAMENTO']?.trim() || null,
            area:          r['ÁREA']?.trim() || null,
            turno:         r['TURNO']?.trim() || null,
            fecha_ingreso: parseDate(r['FECHA DE INGRESO']),
            jefe_directo:  r['JEFE DIRECTO']?.trim() || null,
          })),
          { onConflict: 'nombre' },
        )
        .select('id, nombre')
      if (empError) throw empError

      const empIdMap = new Map(empData?.map(e => [e.nombre, e.id]) ?? [])

      // 3. Insertar historial de cursos
      const ecRecords = preview.rawRecords
        .filter(r => r['NOMBRE']?.trim() && r['CURSO TOMADO']?.trim())
        .map(r => {
          const nombre    = r['NOMBRE'].trim()
          const rawCourse = r['CURSO TOMADO'].trim()
          const employeeId = empIdMap.get(nombre)
          const m = matchMap.get(rawCourse)
          if (!employeeId) return null
          return {
            employee_id:      employeeId,
            course_id:        m?.resolvedCourseId ?? null,
            raw_course_name:  rawCourse,
            fecha_aplicacion: parseDate(r['FECHA DE APLICACIÓN']),
            calificacion:     r['CALIFICACIÓN'] ? (parseInt(r['CALIFICACIÓN']) || null) : null,
          }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)

      if (ecRecords.length > 0) {
        const { error: ecError } = await supabase
          .from('employee_courses')
          .upsert(ecRecords, { onConflict: 'employee_id,raw_course_name', ignoreDuplicates: true })
        if (ecError) throw ecError
      }

      // 4. Guardar alias para futuras importaciones
      //    (aproximados confirmados y desconocidos asignados a un curso existente)
      const aliasesToSave = matches
        .filter(m => !m.createNew && m.resolvedCourseId && m.status !== 'exact')
        .map(m => ({ alias: m.normalizedName, course_id: m.resolvedCourseId! }))
      if (aliasesToSave.length > 0) {
        await supabase
          .from('course_aliases')
          .upsert(aliasesToSave, { onConflict: 'alias', ignoreDuplicates: true })
      }

      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al importar historial'
      setImportError(msg)
      return { success: false, error: msg }
    } finally {
      setImporting(false)
    }
  }

  // ── Progreso: cursos requeridos vs tomados ────────────────────────────────

  const fetchEmployeeProgress = async (employee: Employee): Promise<EmployeeProgress> => {
    const empty: EmployeeProgress = {
      positionFound: false, positionName: null,
      totalRequired: 0, aprobados: 0, reprobados: 0, pendientes: 0, courses: [],
    }
    if (!employee.puesto) return empty

    // Busca departamento (case-insensitive via ilike)
    const { data: deptData } = await supabase
      .from('departments')
      .select('id, name')
      .ilike('name', employee.departamento?.trim() ?? '')
      .limit(1)
      .maybeSingle()

    // Busca puesto (ilike para tolerar mayúsculas/espacios)
    const posQuery = supabase
      .from('positions')
      .select('id, name')
      .ilike('name', employee.puesto.trim())
      .limit(1)

    if (deptData?.id) posQuery.eq('department_id', deptData.id)

    const { data: posData } = await posQuery.maybeSingle()
    if (!posData) return empty

    // Cursos requeridos del puesto
    const { data: reqData, error: reqError } = await supabase
      .from('position_courses')
      .select('course_id, order_index, course:courses(id, name)')
      .eq('position_id', posData.id)
      .order('order_index')
    if (reqError) throw new Error(reqError.message)

    if (!reqData || reqData.length === 0) {
      return { ...empty, positionFound: true, positionName: posData.name }
    }

    // Cursos tomados por el empleado (solo los que tienen course_id mapeado)
    const { data: takenData, error: takenError } = await supabase
      .from('employee_courses')
      .select('course_id, calificacion, fecha_aplicacion')
      .eq('employee_id', employee.id)
      .not('course_id', 'is', null)
    if (takenError) throw new Error(takenError.message)

    const takenMap = new Map(
      (takenData ?? []).map(t => [t.course_id, t])
    )

    const courses: CourseProgress[] = reqData.map(rc => {
      const taken = takenMap.get(rc.course_id)
      const cal = taken?.calificacion ?? null
      let status: CourseProgress['status']
      if (taken == null) status = 'pendiente'
      else if (cal != null && cal >= 70) status = 'aprobado'
      else status = 'reprobado'

      return {
        courseId:        rc.course_id,
        courseName:      (rc.course as any)?.name ?? '—',
        orderIndex:      rc.order_index,
        status,
        calificacion:    cal,
        fechaAplicacion: taken?.fecha_aplicacion ?? null,
      }
    })

    const aprobados  = courses.filter(c => c.status === 'aprobado').length
    const reprobados = courses.filter(c => c.status === 'reprobado').length
    const pendientes = courses.filter(c => c.status === 'pendiente').length

    return {
      positionFound: true,
      positionName:  posData.name,
      totalRequired: courses.length,
      aprobados, reprobados, pendientes,
      courses,
    }
  }

  // ── Borrar historial completo ─────────────────────────────────────────────

  const clearHistorial = async (): Promise<{ success: boolean; error?: string }> => {
    setImporting(true)
    setImportError(null)
    try {
      // employee_courses primero (FK a employees)
      const { error: ecError } = await supabase
        .from('employee_courses')
        .delete()
        .gte('created_at', '1970-01-01')   // condición siempre verdadera
      if (ecError) throw new Error(ecError.message)

      const { error: empError } = await supabase
        .from('employees')
        .delete()
        .gte('created_at', '1970-01-01')
      if (empError) throw new Error(empError.message)

      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al borrar historial'
      setImportError(msg)
      return { success: false, error: msg }
    } finally {
      setImporting(false)
    }
  }

  // ── Agregar cursos a un empleado existente ───────────────────────────────

  const addCoursesToEmployee = async (
    employeeId: string,
    employeeCourses: { course_id: string; course_name: string; fecha_aplicacion: string | null; calificacion: number | null }[]
  ): Promise<{ success: boolean; error?: string }> => {
    setImporting(true)
    setImportError(null)
    try {
      const records = employeeCourses
        .filter(c => c.course_id)
        .map(c => ({
          employee_id: employeeId,
          course_id: c.course_id,
          raw_course_name: c.course_name,
          fecha_aplicacion: c.fecha_aplicacion,
          calificacion: c.calificacion,
        }))
      if (records.length === 0) return { success: true }
      const { error } = await supabase
        .from('employee_courses')
        .upsert(records, { onConflict: 'employee_id,raw_course_name', ignoreDuplicates: false })
      if (error) throw new Error(error.message)
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al agregar cursos'
      setImportError(msg)
      return { success: false, error: msg }
    } finally {
      setImporting(false)
    }
  }

  // ── Crear empleado manualmente con cursos ────────────────────────────────

  const createEmployeeManual = async (
    employee: {
      numero: string | null
      nombre: string
      puesto: string | null
      departamento: string | null
      area: string | null
      turno: string | null
      fecha_ingreso: string | null
      jefe_directo: string | null
    },
    employeeCourses: { course_id: string; course_name: string; fecha_aplicacion: string | null; calificacion: number | null }[]
  ): Promise<{ success: boolean; error?: string }> => {
    setImporting(true)
    setImportError(null)
    try {
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .upsert([employee], { onConflict: 'nombre' })
        .select('id')
      if (empError) throw new Error(empError.message)
      const employeeId = empData?.[0]?.id
      if (!employeeId) throw new Error('No se obtuvo el ID del empleado')

      if (employeeCourses.length > 0) {
        const records = employeeCourses
          .filter(c => c.course_id)
          .map(c => ({
            employee_id: employeeId,
            course_id: c.course_id,
            raw_course_name: c.course_name,
            fecha_aplicacion: c.fecha_aplicacion,
            calificacion: c.calificacion,
          }))
        if (records.length > 0) {
          const { error: ecError } = await supabase
            .from('employee_courses')
            .upsert(records, { onConflict: 'employee_id,raw_course_name', ignoreDuplicates: true })
          if (ecError) throw new Error(ecError.message)
        }
      }
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear empleado'
      setImportError(msg)
      return { success: false, error: msg }
    } finally {
      setImporting(false)
    }
  }

  return {
    importing,
    importError,
    matchingHistorial,
    matchError,
    // Catálogo
    parseJSON,
    importData,
    fetchDepartments,
    fetchPositions,
    fetchCourses,
    fetchPositionCourses,
    // Historial
    fetchCourseAliases,
    fetchEmployees,
    fetchEmployeeCourses,
    fetchEmployeeProgress,
    parseHistorial,
    importHistorial,
    clearHistorial,
    createEmployeeManual,
    addCoursesToEmployee,
  }
}
