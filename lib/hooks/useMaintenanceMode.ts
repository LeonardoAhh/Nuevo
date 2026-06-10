"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

export function useMaintenanceMode() {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Obtener estado inicial
    const fetchState = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("id", "maintenance_mode")
          .maybeSingle()
        
        if (error) {
          console.error("Supabase error:", error)
          return
        }

        if (mounted && data) {
          setIsMaintenance(data.value === "true" || data.value === true)
        }
      } catch (err) {
        console.error("Error fetching maintenance mode:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchState()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('public:system_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.maintenance_mode' },
        (payload) => {
          if (mounted) {
            setIsMaintenance(payload.new.value === "true" || payload.new.value === true)
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const toggleMaintenance = async (active: boolean) => {
    try {
      // Optimizamos la UI localmente
      setIsMaintenance(active)
      const { error } = await supabase
        .from("system_settings")
        .update({ value: active })
        .eq("id", "maintenance_mode")
      
      if (error) {
        // Revertir si falla
        setIsMaintenance(!active)
        throw error
      }
      return true
    } catch (err) {
      console.error("Error updating maintenance mode:", err)
      return false
    }
  }

  return { isMaintenance, loading, toggleMaintenance }
}
