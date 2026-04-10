"use client"

import { useState, useCallback, useRef } from "react"

/**
 * Undo / Redo hook – stores deep-cloned snapshots.
 * T must be JSON-serialisable.
 */
export function useFlayerHistory<T>(initial: T, maxHistory = 50) {
  const [past, setPast] = useState<T[]>([])
  const [present, setPresent] = useState<T>(initial)
  const [future, setFuture] = useState<T[]>([])
  const skipRecord = useRef(false)

  /** Push a new state (clears future). */
  const push = useCallback(
    (next: T) => {
      if (skipRecord.current) {
        skipRecord.current = false
        setPresent(next)
        return
      }
      setPast((p) => [...p.slice(-(maxHistory - 1)), structuredClone(present)])
      setPresent(next)
      setFuture([])
    },
    [present, maxHistory],
  )

  /** Undo – returns previous state or undefined if empty. */
  const undo = useCallback(() => {
    if (past.length === 0) return undefined
    const prev = past[past.length - 1]
    setPast((p) => p.slice(0, -1))
    setFuture((f) => [structuredClone(present), ...f])
    skipRecord.current = true
    setPresent(prev)
    return prev
  }, [past, present])

  /** Redo – returns next state or undefined if empty. */
  const redo = useCallback(() => {
    if (future.length === 0) return undefined
    const next = future[0]
    setFuture((f) => f.slice(1))
    setPast((p) => [...p, structuredClone(present)])
    skipRecord.current = true
    setPresent(next)
    return next
  }, [future, present])

  const canUndo = past.length > 0
  const canRedo = future.length > 0

  return { state: present, set: push, undo, redo, canUndo, canRedo } as const
}
