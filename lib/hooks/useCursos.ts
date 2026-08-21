import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { notify } from "@/lib/notify"

export interface Curso {
  id: string
  title: string
  description: string | null
  category: string | null
  duration: string | null
  instructor: string | null
  instructor_role: string | null
  company: string | null
  year: string | null
  published: boolean
  slide_count: number
  contenido_url: string | null
  candidate_view: boolean
  puestos_aplicables: string[]
  tipo: string | null
  activo: boolean
  native_course_id: string | null
  examen_url: string | null
  orden: number | null
  created_at: string | null
  updated_at: string | null
}

interface UseCursosReturn {
  cursos: Curso[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCursos(): UseCursosReturn {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCursos = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: sbError } = await supabase
      .from("cursos")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true, nullsFirst: false })
    if (sbError) {
      setError(sbError.message)
      notify.error("Error al cargar cursos")
    } else {
      setCursos(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCursos()
  }, [fetchCursos])

  return { cursos, loading, error, refetch: fetchCursos }
}
