"use client"

import Dashboard from "@/components/Dashboard"
import FlayersContent from "@/components/content/flayers"

export default function FlayersPage() {
  return (
    <Dashboard
      pageTitle="Flayers"
      content={<FlayersContent />}
    />
  )
}
