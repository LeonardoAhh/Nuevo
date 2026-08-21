import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import ExamenesClient from "@/components/content/examenes-client"

export const metadata: Metadata = {
  title: "Exámenes",
}

export default function ExamenesPage() {
  return (
    <Dashboard
      pageTitle="Exámenes"
      content={<ExamenesClient />}
    />
  )
}
