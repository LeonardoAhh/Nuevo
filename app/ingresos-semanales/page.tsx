import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import IngresosSemanalesContent from "@/components/content/ingresos-semanales"

export const metadata: Metadata = {
  title: "Ingresos Semanales",
}

export default function IngresosSemanalesPage() {
  return (
    <Dashboard
      pageTitle="Ingresos Semanales"
      content={<IngresosSemanalesContent />}
    />
  )
}
