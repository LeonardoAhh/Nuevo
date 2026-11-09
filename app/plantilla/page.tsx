import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import CapacitacionContent from "@/components/content/capacitacion"

export const metadata: Metadata = {
  title: "Plantilla",
}

export default function PlantillaPage() {
  return (
    <Dashboard
      content={<CapacitacionContent />}
    />
  )
}
