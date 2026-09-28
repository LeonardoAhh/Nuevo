"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from './useUser'

export type AppRole = 'dev' | 'admin' | 'evaluador'

export const EVALUADOR_ALLOWED_ROUTES = ['/desempeno', '/desempeno/objetivos', '/settings', '/cursos', '/eventos']
export const EVALUADOR_DENIED_ROUTES = ['/desempeno/cumplimiento', '/desempeno/seguimiento']

export function isEvaluadorAllowedRoute(path: string): boolean {
  const denied = EVALUADOR_DENIED_ROUTES.some(
    (r) => path === r || path.startsWith(r + '/'),
  )
  if (denied) return false
  return EVALUADOR_ALLOWED_ROUTES.some(
    (r) => path === r || path.startsWith(r + '/'),
  )
}

export type RoleContextType = {
  role: AppRole
  departamentos: string[] | null
  departamentosScope: string[] | null
  canEdit: boolean
  isReadOnly: boolean
  isEvaluador: boolean
  canEvaluate: boolean
  loading: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser()
  const [role, setRole] = useState<AppRole>('admin')
  const [departamentos, setDepartamentos] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, departamentos')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (isMounted && !error && data?.role) {
          setRole(data.role as AppRole)
          setDepartamentos((data.departamentos as string[] | null) ?? null)
        }
      } catch {
        // Default to admin
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchRole()
    
    return () => { isMounted = false }
  }, [user, userLoading])

  const canEdit = role === 'dev'
  const isReadOnly = role === 'admin'
  const isEvaluador = role === 'evaluador'
  const canEvaluate = role === 'dev' || role === 'evaluador'
  const departamentosScope = isEvaluador && departamentos && departamentos.length > 0 ? departamentos : null

  return (
    <RoleContext.Provider value={{ role, departamentos, departamentosScope, canEdit, isReadOnly, isEvaluador, canEvaluate, loading }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    // Return a safe default to avoid crashing before the provider mounts
    // or in server components that accidentally use this
    return {
      role: 'admin' as AppRole,
      departamentos: null,
      departamentosScope: null,
      canEdit: false,
      isReadOnly: true,
      isEvaluador: false,
      canEvaluate: false,
      loading: true
    }
  }
  return context
}
