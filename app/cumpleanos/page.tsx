import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import CumpleanosContent from "@/components/content/cumpleanos"

export const metadata: Metadata = {
  title: "Cumpleaños",
}

export default function CumpleanosPage() {
  return (
    <Dashboard
      pageTitle="Cumpleaños"
      content={<CumpleanosContent />}
    />
  )
}
