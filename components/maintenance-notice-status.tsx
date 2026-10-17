"use client"

import { createContext, useContext } from "react"

// null means the post-login notice has not been resolved yet.
export const MaintenanceNoticeStatusContext = createContext<boolean | null>(false)

export function useMaintenanceNoticeStatus() {
  return useContext(MaintenanceNoticeStatusContext)
}
