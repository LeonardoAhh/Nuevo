"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { BajaNotification } from "@/lib/hooks/useBajaNotifications"

// ─── Types ──────────────────────────────────────────────────────────────────

export type TipoFilter = "all" | "manual" | "scheduled"

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatDateMX(d: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d.includes("T") ? d : d + "T00:00:00"))
  } catch {
    return d
  }
}

export function formatDateTimeMX(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useNotificationHistory() {
  const [notifications, setNotifications] = useState<BajaNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState<TipoFilter>("all")
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  const fetchData = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from("baja_notifications")
      .select("*")
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`)
      .order("created_at", { ascending: false })

    if (tipo !== "all") {
      query = query.eq("tipo", tipo)
    }

    const { data } = await query
    setNotifications((data as BajaNotification[]) || [])
    setLoading(false)
  }, [dateFrom, dateTo, tipo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = notifications.filter((n) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      n.employee_name.toLowerCase().includes(q) ||
      (n.employee_numero?.toLowerCase().includes(q) ?? false) ||
      (n.motivo?.toLowerCase().includes(q) ?? false)
    )
  })

  return {
    loading,
    notifications: filtered,
    totalCount: filtered.length,
    unreadCount: filtered.filter((n) => !n.read).length,
    search, setSearch,
    tipo, setTipo,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
  }
}
