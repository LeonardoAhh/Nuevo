import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import FlayersContent from "@/components/content/flayers"

export const metadata: Metadata = {
  title: "Flayers",
}

export default function FlayersPage() {
  return (
    <Dashboard
      pageTitle="Flayers"
      content={<FlayersContent />}
    />
  )
}
