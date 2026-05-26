"use client"

import { useEffect, useRef, useState } from "react"

interface Options {
  /** Pausa el ciclo (ej. cuando el componente no es visible). */
  paused?: boolean
  /** Cuando se define, mantiene el loop en este índice sin avanzar. */
  staticIndex?: number
}

/**
 * Ciclo de fases con duración por índice.
 * Las arrays se leen vía ref para tolerar referencias estables a nivel módulo.
 */
export function usePhaseLoop<T extends string>(
  phases: readonly T[],
  durations: readonly number[],
  options: Options = {},
): T {
  const { paused = false, staticIndex } = options
  const [idx, setIdx] = useState(0)
  const ref = useRef({ phases, durations })

  useEffect(() => {
    ref.current = { phases, durations }
  }, [phases, durations])

  useEffect(() => {
    if (paused || staticIndex !== undefined) return
    const { durations: d, phases: p } = ref.current
    const t = setTimeout(() => setIdx((i) => (i + 1) % p.length), d[idx])
    return () => clearTimeout(t)
  }, [idx, paused, staticIndex])

  return phases[staticIndex ?? idx]
}
