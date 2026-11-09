import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import { IncidenciasPage } from "@/components/content/incidencias-page"

export const metadata: Metadata = {
  title: "Incidencias",
}

export default async function IncidenciasPageRoute({
  params,
  searchParams,
}: {
  params: Promise<{ numeroEmpleado: string }>
  searchParams: Promise<{ origen?: string }>
}) {
  const { numeroEmpleado } = await params
  const { origen } = await searchParams

  return (
    <Dashboard
      content={<IncidenciasPage key={numeroEmpleado} numeroEmpleado={numeroEmpleado} returnTo={origen === "ingresos-semanales" ? "/ingresos-semanales" : "/plantilla"} />}
    />
  )
}
