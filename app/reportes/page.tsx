import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import ReportesContent from "@/components/content/reportes"

export const metadata: Metadata = {
  title: "Reportes",
}

export default function ReportesPage() {
  return (
    <Dashboard
      pageTitle="Reportes"
      content={<ReportesContent />}
    />
  )
}
