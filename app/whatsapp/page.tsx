import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import WhatsAppDashboard from "@/components/whatsapp-dashboard"

export const metadata: Metadata = {
  title: "WhatsApp Bot",
}

export default function WhatsAppPage() {
  return (
    <Dashboard
      pageTitle="WhatsApp Bot"
      content={<WhatsAppDashboard />}
    />
  )
}
