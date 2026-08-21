"use client"

import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { normalizeDepartamento } from "@/lib/catalogo"
import { esElegibleParaPeriodo } from "@/lib/desempeno/elegibilidad"
import { notify } from "@/lib/notify"

// ─── Types ──────────────────────────────────────────────────────────────────

export type SemestralEstado = "pendiente" | "completado" | "no_elegible"

export interface SemestralEmployee {
  dbId: string
  numero: string | null
  nombre: string
  puesto: string | null
  departamento: string | null
  fecha_ingreso: string | null
  estado: SemestralEstado
  /** Calificación final si el empleado ya fue evaluado en el periodo */
  calificacion: number | null
  /** Motivo de inelegibilidad (< 3 meses) si aplica */
  motivoNoElegible: string | null
}

export interface SemestralDeptGroup {
  departamento: string
  items: SemestralEmployee[]
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Avance de evaluaciones SEMESTRALES del personal de planta (`employees`),
 * acotado a los departamentos del evaluador.
 *
 * Para el `periodo` semestral indicado, cada empleado queda en uno de:
 *  - completado: ya existe `evaluaciones_desempeno` para ese periodo (muestra %).
 *  - no_elegible: < 3 meses de antigüedad al cierre del periodo.
 *  - pendiente: elegible y sin evaluación guardada.
 */
export function useSemestralPendientes(periodo: string, filterDepartamentos?: string[] | null) {
  const [loading, setLoading] = useState(true)
  const [deptGroups, setDeptGroups] = useState<SemestralDeptGroup[]>([])
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [totalPendientes, setTotalPendientes] = useState(0)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data: empData, error } = await supabase
        .from("employees")
        .select("id, numero, nombre, puesto, departamento, fecha_ingreso")
        .order("nombre")

      if (error) throw new Error(error.message)

      const empleados = (empData ?? []) as Array<{
        id: string
        numero: string | null
        nombre: string
        puesto: string | null
        departamento: string | null
        fecha_ingreso: string | null
      }>

      // Scope por departamento del evaluador
      const deptFiltro = filterDepartamentos && filterDepartamentos.length > 0
        ? filterDepartamentos.map(normalizeDepartamento)
        : null
      const scoped = deptFiltro
        ? empleados.filter((e) => deptFiltro.includes(normalizeDepartamento(e.departamento)))
        : empleados

      // Evaluaciones ya guardadas para este periodo
      const { data: evalData } = await supabase
        .from("evaluaciones_desempeno")
        .select("numero_empleado, calificacion_final")
        .eq("periodo", periodo)

      const evalMap = new Map<string, number>()
      for (const ev of (evalData ?? []) as Array<{ numero_empleado: string | null; calificacion_final: number | null }>) {
        if (ev.numero_empleado != null) {
          evalMap.set(String(ev.numero_empleado), ev.calificacion_final ?? 0)
        }
      }

      let pendientes = 0
      const items: SemestralEmployee[] = scoped.map((e) => {
        const eleg = esElegibleParaPeriodo(e.fecha_ingreso, periodo)
        const calificacion = e.numero != null ? evalMap.get(String(e.numero)) : undefined

        let estado: SemestralEstado
        if (calificacion != null) {
          estado = "completado"
        } else if (eleg.reglaAplica && !eleg.elegible) {
          estado = "no_elegible"
        } else {
          estado = "pendiente"
          pendientes++
        }

        return {
          dbId: e.id,
          numero: e.numero,
          nombre: e.nombre,
          puesto: e.puesto,
          departamento: e.departamento,
          fecha_ingreso: e.fecha_ingreso,
          estado,
          calificacion: calificacion ?? null,
          motivoNoElegible: estado === "no_elegible" ? eleg.motivo : null,
        }
      })

      // Agrupar por departamento
      const deptMap = new Map<string, SemestralEmployee[]>()
      for (const emp of items) {
        const key = emp.departamento ?? "Sin departamento"
        if (!deptMap.has(key)) deptMap.set(key, [])
        deptMap.get(key)!.push(emp)
      }

      const ESTADO_ORDEN: Record<SemestralEstado, number> = {
        pendiente: 0,
        completado: 1,
        no_elegible: 2,
      }

      const groups: SemestralDeptGroup[] = Array.from(deptMap.entries())
        .map(([departamento, grupo]) => ({
          departamento,
          items: grupo.sort((a, b) => {
            if (ESTADO_ORDEN[a.estado] !== ESTADO_ORDEN[b.estado]) {
              return ESTADO_ORDEN[a.estado] - ESTADO_ORDEN[b.estado]
            }
            return a.nombre.localeCompare(b.nombre, "es")
          }),
        }))
        .sort((a, b) => a.departamento.localeCompare(b.departamento, "es"))

      setDeptGroups(groups)
      setTotalEmployees(items.length)
      setTotalPendientes(pendientes)
    } catch (err) {
      console.error("useSemestralPendientes:", err)
      notify.error("No se pudieron cargar las evaluaciones semestrales")
    } finally {
      setLoading(false)
    }
  }, [periodo, filterDepartamentos])

  useEffect(() => { cargar() }, [cargar])

  return { loading, deptGroups, totalEmployees, totalPendientes, cargar }
}
