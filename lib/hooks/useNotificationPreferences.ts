import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface NotificationPreferences {
  pushBajas: boolean
  pushBajasWarning: boolean
  emailBajas: boolean
  emailProductUpdates: boolean
  emailComments: boolean
  emailMentions: boolean
  emailMarketing: boolean
  pushComments: boolean
  pushMentions: boolean
  pushDirectMessages: boolean
}

const defaultPreferences: NotificationPreferences = {
  pushBajas: true,
  pushBajasWarning: true,
  emailBajas: false,
  emailProductUpdates: false,
  emailComments: true,
  emailMentions: true,
  emailMarketing: false,
  pushComments: true,
  pushMentions: true,
  pushDirectMessages: true,
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
          emailBajas: data.email_bajas ?? false,
          emailProductUpdates: data.email_product_updates,
          emailComments: data.email_comments,
          emailMentions: data.email_mentions,
          emailMarketing: data.email_marketing,
          pushComments: data.push_comments,
          pushMentions: data.push_mentions,
          pushDirectMessages: data.push_direct_messages,
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
          email_bajas: preferences.emailBajas,
          email_product_updates: preferences.emailProductUpdates,
          email_comments: preferences.emailComments,
          email_mentions: preferences.emailMentions,
          email_marketing: preferences.emailMarketing,
          push_comments: preferences.pushComments,
          push_mentions: preferences.pushMentions,
          push_direct_messages: preferences.pushDirectMessages,
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
