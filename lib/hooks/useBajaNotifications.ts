"use client"

import { useCallback, useEffect, useState } from "react"
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

  // Realtime: actualizar lista cuando hay cambios en la tabla
  useEffect(() => {
    const channel = supabase
      .channel("baja_notifications_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "baja_notifications" },
        () => { fetchNotifications() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Sincronizar badge del ícono de la app con el conteo de no leídas
  useEffect(() => {
    syncBadge(unreadCount)
  }, [unreadCount])

  const create = useCallback(async (record: BajaNotificationInsert) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: inserted, error } = await supabase
      .from("baja_notifications")
      .insert({ ...record, created_by: user?.id ?? null })
      .select("id")
      .single()
    if (error) throw error

    // Enviar push notification a todos los usuarios suscritos via servidor
    window.fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: inserted?.id,
        title: "Baja de empleado",
        body: `${record.employee_name} – Fecha de baja: ${record.fecha_baja}`,
        url: "/",
        tag: "baja-notification",
      }),
    }).catch(() => {})
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from("baja_notifications")
      .update({ read: true })
      .eq("id", id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    await supabase
      .from("baja_notifications")
      .update({ read: true })
      .eq("read", false)
    clearBadge()
  }, [])

  const remove = useCallback(async (id: string) => {
    await supabase
      .from("baja_notifications")
      .delete()
      .eq("id", id)
  }, [])

  return { notifications, loading, unreadCount, create, markAsRead, markAllAsRead, remove, refresh: fetchNotifications }
}
