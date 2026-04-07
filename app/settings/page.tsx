"use client"

import Dashboard from "@/dashboard"
import SettingsContent from "@/settings-content"
import { ThemeProvider } from "@/theme-context"

export default function SettingsPage() {
  return (
    <ThemeProvider>
      <Dashboard content={<SettingsContent />} />
    </ThemeProvider>
  )
}
