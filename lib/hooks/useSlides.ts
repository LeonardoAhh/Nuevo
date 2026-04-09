import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

export interface Slide {
  id: string
  curso_id: string
  order: number
  type: string
  data: Record<string, unknown>
}

interface UseSlidesReturn {
  slides: Slide[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSlides(cursoId: string): UseSlidesReturn {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSlides = useCallback(async () => {
    if (!cursoId) return
    setLoading(true)
    setError(null)
    const { data, error: sbError } = await supabase
      .from("slides")
      .select("*")
      .eq("curso_id", cursoId)
      .order("order", { ascending: true })
    if (sbError) {
      setError(sbError.message)
    } else {
      setSlides(data ?? [])
    }
    setLoading(false)
  }, [cursoId])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  return { slides, loading, error, refetch: fetchSlides }
}
