"use client"

import Dashboard from "@/components/Dashboard"
import CalificacionesMural from "@/components/content/calificaciones-mural"

export default function CalificacionesPage() {
  return (
    <Dashboard
      pageTitle="Calificaciones"
      content={<CalificacionesMural />}
    />
  )
}
