import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import RecontratacionContent from "@/components/content/recontratacion"

export const metadata: Metadata = {
  title: "Recontratación",
}

export default function RecontratacionPage() {
  return (
    <Dashboard
      pageTitle="Recontratación"
      content={<RecontratacionContent />}
    />
  )
}
