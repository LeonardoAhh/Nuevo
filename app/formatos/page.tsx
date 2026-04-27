import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import FormatosContent from "@/components/content/formatos"

export const metadata: Metadata = {
  title: "Formatos",
}

export default function FormatosPage() {
  return (
    <Dashboard
      pageTitle="Formatos"
      content={<FormatosContent />}
    />
  )
}
