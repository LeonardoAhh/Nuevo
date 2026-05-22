import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import CapacitacionContent from "@/components/content/capacitacion"

export const metadata: Metadata = {
  title: "Capacitación",
}

export default function CapacitacionPage() {
  return (
    <Dashboard
      pageTitle="Capacitación"
      content={<CapacitacionContent />}
    />
  )
}
