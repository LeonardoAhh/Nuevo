import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import { ActasSeguimientoPage } from "@/components/content/actas-seguimiento-page"

export const metadata: Metadata = {
  title: "Actas y seguimiento",
}

export default async function Page({ params }: { params: Promise<{ numeroEmpleado: string }> }) {
  const { numeroEmpleado } = await params

  return (
    <Dashboard
      pageTitle="Actas y seguimiento"
      content={<ActasSeguimientoPage key={numeroEmpleado} numeroEmpleado={numeroEmpleado} />}
    />
  )
}
