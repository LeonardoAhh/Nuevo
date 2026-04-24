"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useDashboardAlertas } from "@/lib/hooks/useDashboardAlertas"

type DashboardAlertasCtx = ReturnType<typeof useDashboardAlertas>

const DashboardAlertasContext = createContext<DashboardAlertasCtx | null>(null)

export function DashboardAlertasProvider({ children }: { children: ReactNode }) {
  const value = useDashboardAlertas()
  return (
    <DashboardAlertasContext.Provider value={value}>
      {children}
    </DashboardAlertasContext.Provider>
  )
}

export function useDashboardAlertasShared(): DashboardAlertasCtx {
  const ctx = useContext(DashboardAlertasContext)
  if (!ctx) {
    throw new Error(
      "useDashboardAlertasShared must be used within a DashboardAlertasProvider"
    )
  }
  return ctx
}
