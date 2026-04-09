"use client"

import Dashboard from "@/components/dashboard"
import CapacitacionContent from "@/components/content/capacitacion"

export default function CapacitacionPage() {
  return (
    <Dashboard
      pageTitle="Capacitación"
      content={<CapacitacionContent />}
    />
  )
}
