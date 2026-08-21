import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoPendientes from "@/components/content/desempeno-pendientes"

export const metadata: Metadata = {
  title: "Evaluaciones Pendientes",
}

export default function DesempenoPendientesPage() {
  return (
    <Dashboard
      pageTitle="Evaluaciones Pendientes"
      content={<DesempenoPendientes />}
    />
  )
}
