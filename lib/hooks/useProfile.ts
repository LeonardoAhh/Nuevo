import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  displayName: string
  email: string
  avatar: string
  language: string
  dateFormat: string
  skills: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [userId])

  const fetchProfile = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          const defaultProfile = await createDefaultProfile(userId)
          if (defaultProfile) {
            setProfile(defaultProfile)
            return
          }
        }
        throw error
      }

      if (data) {
        const { data: skillsData } = await supabase
          .from('skills')
          .select('skill_name')
          .eq('user_id', userId)

        setProfile({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          displayName: data.display_name,
          email: data.email,
          avatar: data.avatar_url || '',
          language: (data as any).language || 'en',
          dateFormat: (data as any).date_format || 'mm-dd-yyyy',
          skills: skillsData?.map((s) => s.skill_name) || [],
        })
      }
    } catch (err) {
      setError('Failed to fetch profile')
      console.error('Error fetching profile:', err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  const createDefaultProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: 'User',
          last_name: '',
          display_name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          avatar_url: '',
          timezone: 'america-new_york',
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        displayName: data.display_name,
        email: data.email,
        avatar: data.avatar_url || '',
        language: 'en',
        dateFormat: 'mm-dd-yyyy',
        skills: [],
      }
    } catch (err) {
      console.error('Error creating default profile:', err instanceof Error ? err.message : JSON.stringify(err))
      return null
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userId || !profile) return { success: false, error: 'No user ID or profile available' }

    try {
      setError(null)

      const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName
      if (updates.email !== undefined) dbUpdates.email = updates.email
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar
      if (updates.language !== undefined) dbUpdates.language = updates.language
      if (updates.dateFormat !== undefined) dbUpdates.date_format = updates.dateFormat

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', userId)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...updates } : prev)
      return { success: true, message: 'Profile updated successfully' }
    } catch (err) {
      const errorMessage = 'Failed to update profile'
      setError(errorMessage)
      console.error('Error updating profile:', err instanceof Error ? err.message : JSON.stringify(err))
      return { success: false, error: errorMessage }
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!userId) return { success: false, error: 'No user ID available' }

    try {
      setError(null)

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const result = await updateProfile({ avatar: publicUrl })

      if (!result.success) {
        await supabase.storage.from('avatars').remove([fileName])
        return result
      }

      return { success: true, message: 'Avatar uploaded successfully' }
    } catch (err) {
      const errorMessage = 'Failed to upload avatar'
      setError(errorMessage)
      console.error('Error uploading avatar:', err instanceof Error ? err.message : JSON.stringify(err))
      return { success: false, error: errorMessage }
    }
  }

  return { profile, loading, error, fetchProfile, updateProfile, uploadAvatar }
}
