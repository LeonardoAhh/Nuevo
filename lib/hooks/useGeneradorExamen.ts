"use client"

import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import type { PreguntaExamen } from "./useExamenes"

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface EmpleadoBusqueda {
  id: string
  numero: string | null
  nombre: string
  puesto: string | null
  departamento: string | null
  area: string | null
  turno: string | null
}

export type Categoria = "A" | "B" | "C" | "D"

export interface TransicionExamen {
  categoriaActual: Categoria
  categoriaDestino: Categoria
  numPreguntas: number
  etiqueta: string
}

export interface ExamenGenerado {
  empleado: EmpleadoBusqueda
  transicion: TransicionExamen
  preguntas: PreguntaExamen[]
  fecha: string
}

export interface ReglaExamen {
  id: string
  departamento: string
  transicion: TransicionKey
  num_preguntas: number
  activo: boolean
}

export type TransicionKey = "D_C" | "C_B" | "B_A"

// ─────────────────────────────────────────────────────────────────────────────
// Constantes (no cambian)
// ─────────────────────────────────────────────────────────────────────────────

export const TRANSICION_ORDEN: TransicionKey[] = ["D_C", "C_B", "B_A"]
export const TRANSICION_LABEL: Record<TransicionKey, string> = {
  D_C: "D → C",
  C_B: "C → B",
  B_A: "B → A",
}
export const TRANSICION_CAT: Record<TransicionKey, { actual: Categoria; destino: Categoria }> = {
  D_C: { actual: "D", destino: "C" },
  C_B: { actual: "C", destino: "B" },
  B_A: { actual: "B", destino: "A" },
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

/** Extrae la categoría (A/B/C/D) del puesto, buscando la última letra al final del string */
export function extraerCategoria(puesto: string | null): Categoria | null {
  if (!puesto) return null
  const match = puesto.trim().match(/\s([ABCD])$/)
  return match ? (match[1] as Categoria) : null
}

/** Baraja un array de forma aleatoria (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Dado un mapa de reglas cargadas, devuelve las transiciones para un departamento */
export function transicionesDesde(
  reglas: ReglaExamen[],
  departamento: string | null
): TransicionExamen[] {
  const dep = (departamento ?? "").toUpperCase().trim()
  const filtered = reglas.filter(
    (r) => r.activo && r.departamento.toUpperCase().trim() === dep
  )
  return TRANSICION_ORDEN.filter((key) => filtered.some((r) => r.transicion === key)).map(
    (key) => {
      const regla = filtered.find((r) => r.transicion === key)!
      return {
        categoriaActual: TRANSICION_CAT[key].actual,
        categoriaDestino: TRANSICION_CAT[key].destino,
        numPreguntas: regla.num_preguntas,
        etiqueta: TRANSICION_LABEL[key],
      }
    }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────

export function useGeneradorExamen() {
  const [reglas, setReglas] = useState<ReglaExamen[]>([])
  const [resultados, setResultados] = useState<EmpleadoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [examen, setExamen] = useState<ExamenGenerado | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cargar reglas al montar
  useEffect(() => {
    supabase
      .from("reglas_examen")
      .select("*")
      .order("departamento")
      .order("transicion")
      .then(({ data }) => setReglas((data as ReglaExamen[]) ?? []))
  }, [])

  const buscarEmpleado = useCallback(async (term: string) => {
    if (!term.trim()) { setResultados([]); return }
    setBuscando(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from("employees")
        .select("id, numero, nombre, puesto, departamento, area, turno")
        .or(`nombre.ilike.%${term}%,numero.ilike.%${term}%`)
        .order("nombre")
        .limit(15)
      if (err) throw err
      setResultados(data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al buscar empleados")
    } finally {
      setBuscando(false)
    }
  }, [])

  const generarExamen = useCallback(
    async (empleado: EmpleadoBusqueda, transicionKey: TransicionKey) => {
      setGenerando(true)
      setError(null)
      try {
        // Obtener número de preguntas desde las reglas cargadas
        const dep = (empleado.departamento ?? "").toUpperCase().trim()
        const regla = reglas.find(
          (r) => r.departamento.toUpperCase().trim() === dep && r.transicion === transicionKey
        )
        const numPreguntas = regla?.num_preguntas ?? 20

        const depOriginal = (empleado.departamento ?? "").trim()
        const { data, error: err } = await supabase
          .from("preguntas_examen")
          .select("*")
          .ilike("departamento", `%${depOriginal}%`)
        if (err) throw err

        const todas = data ?? []
        if (todas.length === 0) {
          setError(`No hay preguntas cargadas para el departamento ${empleado.departamento ?? "desconocido"}.`)
          notify.warning(`Sin preguntas para ${empleado.departamento ?? "este departamento"}`)
          return
        }

        // Deduplicar preguntas por texto (evita repetidas en la BD)
        const unicas = Array.from(
          new Map(todas.map((p) => [p.pregunta.trim().toLowerCase(), p])).values()
        )
        const seleccionadas = shuffle(unicas).slice(0, numPreguntas)
        const { actual, destino } = TRANSICION_CAT[transicionKey]

        setExamen({
          empleado,
          transicion: {
            categoriaActual: actual,
            categoriaDestino: destino,
            numPreguntas: seleccionadas.length,
            etiqueta: TRANSICION_LABEL[transicionKey],
          },
          preguntas: seleccionadas,
          fecha: new Date().toISOString().split("T")[0],
        })
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al generar el examen")
        notify.error("Error al generar examen")
      } finally {
        setGenerando(false)
      }
    },
    [reglas]
  )

  const limpiarExamen = useCallback(() => setExamen(null), [])

  return {
    reglas,
    resultados,
    buscando,
    generando,
    examen,
    error,
    buscarEmpleado,
    generarExamen,
    limpiarExamen,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook para gestionar reglas (CRUD en UI de administración)
// ─────────────────────────────────────────────────────────────────────────────

export function useReglasCRUD() {
  const [reglas, setReglas] = useState<ReglaExamen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from("reglas_examen")
        .select("*")
        .order("departamento")
        .order("transicion")
      if (err) throw err
      setReglas((data as ReglaExamen[]) ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar reglas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = useCallback(
    async (departamento: string, transicion: TransicionKey, num_preguntas: number) => {
      const { data, error: err } = await supabase
        .from("reglas_examen")
        .upsert({ departamento, transicion, num_preguntas, activo: true }, { onConflict: "departamento,transicion" })
        .select()
        .single()
      if (err) throw err
      setReglas((prev) => {
        const idx = prev.findIndex((r) => r.departamento === departamento && r.transicion === transicion)
        if (idx >= 0) { const updated = [...prev]; updated[idx] = data as ReglaExamen; return updated }
        return [...prev, data as ReglaExamen].sort((a, b) => a.departamento.localeCompare(b.departamento))
      })
    },
    []
  )

  const toggleActivo = useCallback(async (id: string, activo: boolean) => {
    const { error: err } = await supabase.from("reglas_examen").update({ activo }).eq("id", id)
    if (err) throw err
    setReglas((prev) => prev.map((r) => (r.id === id ? { ...r, activo } : r)))
  }, [])

  return { reglas, loading, error, guardar, toggleActivo, recargar: cargar }
}

