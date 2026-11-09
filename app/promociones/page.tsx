import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import PromocionesClient from "@/components/content/promociones-client"

export const metadata: Metadata = {
  title: "Categorías",
}

export default function PromocionesPage() {
  return (
    <Dashboard
      content={<PromocionesClient />}
    />
  )
}
