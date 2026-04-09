"use client"

import Dashboard from "@/components/Dashboard"
import CapacitacionContent from "@/components/content/capacitacion"

export default function CapacitacionPage() {
  return (
    <Dashboard
      pageTitle="Capacitación"
      content={<CapacitacionContent />}
    />
  )
}
