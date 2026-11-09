import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import SettingsContent from "@/components/content/settings"

export const metadata: Metadata = {
  title: "Configuración",
}

export default function SettingsPage() {
  return (
    <Dashboard
      content={<SettingsContent />}
    />
  )
}
