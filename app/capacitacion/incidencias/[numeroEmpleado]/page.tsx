import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import { IncidenciasPage } from "@/components/content/incidencias-page"

export const metadata: Metadata = {
  title: "Incidencias",
}

export default async function Page({
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
      pageTitle="Incidencias"
      content={<IncidenciasPage key={numeroEmpleado} numeroEmpleado={numeroEmpleado} returnTo={origen === "ingresos-semanales" ? "/ingresos-semanales" : "/capacitacion"} />}
    />
  )
}
