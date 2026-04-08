import type React from "react"
import type { Metadata, Viewport } from "next"
import "@/app/globals.css"
import { ThemeProvider } from "../theme-context"
import { PWARegister } from "@/components/pwa-register"

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Capacitación VIÑOPLASTIC",
  description: "Sistema de gestión de capacitación y nuevo ingreso",
  applicationName: "Capacitación",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Capacitación",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <PWARegister />
      </body>
    </html>
  )
}
