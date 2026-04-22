"use client"

import Dashboard from "@/components/Dashboard"
import CursosAdminContent from "@/components/content/cursos-admin"

export default function CursosAdminPage() {
  return (
    <Dashboard
      pageTitle="Cursos"
      content={<CursosAdminContent />}
    />
  )
}
