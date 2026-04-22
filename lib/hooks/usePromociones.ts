"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import type {
  EmpleadoPromocion,
  ReglaPromocion,
  CursoRequerido,
  EvaluacionDesempeño,
} from "@/lib/promociones/types"

/** Igual que useCapacitacion: mayúsculas, sin acentos, sin puntuación, trim */
function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Trae TODAS las filas de una tabla paginando de 1000 en 1000 */
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const PAGE = 1000
  const result: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await buildQuery(from, from + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    result.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return result
}

export function usePromociones() {
  const [empleados, setEmpleados] = useState<EmpleadoPromocion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // ── 1. Empleados ──────────────────────────────────────────────────────
      const { data: employeesData, error: empError } = await supabase
        .from("employees")
        .select("id, numero, nombre, puesto, departamento, area, turno, fecha_ingreso")
        .order("nombre")
      if (empError) throw empError
      if (!employeesData?.length) { setEmpleados([]); return }

      // ── 2. Datos de promoción (N.N → desempeño, examen, fecha inicio) ─────
      const { data: datosPromocion } = await supabase
        .from("datos_promocion")
        .select("*")

      // ── 3. Reglas de promoción por puesto ─────────────────────────────────
      const { data: reglasData } = await supabase
        .from("reglas_promocion")
        .select("*")

      // ── 4. Posiciones (id + name) ─────────────────────────────────────────
      const { data: positionsData } = await supabase
        .from("positions")
        .select("id, name")

      // ── 6. Cursos requeridos por posición (paginado) ──────────────────────
      const posCourses = await fetchAllRows((from, to) =>
        supabase
          .from("position_courses")
          .select("position_id, course_id, order_index, courses(id, name)")
          .order("order_index")
          .range(from, to)
      )

      // ── 7. Cursos tomados (paginado, solo los que tienen course_id) ────────
      const empCourses = await fetchAllRows((from, to) =>
        supabase
          .from("employee_courses")
          .select("employee_id, course_id, calificacion, fecha_aplicacion")
          .not("course_id", "is", null)
          .range(from, to)
      )


      // ── Construir índices ─────────────────────────────────────────────────

      // numero → datos_promocion
      const datosMap = new Map<string, Record<string, unknown>>()
      for (const d of datosPromocion ?? []) datosMap.set(String(d.numero), d)

      // norm(puesto) → regla   (sin acento, sin puntuación)
      const reglaMap = new Map<string, ReglaPromocion>()
      for (const r of reglasData ?? []) {
        reglaMap.set(norm(r.puesto), {
          puesto:                    r.puesto,
          promocionA:                r.promocion_a ?? undefined,
          minTemporalidadMeses:      r.min_temporalidad_meses,
          minCalificacionExamen:     r.min_calificacion_examen ?? undefined,
          minCalificacionEvaluacion: r.min_calificacion_evaluacion,
          minPorcentajeCursos:       r.min_porcentaje_cursos,
        })
      }

      // Para cada nombre de posición, guardar el position_id
      // con MÁS cursos asignados (evita tomar una posición vacía o incompleta)
      const posCourseCount = new Map<string, number>()
      for (const pc of posCourses ?? []) {
        posCourseCount.set(pc.position_id, (posCourseCount.get(pc.position_id) ?? 0) + 1)
      }
      // norm(posName) → position_id con MÁS cursos asignados
      const posFallMap = new Map<string, string>()
      for (const p of positionsData ?? []) {
        const key      = norm(p.name)
        const existing = posFallMap.get(key)
        const newCount = posCourseCount.get(p.id) ?? 0
        const oldCount = existing ? (posCourseCount.get(existing) ?? 0) : -1
        if (newCount > oldCount) posFallMap.set(key, p.id)
      }

      // position_id → { course_id, name, order_index }[]
      type CourseRef = { course_id: string; name: string; orderIndex: number }
      const posCoursesMap = new Map<string, CourseRef[]>()
      for (const pc of posCourses ?? []) {
        const course = pc.courses as unknown as { id: string; name: string } | null
        if (!course) continue
        if (!posCoursesMap.has(pc.position_id)) posCoursesMap.set(pc.position_id, [])
        posCoursesMap.get(pc.position_id)!.push({
          course_id:  pc.course_id,
          name:       course.name,
          orderIndex: pc.order_index,
        })
      }

      // employee_id → Map<course_id, { calificacion, fecha_aplicacion }>
      type TakenRow = { calificacion: number | null; fecha_aplicacion: string | null }
      const empCoursesMap = new Map<string, Map<string, TakenRow>>()
      for (const ec of empCourses ?? []) {
        if (!ec.course_id) continue
        if (!empCoursesMap.has(ec.employee_id)) empCoursesMap.set(ec.employee_id, new Map())
        empCoursesMap.get(ec.employee_id)!.set(ec.course_id, {
          calificacion:    ec.calificacion,
          fecha_aplicacion: ec.fecha_aplicacion,
        })
      }

      // ── Construir lista final ─────────────────────────────────────────────

      const result: EmpleadoPromocion[] = employeesData.map((emp) => {
        const datos = emp.numero ? datosMap.get(String(emp.numero)) : undefined
        const regla = emp.puesto ? reglaMap.get(norm(emp.puesto)) : undefined

        // Usar siempre la posición con MÁS cursos para el puesto dado.
        // Esto replica el comportamiento real de fetchEmployeeProgress en Capacitación:
        // cuando el lookup por departamento falla (ilike no es accent-insensitive),
        // retorna la primera posición sin filtro, que suele ser la más completa.
        const normPuesto = norm(emp.puesto ?? "")
        const posId = posFallMap.get(normPuesto)

        // Cursos requeridos (ordenados)
        const requeridos = posId
          ? (posCoursesMap.get(posId) ?? []).sort((a, b) => a.orderIndex - b.orderIndex)
          : []

        // Cursos tomados por este empleado
        const tomados = empCoursesMap.get(emp.id) ?? new Map<string, TakenRow>()

        const cursosRequeridos: CursoRequerido[] = requeridos.map(({ course_id, name }) => {
          const taken = tomados.get(course_id)
          const cal   = taken?.calificacion ?? null
          return {
            nombre:          name,
            // Aprobado = mismo criterio que useCapacitacion: cal >= 70 o simplemente tomado
            completado:      taken != null && (cal == null || cal >= 70),
            fechaAplicacion: taken?.fecha_aplicacion ?? undefined,
            calificacion:    cal ?? undefined,
          }
        })

        // Evaluación de desempeño desde datos_promocion
        const evaluaciones: EvaluacionDesempeño[] = []
        const desempeño = datos?.desempeño_actual != null ? Number(datos.desempeño_actual) : 0
        if (desempeño > 0) {
          evaluaciones.push({
            fecha:        String(datos?.fecha_inicio_puesto ?? new Date().toISOString().split("T")[0]),
            calificacion: desempeño,
            periodo:      datos?.periodo_evaluacion ? String(datos.periodo_evaluacion) : undefined,
          })
        }

        return {
          id:               emp.id,
          numero:           emp.numero ?? undefined,
          nombre:           emp.nombre,
          puesto:           emp.puesto ?? "",
          departamento:     emp.departamento ?? "",
          area:             emp.area ?? undefined,
          turno:            emp.turno ?? undefined,
          fechaIngresoPuesto: String(datos?.fecha_inicio_puesto ?? emp.fecha_ingreso ?? ""),
          fechaExamenGuardada: datos?.fecha_examen ? String(datos.fecha_examen) : undefined,
          calificacionExamen: datos?.ultima_calificacion_examen != null
            ? Number(datos.ultima_calificacion_examen)
            : undefined,
          intentosExamen:   datos?.intentos_examen != null ? Number(datos.intentos_examen) : 0,
          cursosRequeridos,
          evaluaciones,
          regla,
        }
      })

      setEmpleados(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar datos")
      notify.error("Error al cargar promociones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const guardarDesempeño = useCallback(async (
    numero: string,
    calificacion: number,
    periodo?: string,
  ): Promise<void> => {
    const { error: dbErr } = await supabase
      .from("datos_promocion")
      .upsert(
        {
          numero,
          desempeño_actual: calificacion,
          periodo_evaluacion: periodo?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "numero" }
      )
    if (dbErr) throw new Error(dbErr.message)
    await cargarDatos()
  }, [cargarDatos])

  const promoverEmpleado = useCallback(async (
    empleadoId: string,
    numero: string | undefined,
    nuevoPuesto: string,
    datos: {
      fechaInicio?: string
      fechaExamen?: string
      calExamen?: number
      intentosPrevios?: number
    },
  ): Promise<void> => {
    const { error: empErr } = await supabase
      .from("employees")
      .update({ puesto: nuevoPuesto })
      .eq("id", empleadoId)
    if (empErr) throw new Error(empErr.message)

    if (numero) {
      const { error: dpErr } = await supabase
        .from("datos_promocion")
        .upsert(
          {
            numero,
            fecha_inicio_puesto: datos.fechaInicio || null,
            fecha_examen: datos.fechaExamen || null,
            ultima_calificacion_examen: datos.calExamen ?? null,
            intentos_examen: (datos.intentosPrevios ?? 0) + (datos.calExamen != null ? 1 : 0),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "numero" }
        )
      if (dpErr) throw new Error(dpErr.message)
    }
    await cargarDatos()
  }, [cargarDatos])

  const guardarExamen = useCallback(async (
    numero: string,
    datos: {
      fechaInicio?: string
      fechaExamen?: string
      calExamen: number
      intentosPrevios?: number
    },
  ): Promise<void> => {
    const { error: dpErr } = await supabase
      .from("datos_promocion")
      .upsert(
        {
          numero,
          fecha_inicio_puesto: datos.fechaInicio || null,
          fecha_examen: datos.fechaExamen || null,
          ultima_calificacion_examen: datos.calExamen,
          intentos_examen: (datos.intentosPrevios ?? 0) + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "numero" }
      )
    if (dpErr) throw new Error(dpErr.message)
    await cargarDatos()
  }, [cargarDatos])

  return { empleados, loading, error, recargar: cargarDatos, guardarDesempeño, promoverEmpleado, guardarExamen }
}
