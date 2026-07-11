import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface CursoPublico {
  id: string
  nombre: string
  descripcion: string | null
  url: string
  imagen_url: string | null
  activo: boolean
  orden: number
  created_at: string
}

export type CursoPublicoInput = Omit<CursoPublico, 'id' | 'created_at'>

export function useCursosPublicos(soloActivos = false) {
  const [cursos, setCursos] = useState<CursoPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCursos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('cursos_publicos')
        .select('*')
        .order('orden', { ascending: true })
        .order('created_at', { ascending: true })

      if (soloActivos) {
        query = query.eq('activo', true)
      }

      const { data, error: err } = await query
      if (err) throw err
      setCursos(data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar cursos')
    } finally {
      setLoading(false)
    }
  }, [soloActivos])

  useEffect(() => {
    fetchCursos()
  }, [fetchCursos])

  const crear = useCallback(async (input: CursoPublicoInput) => {
    const { error: err } = await supabase.from('cursos_publicos').insert(input)
    if (err) throw err
    await fetchCursos()
  }, [fetchCursos])

  const actualizar = useCallback(async (id: string, input: Partial<CursoPublicoInput>) => {
    const { error: err } = await supabase
      .from('cursos_publicos')
      .update(input)
      .eq('id', id)
    if (err) throw err
    await fetchCursos()
  }, [fetchCursos])

  const eliminar = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('cursos_publicos')
      .delete()
      .eq('id', id)
    if (err) throw err
    await fetchCursos()
  }, [fetchCursos])

  return { cursos, loading, error, refetch: fetchCursos, crear, actualizar, eliminar }
}
