"use client"

import type { Metadata } from "next"
import Dashboard from "@/components/Dashboard"
import SettingsContent from "@/components/content/settings"

export const metadata: Metadata = {
  title: "Ajustes",
}

export default function SettingsPage() {
  return (
    <Dashboard
      pageTitle="Ajustes"
      content={<SettingsContent />}
    />
  )
}
