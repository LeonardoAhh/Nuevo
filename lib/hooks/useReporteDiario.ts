"use client"

import { useCallback, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"
import { describeSupabaseError } from "@/lib/supabase/errors"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReporteDiarioRecord {
    id: string
    mes: string
    data: unknown[]
    total_empleados: number
    total_incidencias: number
    tasa_asistencia: number
    uploaded_by: string | null
    created_at: string
    updated_at: string
}

export interface ReporteDiarioSummary {
    id: string
    mes: string
    total_empleados: number
    total_incidencias: number
    tasa_asistencia: number
    created_at: string
}

export interface ReporteDiarioInsert {
    mes: string
    data: unknown[]
    total_empleados: number
    total_incidencias: number
    tasa_asistencia: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useReporteDiario() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /** Fetch all saved report summaries (without full data) for listing/comparison */
    const fetchSummaries = useCallback(async (): Promise<ReporteDiarioSummary[]> => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select("id, mes, total_empleados, total_incidencias, tasa_asistencia, created_at")
                .order("mes", { ascending: false })
            if (error) throw new Error(error.message)
            return (data ?? []) as ReporteDiarioSummary[]
        } catch (err) {
            const msg = describeSupabaseError(err, "Error al cargar reportes")
            setError(msg)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    /** Fetch full report data for a specific month */
    const fetchByMes = useCallback(async (mes: string): Promise<ReporteDiarioRecord | null> => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select("*")
                .eq("mes", mes)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return data as ReporteDiarioRecord | null
        } catch (err) {
            const msg = describeSupabaseError(err, "Error al cargar reporte")
            setError(msg)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    /** Save (upsert) a report for a given month */
    const saveReport = useCallback(async (
        report: ReporteDiarioInsert,
    ): Promise<{ success: boolean; error?: string }> => {
        setSaving(true)
        setError(null)
        try {
            const { error } = await supabase
                .from("reportes_diarios")
                .upsert(
                    {
                        ...report,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "mes", ignoreDuplicates: false },
                )
            if (error) throw error
            notify.success(`Reporte de ${report.mes} guardado`)
            return { success: true }
        } catch (err) {
            const msg = describeSupabaseError(err, "Error al guardar reporte")
            setError(msg)
            notify.error(msg)
            return { success: false, error: msg }
        } finally {
            setSaving(false)
        }
    }, [])

    /** Delete a saved report */
    const deleteReport = useCallback(async (id: string): Promise<{ success: boolean }> => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from("reportes_diarios")
                .delete()
                .eq("id", id)
            if (error) throw error
            notify.success("Reporte eliminado")
            return { success: true }
        } catch (err) {
            const msg = describeSupabaseError(err, "Error al eliminar reporte")
            notify.error(msg)
            return { success: false }
        } finally {
            setSaving(false)
        }
    }, [])

    /** Fetch summaries for a range of months (for comparison) */
    const fetchComparison = useCallback(async (
        months: string[],
    ): Promise<ReporteDiarioSummary[]> => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from("reportes_diarios")
                .select("id, mes, total_empleados, total_incidencias, tasa_asistencia, created_at")
                .in("mes", months)
                .order("mes", { ascending: true })
            if (error) throw new Error(error.message)
            return (data ?? []) as ReporteDiarioSummary[]
        } catch (err) {
            const msg = describeSupabaseError(err, "Error al cargar comparativa")
            setError(msg)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        loading,
        saving,
        error,
        fetchSummaries,
        fetchByMes,
        saveReport,
        deleteReport,
        fetchComparison,
    }
}
