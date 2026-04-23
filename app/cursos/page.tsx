import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import CursosAdminContent from "@/components/content/cursos-admin"

export const metadata: Metadata = {
  title: "Cursos",
}

export default function CursosAdminPage() {
  return (
    <Dashboard
      pageTitle="Cursos"
      content={<CursosAdminContent />}
    />
  )
}
