"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

export interface CumpleanosEntry {
  id: string
  tabla: "employees" | "nuevo_ingreso"
  numero: string | null
  nombre: string
  departamento: string | null
  area: string | null
  email: string | null
  fecha_nacimiento: string
  edad: number
  diasParaCumpleanios: number
  fechaCumpleanios: string
  yaEnviado: boolean
}

export interface CumpleanosData {
  hoy: CumpleanosEntry[]
  estaSemana: CumpleanosEntry[]
  esteMes: CumpleanosEntry[]
  proximamente: CumpleanosEntry[]
  todos: CumpleanosEntry[]
}

const EMPTY: CumpleanosData = { hoy: [], estaSemana: [], esteMes: [], proximamente: [], todos: [] }

function proximoCumple(
  fechaNacimiento: string,
  hoy: Date,
): { fechaCumpleanios: string; diasParaCumpleanios: number; edad: number } {
  const [birthY, birthM, birthD] = fechaNacimiento.split("-").map(Number)
  const anoActual = hoy.getFullYear()
  const edad = anoActual - birthY

  let cumpleEsteAno = new Date(anoActual, birthM - 1, birthD)
  const hoyMedianoche = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  let diasRestantes = Math.round((cumpleEsteAno.getTime() - hoyMedianoche.getTime()) / 86400000)

  if (diasRestantes < 0) {
    cumpleEsteAno = new Date(anoActual + 1, birthM - 1, birthD)
    diasRestantes = Math.round((cumpleEsteAno.getTime() - hoyMedianoche.getTime()) / 86400000)
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const fechaISO = `${cumpleEsteAno.getFullYear()}-${pad(cumpleEsteAno.getMonth() + 1)}-${pad(cumpleEsteAno.getDate())}`

  return { fechaCumpleanios: fechaISO, diasParaCumpleanios: diasRestantes, edad }
}

export function useCumpleanos(dias = 90) {
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [data, setData]     = useState<CumpleanosData>(EMPTY)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: planta, error: errP }, { data: nuevos, error: errN }] = await Promise.all([
        supabase.from("employees").select("id, numero, nombre, departamento, area, email, fecha_nacimiento, cumple_enviado_year").not("fecha_nacimiento", "is", null),
        supabase.from("nuevo_ingreso").select("id, numero, nombre, departamento, area, email, fecha_nacimiento, cumple_enviado_year, tipo_contrato").not("fecha_nacimiento", "is", null),
      ])

      if (errP) throw new Error(errP.message)
      if (errN) throw new Error(errN.message)

      const hoy = new Date()
      const anoActual = hoy.getFullYear()
      const mapa = new Map<string, any>()
      const sinNumero: any[] = []

      for (const e of (planta ?? [])) {
        const reg = { ...e, tabla: "employees" }
        if (!reg.numero) sinNumero.push(reg)
        else mapa.set(reg.numero, reg)
      }

      for (const e of (nuevos ?? [])) {
        const reg = { ...e, tabla: "nuevo_ingreso" }
        if (!reg.numero) { sinNumero.push(reg); continue }
        
        const existente = mapa.get(reg.numero)
        if (!existente) {
          mapa.set(reg.numero, reg)
          continue
        }
        if (reg.tipo_contrato !== "Indeterminado") {
          if (!reg.email && existente.email) reg.email = existente.email
          if (!reg.fecha_nacimiento && existente.fecha_nacimiento) reg.fecha_nacimiento = existente.fecha_nacimiento
          mapa.set(reg.numero, reg)
        } else {
          if (!existente.email && reg.email) existente.email = reg.email
        }
      }

      const todosRaw = [...mapa.values(), ...sinNumero]
      const resultado: CumpleanosEntry[] = []

      for (const r of todosRaw) {
        if (!r.fecha_nacimiento) continue
        const { fechaCumpleanios, diasParaCumpleanios, edad } = proximoCumple(r.fecha_nacimiento, hoy)
        if (diasParaCumpleanios < 0 || diasParaCumpleanios > dias) continue

        resultado.push({
          id: r.id,
          tabla: r.tabla,
          numero: r.numero,
          nombre: r.nombre,
          departamento: r.departamento,
          area: r.area,
          email: r.email,
          fecha_nacimiento: r.fecha_nacimiento,
          edad,
          diasParaCumpleanios,
          fechaCumpleanios,
          yaEnviado: r.cumple_enviado_year === anoActual,
        })
      }

      resultado.sort((a, b) => a.diasParaCumpleanios - b.diasParaCumpleanios)

      setData({
        hoy:          resultado.filter((e) => e.diasParaCumpleanios === 0),
        estaSemana:   resultado.filter((e) => e.diasParaCumpleanios >= 1  && e.diasParaCumpleanios <= 7),
        esteMes:      resultado.filter((e) => e.diasParaCumpleanios >= 8  && e.diasParaCumpleanios <= 30),
        proximamente: resultado.filter((e) => e.diasParaCumpleanios >= 31 && e.diasParaCumpleanios <= 90),
        todos:        resultado,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cumpleaños")
      setData(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [dias])

  useEffect(() => { cargar() }, [cargar])

  return { loading, error, ...data, recargar: cargar }
}
