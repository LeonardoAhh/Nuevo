import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoSeguimiento from "@/components/content/desempeno-seguimiento"

export const metadata: Metadata = {
  title: "Seguimiento de Compromisos",
  description: "Empleados con evaluación reprobada y compromisos de mejora pendientes.",
}

export default function DesempenoSeguimientoPage() {
  return (
    <Dashboard
      pageTitle="Seguimiento de Compromisos"
      content={<DesempenoSeguimiento />}
    />
  )
}
