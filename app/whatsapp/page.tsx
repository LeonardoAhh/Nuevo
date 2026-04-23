import Dashboard from "@/components/Dashboard"
import WhatsAppDashboard from "@/components/whatsapp-dashboard"

export default function WhatsAppPage() {
  return (
    <Dashboard
      pageTitle="WhatsApp Bot"
      content={<WhatsAppDashboard />}
    />
  )
}
