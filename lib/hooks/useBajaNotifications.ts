"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

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

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("baja_notifications")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) setNotifications(data as BajaNotification[])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("baja_notifications_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "baja_notifications" },
        () => { fetch() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch])

  const create = useCallback(async (record: BajaNotificationInsert) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from("baja_notifications")
      .insert({ ...record, created_by: user?.id ?? null })
    if (error) throw error
    // Push notification via SW
    if ("serviceWorker" in navigator && "Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready
        reg.showNotification("Baja de empleado", {
          body: `${record.employee_name} – Fecha de baja: ${record.fecha_baja}`,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          tag: "baja-notification",
        })
      }
    }
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
  }, [])

  const remove = useCallback(async (id: string) => {
    await supabase
      .from("baja_notifications")
      .delete()
      .eq("id", id)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, loading, unreadCount, create, markAsRead, markAllAsRead, remove, refresh: fetch }
}
