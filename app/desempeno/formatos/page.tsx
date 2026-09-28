import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import FormatosBlanco from "@/components/content/desempeno-formatos-blanco"

export const metadata: Metadata = {
  title: "Formatos de Evaluación en Blanco",
}

export default function FormatosPage() {
  return (
    <Dashboard
      pageTitle="Formatos de Evaluación en Blanco"
      content={<FormatosBlanco />}
    />
  )
}
