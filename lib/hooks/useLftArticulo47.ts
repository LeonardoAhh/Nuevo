"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import {
  CODIGO_FALTA_INJUSTIFICADA,
  evaluarArt47,
  type LftEvaluacion,
} from "@/lib/lft/articulo47"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type LftOrigen = "planta" | "nuevo_ingreso"

export interface LftCandidato {
  numero: string
  nombre: string
  puesto: string | null
  departamento: string | null
  turno: string | null
  origen: LftOrigen
  evaluacion: LftEvaluacion
}

interface ReporteMin {
  mes: string
  data: unknown
}

interface EmpleadoMin {
  numero: string
  nombre: string
  puesto: string | null
  departamento: string | null
  turno: string | null
  origen: LftOrigen
}

interface DayRow {
  numero_empleado?: unknown
  days?: Record<string, unknown>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Detecta empleados (planta + nuevo ingreso) que califican bajo el supuesto
 * de la LFT Art. 47 Fracc. X: ≥ 4 faltas injustificadas en una ventana móvil
 * de 30 días naturales.
 *
 * Escanea TODO el histórico de `reportes_diarios` disponible.
 *
 * Algoritmo:
 *  1. Construir un Map<numero, fechas[]> recorriendo cada reporte mensual una
 *     sola vez (O(reportes × filas)).
 *  2. Para cada empleado conocido, evaluar la ventana móvil con `evaluarArt47`.
 *  3. Filtrar a los que aplican.
 */
export function useLftArticulo47() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [candidatos, setCandidatos] = useState<LftCandidato[]>([])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1) Reportes diarios (todo el histórico). Sólo cols indispensables.
      const { data: reportes, error: errRep } = await supabase
        .from("reportes_diarios")
        .select("mes, data")
        .order("mes", { ascending: true })
      if (errRep) throw new Error(errRep.message)

      // 2) Catálogos de empleados — planta y nuevo ingreso por separado para
      //    poder marcar el origen. El número de empleado es la clave.
      const [{ data: planta, error: errEmp }, { data: nuevos, error: errNI }] =
        await Promise.all([
          supabase
            .from("employees")
            .select("numero, nombre, puesto, departamento, turno"),
          supabase
            .from("nuevo_ingreso")
            .select("numero, nombre, puesto, departamento, turno"),
        ])
      if (errEmp) throw new Error(errEmp.message)
      if (errNI) throw new Error(errNI.message)

      // Indexamos por numero. Nuevo ingreso tiene prioridad para marcar origen
      // (un mismo numero podría existir en ambas tablas durante transición).
      const empleados = new Map<string, EmpleadoMin>()
      for (const e of (planta ?? []) as EmpleadoMin[]) {
        if (!e.numero) continue
        empleados.set(String(e.numero), { ...e, numero: String(e.numero), origen: "planta" })
      }
      for (const e of (nuevos ?? []) as EmpleadoMin[]) {
        if (!e.numero) continue
        empleados.set(String(e.numero), { ...e, numero: String(e.numero), origen: "nuevo_ingreso" })
      }

      // 3) Reconstruir fechas de faltas por empleado en una sola pasada.
      const fechasPorEmpleado = new Map<string, string[]>()
      for (const rep of (reportes ?? []) as ReporteMin[]) {
        const rows = Array.isArray(rep.data) ? (rep.data as DayRow[]) : []
        const [yearStr, monthStr] = rep.mes.split("-")
        for (const row of rows) {
          if (!row || typeof row !== "object") continue
          const numero = row.numero_empleado != null ? String(row.numero_empleado) : ""
          if (!numero || !row.days) continue
          for (const [diaKey, code] of Object.entries(row.days)) {
            if (code !== CODIGO_FALTA_INJUSTIFICADA) continue
            const dia = parseInt(diaKey, 10)
            if (!Number.isFinite(dia) || dia < 1 || dia > 31) continue
            const iso = `${yearStr}-${monthStr}-${String(dia).padStart(2, "0")}`
            const arr = fechasPorEmpleado.get(numero)
            if (arr) arr.push(iso)
            else fechasPorEmpleado.set(numero, [iso])
          }
        }
      }

      // 4) Evaluar cada empleado conocido contra Art. 47.
      const resultado: LftCandidato[] = []
      for (const [numero, emp] of empleados) {
        const fechas = fechasPorEmpleado.get(numero)
        if (!fechas || fechas.length === 0) continue
        const evalRes = evaluarArt47(fechas)
        if (!evalRes.aplica) continue
        resultado.push({
          numero,
          nombre: emp.nombre,
          puesto: emp.puesto,
          departamento: emp.departamento,
          turno: emp.turno,
          origen: emp.origen,
          evaluacion: evalRes,
        })
      }

      // 5) Ordenar por número de faltas total (descendente), luego nombre.
      resultado.sort((a, b) => {
        if (b.evaluacion.totalFaltas !== a.evaluacion.totalFaltas) {
          return b.evaluacion.totalFaltas - a.evaluacion.totalFaltas
        }
        return a.nombre.localeCompare(b.nombre, "es")
      })

      setCandidatos(resultado)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al detectar candidatos LFT")
      setCandidatos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { loading, error, candidatos, recargar: cargar }
}
