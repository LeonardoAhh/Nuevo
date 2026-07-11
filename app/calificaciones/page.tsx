import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import CalificacionesMural from "@/components/content/calificaciones-mural"

export const metadata: Metadata = {
  title: "Calificaciones",
}

export default function CalificacionesPage() {
  return (
    <Dashboard
      pageTitle="Calificaciones"
      content={<CalificacionesMural />}
    />
  )
}
