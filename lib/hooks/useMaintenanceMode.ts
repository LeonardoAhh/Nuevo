"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

export function useMaintenanceMode() {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [loading, setLoading] = useState(true)
  const [endsAt, setEndsAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    // Obtener estado inicial
    const fetchState = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("*")
          .eq("id", "maintenance_mode")
          .maybeSingle()
        
        if (error) {
          console.error("Supabase error [maintenance_mode]:", error.message || error.toString(), error)
          return
        }

        if (mounted && data) {
          setIsMaintenance(data.value === "true" || data.value === true)
          setEndsAt(data.maintenance_ends_at ?? null)
        }
      } catch (err) {
        console.error("Error fetching maintenance mode:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchState()

    // Suscribirse a cambios en tiempo real con un nombre de canal verdaderamente único
    // para evitar colisiones cuando React Strict Mode monta/desmonta el efecto rápidamente.
    const channelName = `maintenance_mode_${Math.random().toString(36).substring(2)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.maintenance_mode' },
        (payload) => {
          if (mounted) {
            setIsMaintenance(payload.new.value === "true" || payload.new.value === true)
            setEndsAt(payload.new.maintenance_ends_at ?? null)
          }
        }
      )
      .subscribe()

    // Reintentar también cuando Realtime no esté disponible.
    const poll = window.setInterval(fetchState, 30_000)
    window.addEventListener("focus", fetchState)

    return () => {
      mounted = false
      window.clearInterval(poll)
      window.removeEventListener("focus", fetchState)
      supabase.removeChannel(channel)
    }
  }, [])

  const toggleMaintenance = async (active: boolean, durationSeconds?: number) => {
    if (active && (durationSeconds === undefined || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 365 * 86400)) return false
    setSaving(true)
    try {
      const deadline = active ? new Date(Date.now() + durationSeconds! * 1000).toISOString() : null
      const { data, error } = await supabase
        .from("system_settings")
        .update({ value: active, maintenance_ends_at: deadline })
        .eq("id", "maintenance_mode")
        .select("*")
        .single()
      
      if (error) {
        throw error
      }
      setIsMaintenance(data.value === "true" || data.value === true)
      setEndsAt(data.maintenance_ends_at ?? null)
      return true
    } catch (err) {
      console.error("Error updating maintenance mode:", err)
      return false
    } finally {
      setSaving(false)
    }
  }

  return { isMaintenance, endsAt, loading, saving, toggleMaintenance }
}
