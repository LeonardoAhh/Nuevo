"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useCumplimiento } from "@/lib/hooks/useCumplimiento"

type CumplimientoCtx = ReturnType<typeof useCumplimiento>

const CumplimientoContext = createContext<CumplimientoCtx | null>(null)

export function CumplimientoProvider({ children }: { children: ReactNode }) {
  const value = useCumplimiento()
  return (
    <CumplimientoContext.Provider value={value}>
      {children}
    </CumplimientoContext.Provider>
  )
}

export function useCumplimientoShared(): CumplimientoCtx {
  const ctx = useContext(CumplimientoContext)
  if (!ctx) {
    throw new Error(
      "useCumplimientoShared must be used within a CumplimientoProvider"
    )
  }
  return ctx
}
