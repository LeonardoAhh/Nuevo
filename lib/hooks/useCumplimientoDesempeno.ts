"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import { esElegibleParaPeriodo } from "@/lib/desempeno/elegibilidad"

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
  pendientes: number
  porcentaje: number
}

export interface ResumenCumplimiento {
  total: number
  entregadas: number
  pendientes: number
  porcentaje: number
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

interface EvaluacionRow {
  id: string
  numero_empleado: string
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

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCumplimientoDesempeno(periodo: string) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deptGroups, setDeptGroups] = useState<DeptCumplimiento[]>([])
  const [resumen, setResumen] = useState<ResumenCumplimiento>({
    total: 0,
    entregadas: 0,
    pendientes: 0,
    porcentaje: 0,
  })

  const cargar = useCallback(async () => {
    if (!periodo) return
    setLoading(true)
    setError(null)
    try {
      const [empRes, evalRes, entregaRes] = await Promise.all([
        supabase
          .from("employees")
          .select("id, numero, nombre, puesto, departamento, area, fecha_ingreso"),
        supabase
          .from("evaluaciones_desempeno")
          .select("id, numero_empleado, calificacion_final")
          .eq("periodo", periodo),
        supabase
          .from("desempeno_entregas")
          .select("id, numero_empleado, entregada, fecha_entrega, notas, fisico_entregado")
          .eq("periodo", periodo),
      ])

      if (empRes.error) throw new Error("Error cargando empleados: " + empRes.error.message)
      if (evalRes.error) throw new Error("Error cargando evaluaciones: " + evalRes.error.message)
      if (entregaRes.error) throw new Error("Error cargando entregas: " + entregaRes.error.message)

      const empleados = (empRes.data ?? []) as EmployeeRow[]
      const evaluaciones = (evalRes.data ?? []) as EvaluacionRow[]
      const entregas = (entregaRes.data ?? []) as EntregaRow[]

      const evalMap = new Map<string, EvaluacionRow>()
      for (const e of evaluaciones) {
        if (!evalMap.has(e.numero_empleado)) evalMap.set(e.numero_empleado, e)
      }

      const entregaMap = new Map<string, EntregaRow>()
      for (const e of entregas) entregaMap.set(e.numero_empleado, e)

      const empleadosCumplimiento: EmpleadoCumplimiento[] = []
      for (const emp of empleados) {
        if (!emp.numero) continue
        const evalRow = evalMap.get(emp.numero)
        const entregaRow = entregaMap.get(emp.numero)

        // Antigüedad < 2 meses respecto al cierre del periodo → no aplica
        const elegibilidad = esElegibleParaPeriodo(emp.fecha_ingreso, periodo)

        let estatus: EstatusEntrega
        let motivoNoAplica: string | null = null
        if (elegibilidad.reglaAplica && !elegibilidad.elegible) {
          estatus = "no_aplica"
          motivoNoAplica = elegibilidad.motivo
        } else if (evalRow) {
          estatus = "auto"
        } else if (entregaRow?.entregada) {
          estatus = "manual"
        } else {
          estatus = "pendiente"
        }

        empleadosCumplimiento.push({
          id: emp.id,
          numero: emp.numero,
          nombre: emp.nombre,
          puesto: emp.puesto,
          departamento: emp.departamento,
          area: emp.area,
          fechaIngreso: emp.fecha_ingreso,
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
          const pendientes = total - entregadas
          const porcentaje = total === 0 ? 0 : Math.round((entregadas / total) * 100)
          return {
            departamento,
            empleados: items.sort(compareByNumero),
            total,
            entregadas,
            pendientes,
            porcentaje,
          }
        })
        .sort((a, b) => a.departamento.localeCompare(b.departamento, "es"))

      const elegiblesGlobal = empleadosCumplimiento.filter((e) => e.estatus !== "no_aplica")
      const totalGlobal = elegiblesGlobal.length
      const entregadasGlobal = elegiblesGlobal.filter(
        (e) => e.estatus === "auto" || e.estatus === "manual",
      ).length

      setDeptGroups(groups)
      setResumen({
        total: totalGlobal,
        entregadas: entregadasGlobal,
        pendientes: totalGlobal - entregadasGlobal,
        porcentaje: totalGlobal === 0 ? 0 : Math.round((entregadasGlobal / totalGlobal) * 100),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar cumplimiento"
      setError(msg)
      notify.error(msg)
    } finally {
      setLoading(false)
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
        await cargar()
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
        await cargar()
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
    loading,
    saving,
    error,
    deptGroups,
    resumen,
    cargar,
    marcarEntrega,
    marcarFisico,
  }
}
