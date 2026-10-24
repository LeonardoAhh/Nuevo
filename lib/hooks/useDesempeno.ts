"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import { useRole } from "@/lib/hooks/useRole"
import {

  DEFAULT_CUMPLIMIENTO,
  DEFAULT_CUMPLIMIENTO_POR_TIPO,
  DEFAULT_COMPETENCIAS_POR_TIPO,
  calcularPonderacion,
  validarEvaluacion,
  type DesempenoData,
  type CumplimientoItem,
  type Competencia,
} from "@/lib/types/desempeno"
import { getTipoDesempenoByPuesto, normalizarPeriodoDesempeno, type PeriodoModo } from "@/lib/catalogo"
import { periodoVigenteParaEmpleado, type OrigenEmpleado } from "@/lib/desempeno/periodo-empleado"
import { calcularAsistenciaPorcentaje, crearBorradorEvaluacion } from "@/lib/desempeno/crear-borrador"
import { hitoVigentePendiente, type SeguimientoNuevoIngreso } from "@/lib/desempeno/hitos-nuevo-ingreso"

/** Origen del empleado: planta (`employees`) o nuevo ingreso (`nuevo_ingreso`). */
export type { OrigenEmpleado } from "@/lib/desempeno/periodo-empleado"

interface EmpleadoOrigenData {
  numero: string
  nombre: string
  puesto: string | null
  departamento?: string | null
  fecha_ingreso?: string | null
}

interface NuevoIngresoOrigenData extends EmpleadoOrigenData {
  tipo_contrato: string | null
  eval_1_fecha: string | null
  eval_1_calificacion: number | null
  eval_2_fecha: string | null
  eval_2_calificacion: number | null
  eval_3_fecha: string | null
  eval_3_calificacion: number | null
}

const CONTRATO_INDETERMINADO = "Indeterminado"

class EvaluationMessageError extends Error {
  constructor(readonly title: string, message: string) {
    super(message)
  }
}

interface EvaluationUiError {
  title: string
  description: string
}

/**
 * Un contrato de prueba vigente es la fuente autoritativa aunque el número ya
 * exista en employees. Cuando pasa a indeterminado, employees recupera prioridad.
 */
function resolverOrigenEmpleado(
  empleado: EmpleadoOrigenData | null,
  nuevoIngreso: NuevoIngresoOrigenData | null,
): { origen: OrigenEmpleado; registro: EmpleadoOrigenData } | null {
  const nuevoIngresoActivo = nuevoIngreso && nuevoIngreso.tipo_contrato !== CONTRATO_INDETERMINADO
  if (nuevoIngresoActivo) return { origen: "nuevo_ingreso", registro: nuevoIngreso }
  if (empleado) return { origen: "planta", registro: empleado }
  if (nuevoIngreso) return { origen: "planta", registro: nuevoIngreso }
  return null
}

export type { PeriodoModo } from "@/lib/catalogo"

/** Resultado de `buscarEmpleado`: origen + modo/periodo recomendado para el selector. */
export interface BusquedaResultado {
  origen: OrigenEmpleado
  modo: PeriodoModo
  periodo: string
  /** true si es planta Y elegible para el semestre activo → debe evaluarse semestral. */
  requiereSemestral: boolean
  /** Semestre vigente usado para determinar la modalidad. */
  semestreObjetivo: string
}

/** Fila de `evaluaciones_desempeno` (campos usados al cargar una evaluación). */
interface EvalRowFull {
  id: string
  periodo: string | null
  hito_nuevo_ingreso: 1 | 2 | 3 | null
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
  hito_nuevo_ingreso: 1 | 2 | 3 | null
  calificacion_final: number
  created_at: string
  origen?: "planta" | "nuevo_ingreso"
}

export function useDesempeno() {
  const { isEvaluador } = useRole()
  const [data, setData] = useState<DesempenoData | null>(null)
  const [existingEvaluation, setExistingEvaluation] = useState<{
    periodo: string
    numero: string
    nombre: string
    calificacion: number | null
  } | null>(null)
  const [origen, setOrigen] = useState<OrigenEmpleado | null>(null)
  const [requiereSemestral, setRequiereSemestral] = useState(false)
  const [semestreObjetivo, setSemestreObjetivo] = useState<string | null>(null)
  const [fechaIngreso, setFechaIngreso] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<EvaluationUiError | null>(null)
  const [historial, setHistorial] = useState<EvaluacionHistorial[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const lastEvalId = useRef<string | null>(null)
  const lastEvalKey = useRef<string | null>(null)
  const searchRequest = useRef(0)
  const savingRef = useRef(false)
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

      const [{ data: emps }, { data: nuevos }] = await Promise.all([
        supabase
          .from("employees")
          .select("numero, nombre, puesto")
          .or(`numero.ilike.${like},nombre.ilike.${like}`)
          .limit(8),
        supabase
          .from("nuevo_ingreso")
          .select("numero, nombre, puesto, tipo_contrato")
          .or(`numero.ilike.${like},nombre.ilike.${like}`)
          .limit(8),
      ])

      const empleadosPorNumero = new Map(
        (emps ?? []).filter(e => e.numero).map(e => [e.numero!, e as EmpleadoOrigenData]),
      )
      const nuevosPorNumero = new Map(
        (nuevos ?? []).filter(e => e.numero).map(e => [e.numero!, e as NuevoIngresoOrigenData]),
      )
      const numeros = [...new Set([...nuevosPorNumero.keys(), ...empleadosPorNumero.keys()])]

      return numeros.slice(0, 8).flatMap(numero => {
        const resolved = resolverOrigenEmpleado(
          empleadosPorNumero.get(numero) ?? null,
          nuevosPorNumero.get(numero) ?? null,
        )
        return resolved
          ? [{ numero, nombre: resolved.registro.nombre ?? "", puesto: resolved.registro.puesto ?? "" }]
          : []
      })
    },
    [],
  )

  const buscarEmpleado = useCallback(async (numero: string) => {
    const requestId = ++searchRequest.current
    setLoading(true)
    setError(null)
    setData(null)
    setExistingEvaluation(null)
    setSaveSuccess(false)

    try {
      // Consulta ambas fuentes: un contrato de prueba activo debe prevalecer
      // sobre una copia del mismo número que ya exista en employees.
      const [{ data: emp }, { data: ni }] = await Promise.all([
        supabase
          .from("employees")
          .select("numero, nombre, puesto, departamento, fecha_ingreso")
          .eq("numero", numero)
          .maybeSingle(),
        supabase
          .from("nuevo_ingreso")
          .select("numero, nombre, puesto, departamento, fecha_ingreso, tipo_contrato, eval_1_fecha, eval_1_calificacion, eval_2_fecha, eval_2_calificacion, eval_3_fecha, eval_3_calificacion")
          .eq("numero", numero)
          .maybeSingle(),
      ])

      let empleadoData: { numero: string; nombre: string; puesto: string; departamento: string | null; fechaIngreso: string | null } | null = null
      let origenEmpleado: OrigenEmpleado | null = null

      const empleadoResuelto = resolverOrigenEmpleado(
        emp as EmpleadoOrigenData | null,
        ni as NuevoIngresoOrigenData | null,
      )

      if (empleadoResuelto) {
        const registro = empleadoResuelto.registro
        origenEmpleado = empleadoResuelto.origen
        empleadoData = {
          numero: registro.numero,
          nombre: registro.nombre,
          puesto: registro.puesto || "",
          departamento: registro.departamento ?? null,
          fechaIngreso: registro.fecha_ingreso ?? null,
        }
      }

      if (!empleadoData || !origenEmpleado) throw new EvaluationMessageError("Empleado no encontrado", "Verifica el número o el nombre e inténtalo de nuevo.")

      // Trae TODAS las evaluaciones del empleado (más reciente primero) para
      // poder resolver el periodo correcto y cargar la fila de ESE periodo.
      const { data: evalsRaw, error: evalsError } = await supabase
        .from("evaluaciones_desempeno")
        .select("*")
        .eq("numero_empleado", numero)
        .order("created_at", { ascending: false })

      if (evalsError) throw evalsError
      const evals = (evalsRaw ?? []) as EvalRowFull[]
      // La modalidad y el periodo se asignan al buscar; no se elige un año anterior.
      const { modo, periodo: periodoResuelto, semestreActual: semestreActivo, requiereSemestral: requiereSemestralEmp } =
        periodoVigenteParaEmpleado(origenEmpleado, empleadoData.fechaIngreso)
      const hitoPendiente = origenEmpleado === "nuevo_ingreso" && ni
        ? hitoVigentePendiente(ni as SeguimientoNuevoIngreso, periodoResuelto)
        : null

      // Buscar solo detecta las evaluaciones guardadas; no carga el formulario para editarlas.
      const periodoNormalizado = normalizarPeriodoDesempeno(periodoResuelto)
      const evalData = hitoPendiente
        ? null
        : (evals.find((e) => e.periodo && normalizarPeriodoDesempeno(e.periodo) === periodoNormalizado) ?? null)
      if (evalData) {
        if (requestId !== searchRequest.current) return null
        lastEvalId.current = null
        lastEvalKey.current = null
        setExistingEvaluation({
          periodo: periodoResuelto,
          numero,
          nombre: empleadoData.nombre,
          calificacion: evalData.calificacion_final,
        })
        setFechaIngreso(empleadoData.fechaIngreso)
        setOrigen(origenEmpleado)
        setRequiereSemestral(requiereSemestralEmp)
        setSemestreObjetivo(semestreActivo)
        return { origen: origenEmpleado, modo, periodo: periodoResuelto, requiereSemestral: requiereSemestralEmp, semestreObjetivo: semestreActivo }
      }

      if (origenEmpleado === "nuevo_ingreso" && !hitoPendiente) {
        throw new EvaluationMessageError("Sin evaluación programada", "No hay una evaluación de nuevo ingreso pendiente para el periodo vigente.")
      }

      const { data: incidenciaData, error: incidenciaError } = await supabase
        .from("incidencias")
        .select("categoria, valor, notas, mes")
        .eq("numero_empleado", numero)
        .order("mes", { ascending: false })

      if (incidenciaError) throw incidenciaError

      const result = crearBorradorEvaluacion(
        empleadoData,
        periodoResuelto,
        incidenciaData ?? [],
        hitoPendiente?.numero,
      )

      if (requestId !== searchRequest.current) return null
      lastEvalId.current = null
      lastEvalKey.current = null
      setFechaIngreso(empleadoData.fechaIngreso)
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
      if (requestId !== searchRequest.current) return null
      setError(e instanceof EvaluationMessageError
        ? { title: e.title, description: e.message }
        : { title: "Búsqueda no disponible", description: "No se pudo buscar al empleado. Inténtalo de nuevo." })
      return null
    } finally {
      if (requestId === searchRequest.current) setLoading(false)
    }
  }, [])

  const clearEvaluation = useCallback(() => {
    ++searchRequest.current
    lastEvalId.current = null
    lastEvalKey.current = null
    setData(null)
    setExistingEvaluation(null)
    setSaveSuccess(false)
    setError(null)
    setLoading(false)
  }, [])

  const resetSaveSuccess = useCallback(() => setSaveSuccess(false), [])

  const guardar = useCallback(async (evalData: DesempenoData) => {
    if (savingRef.current) return false
    const validacion = validarEvaluacion(evalData)
    if (!validacion.valida) {
      notify.error(validacion.errores[0] ?? "Completa la evaluación antes de guardar")
      return false
    }
    savingRef.current = true
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
        hito_nuevo_ingreso: evalData.hito_nuevo_ingreso ?? null,
        objetivos: evalData.objetivos,
        cumplimiento_responsabilidades: evalData.cumplimiento_responsabilidades,
        competencias: evalData.competencias,
        compromisos: evalData.compromisos || null,
        fecha_revision: evalData.fecha_revision || null,
        observaciones: evalData.observaciones || null,
        calificacion_final: ponderacion.calificacionFinal,
      }

      const evalKey = `${evalData.numero_empleado}:${normalizarPeriodoDesempeno(evalData.periodo)}:${evalData.hito_nuevo_ingreso ?? ""}`
      if (isEvaluador && lastEvalId.current) {
        throw new EvaluationMessageError("Evaluación cerrada", "No puedes modificar una evaluación guardada.")
      }
      if (lastEvalId.current && lastEvalKey.current === evalKey) {
        const { error: err } = await supabase
          .from("evaluaciones_desempeno")
          .update(row)
          .eq("id", lastEvalId.current)
        if (err) throw err
      } else {
        if (!origen || normalizarPeriodoDesempeno(evalData.periodo) !== normalizarPeriodoDesempeno(periodoVigenteParaEmpleado(origen, fechaIngreso).periodo)) {
          throw new EvaluationMessageError("Periodo fuera de vigencia", "Busca de nuevo al empleado para evaluar el periodo vigente.")
        }
        if (origen === "nuevo_ingreso") {
          const { data: seguimiento, error: seguimientoError } = await supabase
            .from("nuevo_ingreso")
            .select("eval_1_fecha, eval_1_calificacion, eval_2_fecha, eval_2_calificacion, eval_3_fecha, eval_3_calificacion")
            .eq("numero", evalData.numero_empleado)
            .maybeSingle()
          if (seguimientoError) throw seguimientoError
          if (!seguimiento || hitoVigentePendiente(seguimiento, evalData.periodo)?.numero !== evalData.hito_nuevo_ingreso) {
            throw new EvaluationMessageError("Evaluación no disponible", "Esta evaluación ya se registró o su fecha programada cambió. Busca de nuevo al empleado.")
          }
        }
        const { data: existingRows, error: existingError } = await supabase
          .from("evaluaciones_desempeno")
          .select("periodo, hito_nuevo_ingreso")
          .eq("numero_empleado", evalData.numero_empleado)
        if (existingError) throw existingError
        if (existingRows?.some((row) => origen === "nuevo_ingreso"
          ? row.hito_nuevo_ingreso === evalData.hito_nuevo_ingreso
          : row.periodo && normalizarPeriodoDesempeno(row.periodo) === normalizarPeriodoDesempeno(evalData.periodo))) {
          throw new EvaluationMessageError("Evaluación ya guardada", "Ya existe una evaluación para esta fecha programada. Busca de nuevo al empleado.")
        }
        const { data: inserted, error: err } = await supabase
          .from("evaluaciones_desempeno")
          .insert(row)
          .select("id")
          .single()
        if (err) throw err
        lastEvalId.current = inserted.id
        lastEvalKey.current = evalKey
      }

      setData({ ...evalData, calificacion_final: ponderacion.calificacionFinal })
      setSaveSuccess(true)
      return true
      // notify.success ya no es necesario — el modal DesempenoSaveSuccess lo muestra
    } catch (e: unknown) {
      const msg = e instanceof EvaluationMessageError
        ? e.message
        : "No se pudo guardar la evaluación. Inténtalo de nuevo."
      console.error("[guardar]", e)
      notify.error(msg)
      return false
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [origen, fechaIngreso, isEvaluador])

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
        hito_nuevo_ingreso: 1 | 2 | 3 | null
        calificacion_final: number
        created_at: string
      }
      const PAGE = 1000
      const evals: EvalRow[] = []
      for (let from = 0; ; from += PAGE) {
        const { data: page, error: err } = await supabase
          .from("evaluaciones_desempeno")
          .select("id, numero_empleado, evaluador_nombre, tipo, periodo, hito_nuevo_ingreso, calificacion_final, created_at")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1)

        if (err) throw err
        if (!page || page.length === 0) break
        evals.push(...(page as EvalRow[]))
        if (page.length < PAGE) break
      }

      // Fetch employee names for each unique numero_empleado
      const numeros = [...new Set((evals ?? []).map((e) => e.numero_empleado))]
      const empleadoMap: Record<string, { nombre: string; puesto: string; origen: "planta" | "nuevo_ingreso" }> = {}

      if (numeros.length > 0) {
        const [{ data: emps }, { data: niEmps }] = await Promise.all([
          supabase
            .from("employees")
            .select("numero, nombre, puesto")
            .in("numero", numeros),
          supabase
            .from("nuevo_ingreso")
            .select("numero, nombre, puesto, tipo_contrato")
            .in("numero", numeros),
        ])
        const empleadosPorNumero = new Map(
          (emps ?? []).filter(e => e.numero).map(e => [e.numero!, e as EmpleadoOrigenData]),
        )
        const nuevosPorNumero = new Map(
          (niEmps ?? []).filter(e => e.numero).map(e => [e.numero!, e as NuevoIngresoOrigenData]),
        )

        for (const numero of numeros) {
          const resolved = resolverOrigenEmpleado(
            empleadosPorNumero.get(numero) ?? null,
            nuevosPorNumero.get(numero) ?? null,
          )
          if (resolved) {
            empleadoMap[numero] = {
              nombre: resolved.registro.nombre,
              puesto: resolved.registro.puesto || "",
              origen: resolved.origen,
            }
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
          hito_nuevo_ingreso: e.hito_nuevo_ingreso,
          calificacion_final: e.calificacion_final,
          created_at: e.created_at,
          origen: empleadoMap[e.numero_empleado]?.origen,
        }))
      )
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Error al cargar historial")
    } finally {
      setHistorialLoading(false)
    }
  }, [])

  const cargarEvaluacion = useCallback(async (evalId: string) => {
    if (isEvaluador) {
      setError({ title: "Evaluación cerrada", description: "No puedes modificar una evaluación guardada." })
      return null
    }
    const requestId = ++searchRequest.current
    setLoading(true)
    setError(null)
    setData(null)
    setExistingEvaluation(null)
    setSaveSuccess(false)
    try {
      const { data: evalRow, error: err } = await supabase
        .from("evaluaciones_desempeno")
        .select("*")
        .eq("id", evalId)
        .single()

      if (err || !evalRow) throw err ?? new EvaluationMessageError("Evaluación no encontrada", "Vuelve a buscar al empleado para abrir la evaluación.")

      // Find employee info
      let nombre = ""
      let puesto = ""
      let fechaIngresoEmp: string | null = null
      let origenEmpleado: OrigenEmpleado = "planta"
      
      const [{ data: emp }, { data: ni }] = await Promise.all([
        supabase
          .from("employees")
          .select("numero, nombre, puesto, fecha_ingreso")
          .eq("numero", evalRow.numero_empleado)
          .maybeSingle(),
        supabase
          .from("nuevo_ingreso")
          .select("numero, nombre, puesto, fecha_ingreso, tipo_contrato")
          .eq("numero", evalRow.numero_empleado)
          .maybeSingle(),
      ])
      const empleadoResuelto = resolverOrigenEmpleado(
        emp as EmpleadoOrigenData | null,
        ni as NuevoIngresoOrigenData | null,
      )
      if (empleadoResuelto) {
        nombre = empleadoResuelto.registro.nombre
        puesto = empleadoResuelto.registro.puesto || ""
        fechaIngresoEmp = empleadoResuelto.registro.fecha_ingreso ?? null
        origenEmpleado = empleadoResuelto.origen
      }

      // Fetch incidencias para recalcular asistencia si es necesario
      const { data: incidenciaData } = await supabase
        .from("incidencias")
        .select("categoria, valor, notas, mes")
        .eq("numero_empleado", evalRow.numero_empleado)
        .order("mes", { ascending: false })

      const result: DesempenoData = {
        numero_empleado: evalRow.numero_empleado,
        nombre,
        puesto,
        evaluador_nombre: evalRow.evaluador_nombre || "",
        evaluador_puesto: evalRow.evaluador_puesto || "",
        tipo: (evalRow.tipo as DesempenoData["tipo"]) || "operativo",
        periodo: evalRow.periodo || "",
        hito_nuevo_ingreso: evalRow.hito_nuevo_ingreso ?? null,
        objetivos: evalRow.objetivos?.length ? evalRow.objetivos : [],
        cumplimiento_responsabilidades: evalRow.cumplimiento_responsabilidades?.length
          ? (evalRow.cumplimiento_responsabilidades as CumplimientoItem[])
          : (DEFAULT_CUMPLIMIENTO_POR_TIPO[(evalRow.tipo as DesempenoData["tipo"]) || "operativo"] ?? DEFAULT_CUMPLIMIENTO).map((c) => ({ ...c })),
        competencias: evalRow.competencias?.length
          ? (evalRow.competencias as Competencia[]).map(item => ({ ...item, evaluada: item.evaluada ?? item.calificacion > 0 }))
          : (DEFAULT_COMPETENCIAS_POR_TIPO[(evalRow.tipo as DesempenoData["tipo"]) || "operativo"] ?? DEFAULT_COMPETENCIAS_POR_TIPO.operativo).map((c) => ({ ...c })),
        compromisos: evalRow.compromisos || "",
        fecha_revision: evalRow.fecha_revision || "",
        observaciones: evalRow.observaciones || "",
        calificacion_final: evalRow.calificacion_final || 0,
        incidencias: (incidenciaData ?? []).map((item: Record<string, unknown>) => ({
          categoria: (item.categoria as string) ?? "",
          valor: (item.valor as number) ?? null,
          notas: (item.notas as string) ?? null,
          mes: (item.mes as string) ?? null,
        })),
      }

      if (requestId !== searchRequest.current) return null
      lastEvalId.current = evalRow.id
      lastEvalKey.current = `${evalRow.numero_empleado}:${normalizarPeriodoDesempeno(evalRow.periodo || "")}:${evalRow.hito_nuevo_ingreso ?? ""}`
      setFechaIngreso(fechaIngresoEmp)
      setOrigen(origenEmpleado)
      setData(result)
      
      // Retornar información del periodo para que el componente pueda actualizar el selector
      const periodoStr = evalRow.periodo || ""
      return { periodo: periodoStr, origen: origenEmpleado }
    } catch (e) {
      if (requestId !== searchRequest.current) return null
      setError(e instanceof EvaluationMessageError
        ? { title: e.title, description: e.message }
        : { title: "Evaluación no disponible", description: "No se pudo abrir la evaluación. Inténtalo de nuevo." })
      return null
    } finally {
      if (requestId === searchRequest.current) setLoading(false)
    }
  }, [isEvaluador])

  const eliminarEvaluacion = useCallback(async (evalId: string) => {
    try {
      const { error: err } = await supabase
        .from("evaluaciones_desempeno")
        .delete()
        .eq("id", evalId)
      if (err) throw err

      if (lastEvalId.current === evalId) {
        lastEvalId.current = null
        lastEvalKey.current = null
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

    const incidencias = currentData.incidencias ?? []
    const asistenciaPorcentaje = calcularAsistenciaPorcentaje(incidencias, nuevoPeriodo)

    const tipoPuesto = getTipoDesempenoByPuesto(currentData.puesto)
    const cumplimiento = [...(currentData.cumplimiento_responsabilidades ?? [])]

    // Actualiza el porcentaje de asistencia (índice 2) solo para operativo/administrativo
    if (tipoPuesto !== "jefe" && cumplimiento[2]) {
      cumplimiento[2] = { ...cumplimiento[2], porcentaje: String(asistenciaPorcentaje) }
    }

    setData({ ...currentData, periodo: nuevoPeriodo, cumplimiento_responsabilidades: cumplimiento })
  }, [])

  return {
    data, setData, existingEvaluation, clearEvaluation, origen, requiereSemestral, semestreObjetivo, fechaIngreso, loading, saving, saveSuccess, resetSaveSuccess, error,
    buscarEmpleado, buscarSugerencias, guardar, recalcularAsistencia,
    historial, historialLoading, fetchHistorial,
    cargarEvaluacion, eliminarEvaluacion,
  }
}
