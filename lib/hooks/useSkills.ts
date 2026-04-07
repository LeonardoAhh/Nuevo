import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function useSkills(userId?: string) {
  const [skills, setSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar skills al inicializar
  useEffect(() => {
    if (userId) {
      fetchSkills()
    }
  }, [userId])

  const fetchSkills = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('skills')
        .select('skill_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setSkills(data?.map(item => item.skill_name) || [])
    } catch (err) {
      setError('Failed to fetch skills')
      console.error('Error fetching skills:', err instanceof Error ? err.message : JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  const addSkill = async (skill: string) => {
    if (!userId) return { success: false, error: 'No user ID available' }

    try {
      setError(null)

      const trimmedSkill = skill.trim()

      // Verificar si la skill ya existe
      if (skills.includes(trimmedSkill)) {
        return { success: false, error: 'Skill already exists' }
      }

      const { data, error } = await supabase
        .from('skills')
        .insert({
          user_id: userId,
          skill_name: trimmedSkill
        })
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado local
      setSkills(prev => [...prev, trimmedSkill])

      return { success: true, message: 'Skill added successfully' }
    } catch (err) {
      const errorMessage = 'Failed to add skill'
      setError(errorMessage)
      console.error('Error adding skill:', err)
      return { success: false, error: errorMessage }
    }
  }

  const removeSkill = async (skill: string) => {
    if (!userId) return { success: false, error: 'No user ID available' }

    try {
      setError(null)

      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('user_id', userId)
        .eq('skill_name', skill)

      if (error) throw error

      // Actualizar el estado local
      setSkills(prev => prev.filter(s => s !== skill))

      return { success: true, message: 'Skill removed successfully' }
    } catch (err) {
      const errorMessage = 'Failed to remove skill'
      setError(errorMessage)
      console.error('Error removing skill:', err)
      return { success: false, error: errorMessage }
    }
  }

  return {
    skills,
    loading,
    error,
    fetchSkills,
    addSkill,
    removeSkill,
  }
}