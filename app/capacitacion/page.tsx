"use client"

import Dashboard from "@/dashboard"
import CapacitacionContent from "@/capacitacion-content"
import { ThemeProvider } from "@/theme-context"

export default function CapacitacionPage() {
  return (
    <ThemeProvider>
      <Dashboard content={<CapacitacionContent />} />
    </ThemeProvider>
  )
}
