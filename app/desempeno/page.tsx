import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import DesempenoSearch from "@/components/content/desempeno-search"

export const metadata: Metadata = {
  title: "Evaluación Desempeño",
}

export default function DesempenoPage() {
  return (
    <Dashboard
      pageTitle="Evaluación de Desempeño"
      content={<DesempenoSearch />}
    />
  )
}
