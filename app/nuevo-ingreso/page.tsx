"use client"

import Dashboard from "@/dashboard"
import NuevoIngresoContent from "@/nuevo-ingreso-content"
import { ThemeProvider } from "@/theme-context"

export default function NuevoIngresoPage() {
  return (
    <ThemeProvider>
      <Dashboard content={<NuevoIngresoContent />} />
    </ThemeProvider>
  )
}
