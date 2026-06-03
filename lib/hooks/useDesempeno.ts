"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import {
  OBJETIVOS_POR_PUESTO,
  DEFAULT_OBJETIVOS_POR_TIPO,
  DEFAULT_CUMPLIMIENTO,
  DEFAULT_CUMPLIMIENTO_POR_TIPO,
  DEFAULT_COMPETENCIAS,
  calcularPonderacion,
  type DesempenoData,
  type CumplimientoItem,
  type Competencia,
} from "@/lib/types/desempeno"
import { getTipoDesempenoByPuesto, normalizeDepartamento, mesesDePeriodo, PERIODOS_DESEMPENO } from "@/lib/catalogo"
import { esElegibleParaPeriodo } from "@/lib/desempeno/elegibilidad"

/** Origen del empleado: planta (`employees`) o nuevo ingreso (`nuevo_ingreso`). */
export type OrigenEmpleado = "planta" | "nuevo_ingreso"
export type PeriodoModo = "semestrales" | "mensuales"

/** Resultado de `buscarEmpleado`: origen + modo/periodo recomendado para el selector. */
export interface BusquedaResultado {
  origen: OrigenEmpleado
  modo: PeriodoModo
  periodo: string
  /** true si es planta Y elegible para el semestre activo → debe evaluarse semestral. */
  requiereSemestral: boolean
  /** Semestre activo (primer semestral sin evaluación) usado para el guardrail. */
  semestreObjetivo: string
}

/** Fila de `evaluaciones_desempeno` (campos usados al cargar una evaluación). */
interface EvalRowFull {
  id: string
  periodo: string | null
  evaluador_nombre: string | null
  evaluador_puesto: string | null
  tipo: string | null
  objetivos: DesempenoData["objetivos"] | null
  cumplimiento_responsabilidades: CumplimientoItem[] | null
  competencias: Competencia[] | null
  compromisos: string | null
  fecha_revision: string | null
  observaciones: string | null
  calificacion_final: number | null
}

export interface EvaluacionHistorial {
  id: string
  numero_empleado: string
  nombre?: string
  puesto?: string
  evaluador_nombre: string | null
  tipo: string
  periodo: string | null
  calificacion_final: number
  created_at: string
}

export function useDesempeno() {
  const [data, setData] = useState<DesempenoData | null>(null)
  const [origen, setOrigen] = useState<OrigenEmpleado | null>(null)
  const [requiereSemestral, setRequiereSemestral] = useState(false)
  const [semestreObjetivo, setSemestreObjetivo] = useState<string | null>(null)
  const [fechaIngreso, setFechaIngreso] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historial, setHistorial] = useState<EvaluacionHistorial[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const lastEvalId = useRef<string | null>(null)
  const dataRef = useRef<DesempenoData | null>(null)

  // Mantén dataRef sincronizado con data
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Sugerencias para typeahead: busca por número o nombre (ILIKE) en
  // employees y nuevo_ingreso. Devuelve hasta 8 resultados, sin duplicar números.
  const buscarSugerencias = useCallback(
    async (q: string): Promise<Array<{ numero: string; nombre: string; puesto: string }>> => {
      const term = q.trim()
      if (term.length < 2) return []
      const like = `%${term.replace(/[%_]/g, "")}%`

      const { data: emps } = await supabase
        .from("employees")
        .select("numero, nombre, puesto")
        .or(`numero.ilike.${like},nombre.ilike.${like}`)
        .limit(8)

      const results: Array<{ numero: string; nombre: string; puesto: string }> = []
      const seen = new Set<string>()
      for (const e of emps ?? []) {
        if (!e.numero || seen.has(e.numero)) continue
        seen.add(e.numero)
        results.push({ numero: e.numero, nombre: e.nombre ?? "", puesto: e.puesto ?? "" })
      }

      if (results.length < 8) {
        const { data: nis } = await supabase
          .from("nuevo_ingreso")
          .select("numero, nombre, puesto")
          .or(`numero.ilike.${like},nombre.ilike.${like}`)
          .limit(8 - results.length)
        for (const n of nis ?? []) {
          if (!n.numero || seen.has(n.numero)) continue
          seen.add(n.numero)
          results.push({ numero: n.numero, nombre: n.nombre ?? "", puesto: n.puesto ?? "" })
        }
      }

      return results
    },
    [],
  )

  const buscarEmpleado = useCallback(async (numero: string, restrictDepartamentos?: string[] | null, periodoSeleccionado?: string | null) => {
    setLoading(true)
    setError(null)

    try {
      // Search in both employees and nuevo_ingreso tables
      const { data: emp } = await supabase
        .from("employees")
        .select("id, numero, nombre, puesto, departamento, fecha_ingreso")
        .eq("numero", numero)
        .maybeSingle()

      let empleadoData: { numero: string; nombre: string; puesto: string; departamento: string | null; fechaIngreso: string | null } | null = null
      let origenEmpleado: OrigenEmpleado | null = null

      if (emp) {
        origenEmpleado = "planta"
        empleadoData = {
          numero: emp.numero!,
          nombre: emp.nombre,
          puesto: emp.puesto || "",
          departamento: emp.departamento ?? null,
          fechaIngreso: emp.fecha_ingreso ?? null,
        }
      } else {
        const { data: ni } = await supabase
          .from("nuevo_ingreso")
          .select("numero, nombre, puesto, departamento, fecha_ingreso")
          .eq("numero", numero)
          .maybeSingle()
        if (ni) {
          origenEmpleado = "nuevo_ingreso"
          empleadoData = {
            numero: ni.numero!,
            nombre: ni.nombre,
            puesto: ni.puesto || "",
            departamento: ni.departamento ?? null,
            fechaIngreso: ni.fecha_ingreso ?? null,
          }
        }
      }

      if (!empleadoData || !origenEmpleado) throw new Error("Empleado no encontrado")

      // Scope por departamento: el evaluador solo puede abrir empleados de las áreas asignadas
      if (restrictDepartamentos && restrictDepartamentos.length > 0) {
        const permitidos = restrictDepartamentos.map(normalizeDepartamento)
        if (!permitidos.includes(normalizeDepartamento(empleadoData.departamento))) {
          throw new Error(
            `Este empleado pertenece a otro departamento. Solo puedes evaluar a tu área (${restrictDepartamentos.join(", ")}).`,
          )
        }
      }

      setFechaIngreso(empleadoData.fechaIngreso)

      // Trae TODAS las evaluaciones del empleado (más reciente primero) para
      // poder resolver el periodo correcto y cargar la fila de ESE periodo.
      const { data: evalsRaw } = await supabase
        .from("evaluaciones_desempeno")
        .select("*")
        .eq("numero_empleado", numero)
        .order("created_at", { ascending: false })

      const evals = (evalsRaw ?? []) as EvalRowFull[]
      const periodosConEval = new Set(evals.map((e) => e.periodo).filter(Boolean) as string[])

      // Semestre activo = primer semestral SIN evaluación guardada (auto-avance:
      // si ya hizo DIC-MAY, pasa a JUN-NOV). Si todos están hechos, usa el último.
      const semestreActivo =
        PERIODOS_DESEMPENO.semestrales.find((p) => !periodosConEval.has(p)) ??
        PERIODOS_DESEMPENO.semestrales[PERIODOS_DESEMPENO.semestrales.length - 1]

      // Un empleado de planta solo se evalúa SEMESTRAL si ya cumple la antigüedad
      // mínima para el semestre activo. Si es planta pero recién ingresado (aún
      // no elegible), se evalúa MENSUAL (onboarding) hasta que califique; en ese
      // caso NO se bloquea el modo mensual.
      const elegibleSemestreActivo =
        origenEmpleado === "planta" &&
        esElegibleParaPeriodo(empleadoData.fechaIngreso, semestreActivo).elegible
      const requiereSemestralEmp = origenEmpleado === "planta" && elegibleSemestreActivo

      const mensuales = PERIODOS_DESEMPENO.mensuales as readonly string[]
      const mensualResuelto =
        periodoSeleccionado && mensuales.includes(periodoSeleccionado)
          ? periodoSeleccionado
          : PERIODOS_DESEMPENO.mensuales[0]

      const modo: PeriodoModo = requiereSemestralEmp ? "semestrales" : "mensuales"
      const periodoResuelto: string = requiereSemestralEmp ? semestreActivo : mensualResuelto

      // Carga la evaluación que corresponde al periodo resuelto (no la última
      // sin más): así guardar un periodo nuevo NO sobrescribe al anterior.
      const evalData = evals.find((e) => e.periodo === periodoResuelto) ?? null

      lastEvalId.current = evalData?.id ?? null

      const { data: incidenciaData, error: incidenciaError } = await supabase
        .from("incidencias")
        .select("categoria, valor, notas, mes")
        .eq("numero_empleado", numero)
        .order("mes", { ascending: false })

      if (incidenciaError) throw incidenciaError

      const puesto = empleadoData.puesto
      const tipoPuesto = getTipoDesempenoByPuesto(puesto)
      const objetivosFallback = OBJETIVOS_POR_PUESTO[puesto]
        ?? DEFAULT_OBJETIVOS_POR_TIPO[tipoPuesto]

      // Auto-calculate cumplimiento from incidencias using graduated scale
      const incidencias = incidenciaData ?? []

      // Graduated scale: 0→100%, 1→66%, 2→33%, 3+→0%
      const ESCALA_GRADUADA: Record<number, number> = { 0: 100, 1: 66, 2: 33 }
      const aplicarEscala = (count: number): number => ESCALA_GRADUADA[count] ?? 0

      const faltasDeMes = (mes: string): number =>
        incidencias
          .filter((i: Record<string, unknown>) => i.mes === mes && i.categoria === 'FALTA INJUSTIFICADA')
          .reduce((sum, i: Record<string, unknown>) => sum + ((i.valor as number) ?? 0), 0)

      // "Cumplir con asistencia": se evalúa por mes del periodo y se promedian
      // los % de los meses CON datos (≥1 incidencia registrada).
      //   Mensual  → 2 meses del label (ej "ENE-FEB 2026").
      //   Semestral → 6 meses del label (ej "DIC-MAY 2026").
      // Si el periodo no mapea a meses conocidos, fallback: todas las faltas.
      const targetPeriodo = evalData?.periodo || periodoResuelto
      const mesesPeriodo = mesesDePeriodo(targetPeriodo)

      let asistenciaPorcentaje: number
      if (mesesPeriodo.length > 0) {
        const mesesConDatos = mesesPeriodo.filter((mes) =>
          incidencias.some((i: Record<string, unknown>) => i.mes === mes),
        )
        if (mesesConDatos.length > 0) {
          const promedio =
            mesesConDatos.reduce((sum, mes) => sum + aplicarEscala(faltasDeMes(mes)), 0) /
            mesesConDatos.length
          asistenciaPorcentaje = Math.round(promedio)
        } else {
          asistenciaPorcentaje = 100
        }
      } else {
        const totalFaltas = incidencias
          .filter((i: Record<string, unknown>) => i.categoria === 'FALTA INJUSTIFICADA')
          .reduce((sum, i: Record<string, unknown>) => sum + ((i.valor as number) ?? 0), 0)
        asistenciaPorcentaje = aplicarEscala(totalFaltas)
      }

      // Map cumplimiento from saved data or use defaults (tipo-aware)
      const cumplimiento: CumplimientoItem[] = evalData?.cumplimiento_responsabilidades?.length
        ? (evalData.cumplimiento_responsabilidades as CumplimientoItem[])
        : (DEFAULT_CUMPLIMIENTO_POR_TIPO[tipoPuesto] ?? DEFAULT_CUMPLIMIENTO).map((c) => ({ ...c }))

      // Override auto-calculated fields with graduated scale values
      // index 2 = "Cumplir con asistencia" → based on faltas (only for operativo/administrativo)
      if (tipoPuesto !== "jefe" && cumplimiento[2]) {
        cumplimiento[2].porcentaje = String(asistenciaPorcentaje)
      }

      // Map competencias from saved data or use defaults
      const competencias: Competencia[] = evalData?.competencias?.length
        ? (evalData.competencias as Competencia[])
        : DEFAULT_COMPETENCIAS.map((c) => ({ ...c }))

      const result: DesempenoData = {
        numero_empleado: empleadoData.numero,
        nombre: empleadoData.nombre,
        puesto,
        evaluador_nombre: evalData?.evaluador_nombre || "",
        evaluador_puesto: evalData?.evaluador_puesto || "",
        tipo: (evalData?.tipo as DesempenoData["tipo"]) || tipoPuesto,
        periodo: periodoResuelto,  // ← Usa periodoResuelto en lugar de evalData?.periodo || ""
        objetivos: evalData?.objetivos?.length
          ? evalData.objetivos
          : objetivosFallback.map((obj) => ({ ...obj })),
        cumplimiento_responsabilidades: cumplimiento,
        competencias,
        compromisos: evalData?.compromisos || "",
        fecha_revision: evalData?.fecha_revision || "",
        observaciones: evalData?.observaciones || "",
        calificacion_final: evalData?.calificacion_final || 0,
        incidencias: (incidenciaData ?? []).map((item: Record<string, unknown>) => ({
          categoria: (item.categoria as string) ?? "",
          valor: (item.valor as number) ?? null,
          notas: (item.notas as string) ?? null,
          mes: (item.mes as string) ?? null,
        })),
      }

      setData(result)
      setOrigen(origenEmpleado)
      setRequiereSemestral(requiereSemestralEmp)
      setSemestreObjetivo(semestreActivo)
      return {
        origen: origenEmpleado,
        modo,
        periodo: periodoResuelto,
        requiereSemestral: requiereSemestralEmp,
        semestreObjetivo: semestreActivo,
      } satisfies BusquedaResultado
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      notify.error("Empleado no encontrado")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const resetSaveSuccess = useCallback(() => setSaveSuccess(false), [])

  const guardar = useCallback(async (evalData: DesempenoData) => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const ponderacion = calcularPonderacion(evalData)
      const row = {
        numero_empleado: evalData.numero_empleado,
        evaluador_nombre: evalData.evaluador_nombre || null,
        evaluador_puesto: evalData.evaluador_puesto || null,
        tipo: evalData.tipo,
        periodo: evalData.periodo || null,
        objetivos: evalData.objetivos,
        cumplimiento_responsabilidades: evalData.cumplimiento_responsabilidades,
        competencias: evalData.competencias,
        compromisos: evalData.compromisos || null,
        fecha_revision: evalData.fecha_revision || null,
        observaciones: evalData.observaciones || null,
        calificacion_final: ponderacion.calificacionFinal,
      }

      if (lastEvalId.current) {
        const { error: err } = await supabase
          .from("evaluaciones_desempeno")
          .update(row)
          .eq("id", lastEvalId.current)
        if (err) throw err
      } else {
        const { data: inserted, error: err } = await supabase
          .from("evaluaciones_desempeno")
          .insert(row)
          .select("id")
          .single()
        if (err) throw err
        lastEvalId.current = inserted.id
      }

      setData({ ...evalData, calificacion_final: ponderacion.calificacionFinal })
      setSaveSuccess(true)
      notify.success("Evaluación guardada")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message
        : typeof e === "object" && e !== null && "message" in e ? String((e as Record<string, unknown>).message)
        : "Error al guardar"
      console.error("[guardar]", e)
      notify.error(msg)
    } finally {
      setSaving(false)
    }
  }, [])

  const fetchHistorial = useCallback(async () => {
    setHistorialLoading(true)
    try {
      // Pagina el query hasta traer TODAS las evaluaciones (sin cap fijo).
      interface EvalRow {
        id: string
        numero_empleado: string
        evaluador_nombre: string | null
        tipo: string
        periodo: string | null
        calificacion_final: number
        created_at: string
      }
      const PAGE = 1000
      const evals: EvalRow[] = []
      for (let from = 0; ; from += PAGE) {
        const { data: page, error: err } = await supabase
          .from("evaluaciones_desempeno")
          .select("id, numero_empleado, evaluador_nombre, tipo, periodo, calificacion_final, created_at")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1)

        if (err) throw err
        if (!page || page.length === 0) break
        evals.push(...(page as EvalRow[]))
        if (page.length < PAGE) break
      }

      // Fetch employee names for each unique numero_empleado
      const numeros = [...new Set((evals ?? []).map((e) => e.numero_empleado))]
      const empleadoMap: Record<string, { nombre: string; puesto: string }> = {}

      if (numeros.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("numero, nombre, puesto")
          .in("numero", numeros)
        for (const e of emps ?? []) {
          if (e.numero) empleadoMap[e.numero] = { nombre: e.nombre, puesto: e.puesto || "" }
        }

        const missingNumeros = numeros.filter((n) => !empleadoMap[n])
        if (missingNumeros.length > 0) {
          const { data: niEmps } = await supabase
            .from("nuevo_ingreso")
            .select("numero, nombre, puesto")
            .in("numero", missingNumeros)
          for (const e of niEmps ?? []) {
            if (e.numero) empleadoMap[e.numero] = { nombre: e.nombre, puesto: e.puesto || "" }
          }
        }
      }

      setHistorial(
        (evals ?? []).map((e) => ({
          id: e.id,
          numero_empleado: e.numero_empleado,
          nombre: empleadoMap[e.numero_empleado]?.nombre,
          puesto: empleadoMap[e.numero_empleado]?.puesto,
          evaluador_nombre: e.evaluador_nombre,
          tipo: e.tipo,
          periodo: e.periodo,
          calificacion_final: e.calificacion_final,
          created_at: e.created_at,
        }))
      )
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Error al cargar historial")
    } finally {
      setHistorialLoading(false)
    }
  }, [])

  const cargarEvaluacion = useCallback(async (evalId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: evalRow, error: err } = await supabase
        .from("evaluaciones_desempeno")
        .select("*")
        .eq("id", evalId)
        .single()

      if (err || !evalRow) throw err ?? new Error("Evaluación no encontrada")

      lastEvalId.current = evalRow.id

      // Find employee info
      let nombre = ""
      let puesto = ""
      let fechaIngresoEmp: string | null = null
      const { data: emp } = await supabase
        .from("employees")
        .select("nombre, puesto, fecha_ingreso")
        .eq("numero", evalRow.numero_empleado)
        .maybeSingle()
      if (emp) {
        nombre = emp.nombre
        puesto = emp.puesto || ""
        fechaIngresoEmp = emp.fecha_ingreso ?? null
      } else {
        const { data: ni } = await supabase
          .from("nuevo_ingreso")
          .select("nombre, puesto, fecha_ingreso")
          .eq("numero", evalRow.numero_empleado)
          .maybeSingle()
        if (ni) {
          nombre = ni.nombre
          puesto = ni.puesto || ""
          fechaIngresoEmp = ni.fecha_ingreso ?? null
        }
      }

      setFechaIngreso(fechaIngresoEmp)

      const result: DesempenoData = {
        numero_empleado: evalRow.numero_empleado,
        nombre,
        puesto,
        evaluador_nombre: evalRow.evaluador_nombre || "",
        evaluador_puesto: evalRow.evaluador_puesto || "",
        tipo: (evalRow.tipo as DesempenoData["tipo"]) || "operativo",
        periodo: evalRow.periodo || "",
        objetivos: evalRow.objetivos?.length ? evalRow.objetivos : [],
        cumplimiento_responsabilidades: evalRow.cumplimiento_responsabilidades?.length
          ? (evalRow.cumplimiento_responsabilidades as CumplimientoItem[])
          : (DEFAULT_CUMPLIMIENTO_POR_TIPO[(evalRow.tipo as DesempenoData["tipo"]) || "operativo"] ?? DEFAULT_CUMPLIMIENTO).map((c) => ({ ...c })),
        competencias: evalRow.competencias?.length
          ? (evalRow.competencias as Competencia[])
          : DEFAULT_COMPETENCIAS.map((c) => ({ ...c })),
        compromisos: evalRow.compromisos || "",
        fecha_revision: evalRow.fecha_revision || "",
        observaciones: evalRow.observaciones || "",
        calificacion_final: evalRow.calificacion_final || 0,
      }

      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
      notify.error("Evaluación no encontrada")
    } finally {
      setLoading(false)
    }
  }, [])

  const eliminarEvaluacion = useCallback(async (evalId: string) => {
    const confirmed = await notify.confirm({
      title: "¿Eliminar esta evaluación?",
      description: "Esta acción no se puede deshacer.",
      tone: "destructive",
    })
    if (!confirmed) return false

    try {
      const { error: err } = await supabase
        .from("evaluaciones_desempeno")
        .delete()
        .eq("id", evalId)
      if (err) throw err

      if (lastEvalId.current === evalId) {
        lastEvalId.current = null
        setData(null)
        setOrigen(null)
        setRequiereSemestral(false)
        setSemestreObjetivo(null)
      }
      setHistorial((prev) => prev.filter((e) => e.id !== evalId))
      notify.success("Evaluación eliminada")
      return true
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Error al eliminar")
      return false
    }
  }, [])

  const recalcularAsistencia = useCallback((nuevoPeriodo: string) => {
    const currentData = dataRef.current
    if (!currentData) return

    const mesesPeriodo = mesesDePeriodo(nuevoPeriodo)
    const incidencias = currentData.incidencias ?? []

    // Graduated scale: 0→100%, 1→66%, 2→33%, 3+→0%
    const ESCALA_GRADUADA: Record<number, number> = { 0: 100, 1: 66, 2: 33 }
    const aplicarEscala = (count: number): number => ESCALA_GRADUADA[count] ?? 0

    const faltasDeMes = (mes: string): number =>
      incidencias
        .filter((i) => i.mes === mes && i.categoria === 'FALTA INJUSTIFICADA')
        .reduce((sum, i) => sum + (i.valor ?? 0), 0)

    let asistenciaPorcentaje: number
    if (mesesPeriodo.length > 0) {
      const mesesConDatos = mesesPeriodo.filter((mes) =>
        incidencias.some((i) => i.mes === mes),
      )
      if (mesesConDatos.length > 0) {
        const promedio =
          mesesConDatos.reduce((sum, mes) => sum + aplicarEscala(faltasDeMes(mes)), 0) /
          mesesConDatos.length
        asistenciaPorcentaje = Math.round(promedio)
      } else {
        asistenciaPorcentaje = 100
      }
    } else {
      const totalFaltas = incidencias
        .filter((i) => i.categoria === 'FALTA INJUSTIFICADA')
        .reduce((sum, i) => sum + (i.valor ?? 0), 0)
      asistenciaPorcentaje = aplicarEscala(totalFaltas)
    }

    const tipoPuesto = getTipoDesempenoByPuesto(currentData.puesto)
    const cumplimiento = [...(currentData.cumplimiento_responsabilidades ?? [])]

    // Actualiza el porcentaje de asistencia (índice 2) solo para operativo/administrativo
    if (tipoPuesto !== "jefe" && cumplimiento[2]) {
      cumplimiento[2] = { ...cumplimiento[2], porcentaje: String(asistenciaPorcentaje) }
    }

    setData({ ...currentData, periodo: nuevoPeriodo, cumplimiento_responsabilidades: cumplimiento })
  }, [])

  return {
    data, setData, origen, requiereSemestral, semestreObjetivo, fechaIngreso, loading, saving, saveSuccess, resetSaveSuccess, error,
    buscarEmpleado, buscarSugerencias, guardar, recalcularAsistencia,
    historial, historialLoading, fetchHistorial,
    cargarEvaluacion, eliminarEvaluacion,
  }
}
