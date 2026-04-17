"use client"

import { useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { ReglaPromocionJSON, DatosPromocionJSON } from "@/lib/promociones/types"

interface CargaResult {
  ok: boolean
  msg: string
}

export function usePromocionesImport(onDatosActualizados?: () => void) {
  // ── Reglas ──
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reglasPreview, setReglasPreview] = useState<ReglaPromocionJSON[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [cargaResult, setCargaResult] = useState<CargaResult | null>(null)

  // ── Datos ──
  const datosFileInputRef = useRef<HTMLInputElement>(null)
  const [datosPreview, setDatosPreview] = useState<DatosPromocionJSON[] | null>(null)
  const [datosCargando, setDatosCargando] = useState(false)
  const [datosResult, setDatosResult] = useState<CargaResult | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result
        if (typeof raw !== "string") throw new Error("No se pudo leer el archivo")
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) throw new Error("El archivo debe ser un array JSON")
        setReglasPreview(parsed as ReglaPromocionJSON[])
        setCargaResult(null)
      } catch (err: unknown) {
        setCargaResult({ ok: false, msg: err instanceof Error ? err.message : "Error al leer el archivo" })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }, [])

  const handleDatosFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result
        if (typeof raw !== "string") throw new Error("No se pudo leer el archivo")
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) throw new Error("El archivo debe ser un array JSON")
        setDatosPreview(parsed as DatosPromocionJSON[])
        setDatosResult(null)
      } catch (err: unknown) {
        setDatosResult({ ok: false, msg: err instanceof Error ? err.message : "Error al leer el archivo" })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }, [])

  const handleCargarReglas = useCallback(async () => {
    if (!reglasPreview) return
    setCargando(true)
    setCargaResult(null)
    try {
      const rowsMap = new Map<string, object>()
      for (const r of reglasPreview) {
        const puesto = r["Puesto Actual"].trim()
        rowsMap.set(puesto, {
          puesto,
          promocion_a:                 r["Promoción a"]?.trim() ?? null,
          min_temporalidad_meses:      parseInt(r["Temporalidad (meses)"], 10),
          min_calificacion_examen:     parseFloat(r["Calificación Examen Teorico"]),
          min_porcentaje_cursos:       parseFloat(r["Cumplimiento Cursos Asigandos"]),
          min_calificacion_evaluacion: parseFloat(r["Calificación Evaluación Desempeño"]),
        })
      }
      const rows = Array.from(rowsMap.values())

      const { error } = await supabase
        .from("reglas_promocion")
        .upsert(rows, { onConflict: "puesto" })

      if (error) throw new Error(error.message)
      setCargaResult({ ok: true, msg: `${rows.length} regla${rows.length !== 1 ? "s" : ""} cargada${rows.length !== 1 ? "s" : ""} correctamente` })
      setReglasPreview(null)
      onDatosActualizados?.()
    } catch (err: unknown) {
      setCargaResult({ ok: false, msg: err instanceof Error ? err.message : "Error al guardar en Supabase" })
    } finally {
      setCargando(false)
    }
  }, [reglasPreview, onDatosActualizados])

  const handleCargarDatos = useCallback(async () => {
    if (!datosPreview) return
    setDatosCargando(true)
    setDatosResult(null)
    try {
      const rowsMap = new Map<string, object>()
      for (const r of datosPreview) {
        const numero = r["N.N"].trim()
        if (!numero) continue
        rowsMap.set(numero, {
          numero,
          fecha_inicio_puesto:        r["Fecha Inicio Puesto"] || null,
          desempeño_actual:           r["Desempeño Actual (%)"] !== "" ? parseFloat(r["Desempeño Actual (%)"]) : null,
          periodo_evaluacion:         r["Periodo de Evaluación"] || null,
          ultima_calificacion_examen: r["Última Calificación Examen (%)"] !== "" ? parseFloat(r["Última Calificación Examen (%)"]) : null,
          intentos_examen:            parseInt(r["Intentos de Examen"] || "0", 10),
          updated_at:                 new Date().toISOString(),
        })
      }
      const rows = Array.from(rowsMap.values())

      const { error } = await supabase
        .from("datos_promocion")
        .upsert(rows, { onConflict: "numero" })

      if (error) throw new Error(error.message)
      setDatosResult({ ok: true, msg: `${rows.length} empleado${rows.length !== 1 ? "s" : ""} cargado${rows.length !== 1 ? "s" : ""} correctamente` })
      setDatosPreview(null)
      onDatosActualizados?.()
    } catch (err: unknown) {
      setDatosResult({ ok: false, msg: err instanceof Error ? err.message : "Error al guardar en Supabase" })
    } finally {
      setDatosCargando(false)
    }
  }, [datosPreview, onDatosActualizados])

  return {
    // Reglas
    fileInputRef,
    reglasPreview,
    setReglasPreview,
    cargando,
    cargaResult,
    handleFileChange,
    handleCargarReglas,
    // Datos
    datosFileInputRef,
    datosPreview,
    setDatosPreview,
    datosCargando,
    datosResult,
    handleDatosFileChange,
    handleCargarDatos,
  }
}
