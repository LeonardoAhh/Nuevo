import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from './useUser'

export type AppRole = 'dev' | 'admin' | 'evaluador'

/** Rutas permitidas para el rol evaluador */
export const EVALUADOR_ALLOWED_ROUTES = ['/desempeno', '/desempeno/objetivos', '/settings', '/cursos', '/bot', '/eventos']

export function useRole() {
  const { user, loading: userLoading } = useUser()
  const [role, setRole] = useState<AppRole>('admin')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (!error && data?.role) {
          setRole(data.role as AppRole)
        }
      } catch {
        // Default to admin (read-only) on error
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [user, userLoading])

  /** true si el usuario puede editar/crear/eliminar */
  const canEdit = role === 'dev'

  /** true si el usuario solo puede ver */
  const isReadOnly = role === 'admin'

  /** true si el usuario es evaluador (acceso limitado a desempeño) */
  const isEvaluador = role === 'evaluador'

  /** true si el usuario puede gestionar evaluaciones (dev o evaluador) */
  const canEvaluate = role === 'dev' || role === 'evaluador'

  return { role, canEdit, isReadOnly, isEvaluador, canEvaluate, loading }
}
