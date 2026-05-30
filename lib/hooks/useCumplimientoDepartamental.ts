"use client"

import { useState, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import { CATALOGO_ORGANIZACIONAL } from "@/lib/catalogo"

export interface EntregaDepartamento {
  id: string | null
  departamento: string
  periodo: string
  entregado: boolean
  fecha_entrega: string | null
  marcado_por: string | null
  notas: string | null
}

const DEPARTAMENTOS = Object.keys(CATALOGO_ORGANIZACIONAL)

function buildPeriodos(): string[] {
  const now = new Date()
  const year = now.getFullYear()
  return [
    `ENE-JUN ${year}`,
    `JUL-DIC ${year}`,
    `ENE-JUN ${year + 1}`,
    `JUL-DIC ${year + 1}`,
  ]
}

export function useCumplimientoDepartamental() {
  const [entregas, setEntregas] = useState<EntregaDepartamento[]>([])
  const [loading, setLoading] = useState(false)
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    return month <= 6 ? `ENE-JUN ${year}` : `JUL-DIC ${year}`
  })
  const periodos = buildPeriodos()

  const fetchEntregas = useCallback(async (per: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("departamento_evaluacion_entrega")
        .select("*")
        .eq("periodo", per)

      if (error) throw error

      const map = new Map((data ?? []).map((r) => [r.departamento, r]))

      const merged: EntregaDepartamento[] = DEPARTAMENTOS.map((depto) => {
        const row = map.get(depto)
        return {
          id: row?.id ?? null,
          departamento: depto,
          periodo: per,
          entregado: row?.entregado ?? false,
          fecha_entrega: row?.fecha_entrega ?? null,
          marcado_por: row?.marcado_por ?? null,
          notas: row?.notas ?? null,
        }
      })

      setEntregas(merged)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Error al cargar entregas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntregas(periodo)
  }, [periodo, fetchEntregas])

  const toggleEntrega = useCallback(
    async (departamento: string, entregado: boolean, userEmail: string) => {
      try {
        const now = new Date().toISOString()

        const existing = entregas.find((e) => e.departamento === departamento)

        if (existing?.id) {
          const { error } = await supabase
            .from("departamento_evaluacion_entrega")
            .update({
              entregado,
              fecha_entrega: entregado ? now : null,
              marcado_por: entregado ? userEmail : null,
              updated_at: now,
            })
            .eq("id", existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from("departamento_evaluacion_entrega")
            .insert({
              departamento,
              periodo,
              entregado,
              fecha_entrega: entregado ? now : null,
              marcado_por: entregado ? userEmail : null,
            })
          if (error) throw error
        }

        setEntregas((prev) =>
          prev.map((e) =>
            e.departamento === departamento
              ? {
                  ...e,
                  entregado,
                  fecha_entrega: entregado ? now : null,
                  marcado_por: entregado ? userEmail : null,
                }
              : e
          )
        )

        notify.success(
          entregado
            ? `${departamento} marcado como entregado`
            : `${departamento} marcado como pendiente`
        )
      } catch (e) {
        notify.error(e instanceof Error ? e.message : "Error al actualizar")
      }
    },
    [entregas, periodo]
  )

  const stats = {
    total: entregas.length,
    entregados: entregas.filter((e) => e.entregado).length,
    pendientes: entregas.filter((e) => !e.entregado).length,
    porcentaje: entregas.length > 0
      ? Math.round((entregas.filter((e) => e.entregado).length / entregas.length) * 100)
      : 0,
  }

  return {
    entregas,
    loading,
    periodo,
    setPeriodo,
    periodos,
    toggleEntrega,
    stats,
    refetch: () => fetchEntregas(periodo),
  }
}
