"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { syncBadge, clearBadge } from "@/lib/supabase/push"

export interface BajaNotification {
  id: string
  employee_name: string
  employee_numero: string | null
  motivo: string | null
  fecha_baja: string
  created_by: string | null
  read: boolean
  created_at: string
  updated_at: string
}

export type BajaNotificationInsert = Pick<
  BajaNotification,
  "employee_name" | "employee_numero" | "motivo" | "fecha_baja"
>

export function useBajaNotifications() {
  const [notifications, setNotifications] = useState<BajaNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("baja_notifications")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) setNotifications(data as BajaNotification[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Polling cada 20s (Realtime no disponible en este proyecto)
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 20_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Sincronizar badge del ícono de la app con el conteo de no leídas
  const prevBadgeCount = useRef<number | null>(null)
  useEffect(() => {
    if (prevBadgeCount.current !== unreadCount) {
      prevBadgeCount.current = unreadCount
      syncBadge(unreadCount)
    }
  }, [unreadCount])

  const create = useCallback(async (record: BajaNotificationInsert) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: inserted, error } = await supabase
      .from("baja_notifications")
      .insert({ ...record, created_by: user?.id ?? null })
      .select()
      .single()
    if (error) throw error

    // Actualizar UI inmediatamente (no esperar el websocket)
    setNotifications((prev) => [inserted as BajaNotification, ...prev])

    // Enviar push notification a todos los usuarios suscritos via servidor
    const { data: { session } } = await supabase.auth.getSession()
    window.fetch("/api/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        id: inserted?.id,
        title: "🔔 Baja de empleado",
        body: `${record.employee_name} – Fecha de baja: ${record.fecha_baja}`,
        url: "/",
        tag: "baja-notification",
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("[Push] send-push response:", JSON.stringify(data)))
      .catch((err) => console.error("[Push] send-push fetch error:", err))
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    // Actualizar UI inmediatamente (optimistic update)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await supabase
      .from("baja_notifications")
      .update({ read: true })
      .eq("id", id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    // Actualizar UI inmediatamente
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase
      .from("baja_notifications")
      .update({ read: true })
      .eq("read", false)
    clearBadge()
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("baja_notifications")
      .delete()
      .eq("id", id)
    if (!error) await fetchNotifications()
  }, [fetchNotifications])

  return { notifications, loading, unreadCount, create, markAsRead, markAllAsRead, remove, refresh: fetchNotifications }
}
