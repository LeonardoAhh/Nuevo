import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import { ActasSeguimientoPage } from "@/components/content/actas-seguimiento-page"

export const metadata: Metadata = {
  title: "Actas administrativas",
}

export default async function ActasPage({ params }: { params: Promise<{ numeroEmpleado: string }> }) {
  const { numeroEmpleado } = await params

  return (
    <Dashboard
      content={<ActasSeguimientoPage key={numeroEmpleado} numeroEmpleado={numeroEmpleado} />}
    />
  )
}
