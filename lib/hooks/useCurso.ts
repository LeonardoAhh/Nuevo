import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Curso } from "./useCursos"

interface UseCursoReturn {
  curso: Curso | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCurso(id: string): UseCursoReturn {
  const [curso, setCurso] = useState<Curso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurso = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    const { data, error: sbError } = await supabase
      .from("cursos")
      .select("*")
      .eq("id", id)
      .single()
    if (sbError) {
      setError(sbError.message)
    } else {
      setCurso(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchCurso()
  }, [fetchCurso])

  return { curso, loading, error, refetch: fetchCurso }
}
