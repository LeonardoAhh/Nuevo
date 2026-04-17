import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface NotificationPreferences {
  pushBajas: boolean          // Baja registrada al momento
  pushBajasWarning: boolean   // Aviso anticipado de baja (3d, 1d, hoy)
  pushRg: boolean             // RG-REC-048 próximo a vencer
  pushContrato: boolean       // Término de contrato próximo
}

const defaultPreferences: NotificationPreferences = {
  pushBajas: true,
  pushBajasWarning: true,
  pushRg: true,
  pushContrato: true,
}

export function useNotificationPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) fetchPreferences()
  }, [userId])

  const fetchPreferences = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return
        throw error
      }

      if (data) {
        setPreferences({
          pushBajas: data.push_bajas ?? true,
          pushBajasWarning: data.push_bajas_warning ?? true,
          pushRg: data.push_rg ?? true,
          pushContrato: data.push_contrato ?? true,
        })
      }
    } catch (err) {
      setError('Failed to fetch notification preferences')
      console.error('Error fetching preferences:', err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const savePreferences = async () => {
    if (!userId) return { success: false, error: 'No user ID' }
    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          push_bajas: preferences.pushBajas,
          push_bajas_warning: preferences.pushBajasWarning,
          push_rg: preferences.pushRg,
          push_contrato: preferences.pushContrato,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error
      return { success: true }
    } catch (err) {
      const msg = 'Failed to save preferences'
      setError(msg)
      console.error('Error saving preferences:', err instanceof Error ? err.message : JSON.stringify(err))
      return { success: false, error: msg }
    } finally {
      setSaving(false)
    }
  }

  return { preferences, loading, saving, error, updatePreference, savePreferences }
}
