"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import { esElegibleParaPeriodo, esPeriodoSemestral } from "@/lib/desempeno/elegibilidad"
import { periodoVigenteParaEmpleado, type OrigenEmpleado } from "@/lib/desempeno/periodo-empleado"
import { normalizarPeriodoDesempeno } from "@/lib/catalogo"

// ─── Types ──────────────────────────────────────────────────────────────────

export type EstatusEntrega = "auto" | "manual" | "pendiente" | "no_aplica"

export interface EmpleadoCumplimiento {
  id: string
  numero: string
  nombre: string
  puesto: string | null
  departamento: string | null
  area: string | null
  fechaIngreso: string | null
  origen: OrigenEmpleado
  estatus: EstatusEntrega
  /** id de evaluaciones_desempeno si existe (auto) */
  evaluacionId: string | null
  /** id de desempeno_entregas si existe (manual o físico) */
  entregaId: string | null
  fechaEntrega: string | null
  notas: string | null
  calificacionFinal: number | null
  /** Motivo de no elegibilidad cuando estatus = "no_aplica". */
  motivoNoAplica: string | null
  /** Indica que el formato impreso fue recibido físicamente. */
  fisicoEntregado: boolean
}

export interface DeptCumplimiento {
  departamento: string
  empleados: EmpleadoCumplimiento[]
  total: number
  entregadas: number
  fisicos: number
  porcentajeEntregadas: number
}

export interface ResumenCumplimiento {
  total: number
  entregadas: number
  porcentaje: number
  fisicos: number
  porcentajeEntregadas: number
}

const EMPTY_RESUMEN: ResumenCumplimiento = {
  total: 0,
  entregadas: 0,
  porcentaje: 0,
  fisicos: 0,
  porcentajeEntregadas: 0,
}

interface EmployeeRow {
  id: string
  numero: string | null
  nombre: string
  puesto: string | null
  departamento: string | null
  area: string | null
  fecha_ingreso: string | null
}

interface NuevoIngresoRow extends EmployeeRow {
  tipo_contrato: string | null
}

interface EvaluacionRow {
  id: string
  numero_empleado: string
  periodo: string
  calificacion_final: number | null
}

interface EntregaRow {
  id: string
  numero_empleado: string
  entregada: boolean
  fecha_entrega: string | null
  notas: string | null
  fisico_entregado: boolean
}

/** Incluye periodos heredados con espacios distintos y evita el límite de una página de Supabase. */
async function cargarEvaluacionesDelPeriodo(periodo: string): Promise<EvaluacionRow[]> {
  const year = periodo.match(/\d{4}$/)?.[0]
  if (!year) return []
  const rows: EvaluacionRow[] = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("evaluaciones_desempeno")
      .select("id, numero_empleado, periodo, calificacion_final")
      .ilike("periodo", `%${year}`)
      .order("id")
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...((data ?? []) as EvaluacionRow[]))
    if ((data?.length ?? 0) < pageSize) break
  }
  const target = normalizarPeriodoDesempeno(periodo)
  return rows.filter((row) => row.periodo && normalizarPeriodoDesempeno(row.periodo) === target)
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCumplimientoDesempeno(periodo: string) {
  const activePeriod = useRef(periodo)
  activePeriod.current = periodo
  const requestId = useRef(0)
  const [loading, setLoading] = useState(true)
  const [loadedPeriod, setLoadedPeriod] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deptGroups, setDeptGroups] = useState<DeptCumplimiento[]>([])
  const [resumen, setResumen] = useState<ResumenCumplimiento>(EMPTY_RESUMEN)

  const cargar = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (!periodo) return
    const currentRequest = ++requestId.current
    if (!background) setLoading(true)
    setError(null)
    try {
      const [empRes, nuevoRes, evaluaciones, entregaRes] = await Promise.all([
        supabase
          .from("employees")
          .select("id, numero, nombre, puesto, departamento, area, fecha_ingreso"),
        supabase
          .from("nuevo_ingreso")
          .select("id, numero, nombre, puesto, departamento, area, fecha_ingreso, tipo_contrato"),
        cargarEvaluacionesDelPeriodo(periodo),
        supabase
          .from("desempeno_entregas")
          .select("id, numero_empleado, entregada, fecha_entrega, notas, fisico_entregado")
          .eq("periodo", periodo),
      ])

      if (empRes.error) throw new Error("Error cargando empleados: " + empRes.error.message)
      if (nuevoRes.error) throw new Error("Error cargando nuevos ingresos: " + nuevoRes.error.message)
      if (entregaRes.error) throw new Error("Error cargando entregas: " + entregaRes.error.message)

      const empleados = (empRes.data ?? []) as EmployeeRow[]
      const nuevosIngresos = (nuevoRes.data ?? []) as NuevoIngresoRow[]
      const entregas = (entregaRes.data ?? []) as EntregaRow[]

      const evalMap = new Map<string, EvaluacionRow>()
      for (const e of evaluaciones) {
        if (!evalMap.has(e.numero_empleado)) evalMap.set(e.numero_empleado, e)
      }

      const entregaMap = new Map<string, EntregaRow>()
      for (const e of entregas) entregaMap.set(e.numero_empleado, e)

      // Un contrato de prueba activo prevalece sobre la copia del mismo número
      // en employees, igual que en la búsqueda de Evaluar.
      const personas = new Map<string, { registro: EmployeeRow; origen: OrigenEmpleado }>()
      for (const emp of empleados) {
        if (emp.numero) personas.set(emp.numero, { registro: emp, origen: "planta" })
      }
      for (const nuevo of nuevosIngresos) {
        if (!nuevo.numero) continue
        if (nuevo.tipo_contrato !== "Indeterminado") {
          personas.set(nuevo.numero, { registro: nuevo, origen: "nuevo_ingreso" })
        } else if (!personas.has(nuevo.numero)) {
          personas.set(nuevo.numero, { registro: nuevo, origen: "planta" })
        }
      }

      const esSemestral = esPeriodoSemestral(periodo)
      const empleadosCumplimiento: EmpleadoCumplimiento[] = []
      for (const { registro: emp, origen } of personas.values()) {
        const numero = emp.numero!
        const asignacion = periodoVigenteParaEmpleado(origen, emp.fecha_ingreso)
        // El semestre muestra también a los no elegibles como «No aplica».
        // El mensual sólo incluye a quienes Evaluar asignaría a ese modo.
        if (esSemestral ? origen !== "planta" : asignacion.modo !== "mensuales") continue
        const evalRow = evalMap.get(numero)
        const entregaRow = entregaMap.get(numero)

        // La evaluación guardada siempre prevalece sobre la elegibilidad actual.
        const elegibilidad = esElegibleParaPeriodo(emp.fecha_ingreso, periodo)

        let estatus: EstatusEntrega
        let motivoNoAplica: string | null = null
        if (evalRow) {
          estatus = "auto"
        } else if (elegibilidad.reglaAplica && !elegibilidad.elegible) {
          estatus = "no_aplica"
          motivoNoAplica = elegibilidad.motivo
        } else if (entregaRow?.entregada) {
          estatus = "manual"
        } else {
          estatus = "pendiente"
        }

        empleadosCumplimiento.push({
          id: emp.id,
          numero,
          nombre: emp.nombre,
          puesto: emp.puesto,
          departamento: emp.departamento,
          area: emp.area,
          fechaIngreso: emp.fecha_ingreso,
          origen,
          estatus,
          evaluacionId: evalRow?.id ?? null,
          entregaId: entregaRow?.id ?? null,
          fechaEntrega: entregaRow?.fecha_entrega ?? null,
          notas: entregaRow?.notas ?? null,
          calificacionFinal: evalRow?.calificacion_final ?? null,
          motivoNoAplica,
          fisicoEntregado: entregaRow?.fisico_entregado ?? false,
        })
      }

      // Group by departamento
      const deptMap = new Map<string, EmpleadoCumplimiento[]>()
      for (const emp of empleadosCumplimiento) {
        const key = emp.departamento ?? "Sin departamento"
        if (!deptMap.has(key)) deptMap.set(key, [])
        deptMap.get(key)!.push(emp)
      }

      // Sort por número de empleado ascendente. Si el numero es parseable
      // a int lo usamos; si no, fallback a comparación alfanumérica natural.
      const compareByNumero = (a: EmpleadoCumplimiento, b: EmpleadoCumplimiento) => {
        const na = parseInt(a.numero, 10)
        const nb = parseInt(b.numero, 10)
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
        return a.numero.localeCompare(b.numero, "es", { numeric: true })
      }

      const groups: DeptCumplimiento[] = Array.from(deptMap.entries())
        .map(([departamento, items]) => {
          // Empleados "no_aplica" se muestran pero NO cuentan en KPIs.
          const elegibles = items.filter((i) => i.estatus !== "no_aplica")
          const total = elegibles.length
          const entregadas = elegibles.filter(
            (i) => i.estatus === "auto" || i.estatus === "manual",
          ).length
          const fisicos = elegibles.filter((i) => i.fisicoEntregado).length
          const porcentajeEntregadas = total === 0 ? 0 : Math.round((entregadas / total) * 100)
          return {
            departamento,
            empleados: items.sort(compareByNumero),
            total,
            entregadas,
            fisicos,
            porcentajeEntregadas,
          }
        })
        .sort((a, b) => a.departamento.localeCompare(b.departamento, "es"))

      const elegiblesGlobal = empleadosCumplimiento.filter((e) => e.estatus !== "no_aplica")
      const totalGlobal = elegiblesGlobal.length
      const entregadasGlobal = elegiblesGlobal.filter(
        (e) => e.estatus === "auto" || e.estatus === "manual",
      ).length
      const fisicosGlobal = elegiblesGlobal.filter((e) => e.fisicoEntregado).length

      if (currentRequest !== requestId.current || activePeriod.current !== periodo) return
      setDeptGroups(groups)
      setResumen({
        total: totalGlobal,
        entregadas: entregadasGlobal,
        porcentaje: totalGlobal === 0 ? 0 : Math.round((fisicosGlobal / totalGlobal) * 100),
        fisicos: fisicosGlobal,
        porcentajeEntregadas: totalGlobal === 0 ? 0 : Math.round((entregadasGlobal / totalGlobal) * 100),
      })
      setLoadedPeriod(periodo)
    } catch (e) {
      if (currentRequest !== requestId.current || activePeriod.current !== periodo) return
      const msg = e instanceof Error ? e.message : "Error al cargar cumplimiento"
      setError(msg)
      if (!background) {
        setDeptGroups([])
        setResumen(EMPTY_RESUMEN)
        setLoadedPeriod(periodo)
      }
      notify.error(msg)
    } finally {
      if (!background && currentRequest === requestId.current && activePeriod.current === periodo) setLoading(false)
    }
  }, [periodo])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const marcarEntrega = useCallback(
    async (
      numero: string,
      entregada: boolean,
      opts?: { fechaEntrega?: string | null; notas?: string | null; fechaIngreso?: string | null },
    ) => {
      if (!periodo) return

      // Defensa client-side: rechazar marcado de empleados no elegibles.
      // (RLS en DB es la defensa final, pero esto evita el round-trip.)
      const elegibilidad = esElegibleParaPeriodo(opts?.fechaIngreso ?? null, periodo)
      if (elegibilidad.reglaAplica && !elegibilidad.elegible) {
        notify.error(elegibilidad.motivo)
        return
      }

      setSaving(true)
      try {
        const payload = {
          numero_empleado: numero,
          periodo,
          entregada,
          fecha_entrega: opts?.fechaEntrega ?? (entregada ? new Date().toISOString().slice(0, 10) : null),
          notas: opts?.notas ?? null,
        }

        const { error: upErr } = await supabase
          .from("desempeno_entregas")
          .upsert(payload, { onConflict: "numero_empleado,periodo" })

        if (upErr) throw upErr

        notify.success(entregada ? "Marcada como entregada" : "Marca de entrega quitada")
        await cargar({ background: true })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al actualizar entrega"
        notify.error(msg)
      } finally {
        setSaving(false)
      }
    },
    [periodo, cargar],
  )

  const marcarFisico = useCallback(
    async (numero: string, fisico: boolean) => {
      if (!periodo) return
      setSaving(true)
      try {
        const { error: upErr } = await supabase
          .from("desempeno_entregas")
          .upsert(
            { numero_empleado: numero, periodo, fisico_entregado: fisico },
            { onConflict: "numero_empleado,periodo" },
          )
        if (upErr) throw upErr
        notify.success(fisico ? "Físico marcado como entregado" : "Marca de físico quitada")
        await cargar({ background: true })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al actualizar entrega física"
        notify.error(msg)
      } finally {
        setSaving(false)
      }
    },
    [periodo, cargar],
  )

  return {
    loading: loading || loadedPeriod !== periodo,
    saving,
    error: loadedPeriod === periodo ? error : null,
    deptGroups: loadedPeriod === periodo ? deptGroups : [],
    resumen: loadedPeriod === periodo ? resumen : EMPTY_RESUMEN,
    cargar,
    marcarEntrega,
    marcarFisico,
  }
}
