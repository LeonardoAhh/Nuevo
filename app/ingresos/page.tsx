import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import NuevoIngresoContent from "@/components/content/nuevo-ingreso"

export const metadata: Metadata = {
  title: "Nuevos Empleados",
}

export default function NuevoIngresoPage() {
  return (
    <Dashboard
      pageTitle="Nuevos Empleados"
      content={<NuevoIngresoContent />}
    />
  )
}
