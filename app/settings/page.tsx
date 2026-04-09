"use client"

import Dashboard from "@/components/dashboard"
import SettingsContent from "@/components/content/settings"

export default function SettingsPage() {
  return (
    <Dashboard
      pageTitle="Ajustes"
      content={<SettingsContent />}
    />
  )
}
