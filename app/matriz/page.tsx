import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import ReportesContent from "@/components/content/reportes"

export const metadata: Metadata = {
  title: "Matriz de Habilidades",
}

export default function MatrizPage() {
  return (
    <Dashboard
      content={<ReportesContent />}
    />
  )
}
