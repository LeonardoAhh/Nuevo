import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-context"
import { PWARegister } from "@/components/pwa-register"
import { SonnerProvider } from "@/components/ui/sonner-provider"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"
import { ConnectionStatus } from "@/components/connection-status"
import { UpdateBanner } from "@/components/update-banner"
import { MaintenanceGuard } from "@/components/maintenance-guard"
import { ViewportFix } from "@/components/viewport-fix"
import { UserProvider } from "@/lib/hooks/useUser"
import { RoleProvider } from "@/lib/hooks/useRole"
import {
  buildThemeBootstrapScript,
  OS_THEME_COLOR_FALLBACK as THEME_FALLBACK,
} from "@/lib/theme/constants"

// Geist is the single app type system. Existing `font-serif` consumers are
// intentionally mapped to Geist Sans in Tailwind while they are migrated.
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_FALLBACK.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_FALLBACK.dark },
  ],
  width: "device-width",
  initialScale: 1,
  // Zoom stays enabled (WCAG 1.4.4): users with low vision must be able
  // to scale the page. Auto-zoom on inputs is already mitigated by the
  // --font-base-size tokens being >= 16px by default.
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "Capacitación Qro",
  description:
    "Sistema de Administración, Estandarización y Control de Datos",
  applicationName: "Vertx System",
  appleWebApp: {
    capable: true,
    // "black-translucent" lets the app draw under the status bar; our sticky
    // header already reserves env(safe-area-inset-top) so the header color
    // shows through the bar in both light and dark themes.
    statusBarStyle: "black-translucent",
    title: "Vertx System",
    startupImage: "/icons/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

// Apply theme settings synchronously before React hydrates to avoid FOUC.
// Generated from lib/theme/constants.ts (single source shared with ThemeProvider).
const THEME_BOOTSTRAP_SCRIPT = buildThemeBootstrapScript()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${fontSans.variable} ${fontMono.variable} font-sans`}
      >
        {/* Client-side viewport metrics (--initial/visual-viewport-height) */}
        <ViewportFix />
        <ThemeProvider>
          <UserProvider>
            <RoleProvider>
              <MaintenanceGuard>{children}</MaintenanceGuard>
              {/* App-wide overlays live inside ThemeProvider so any theme-aware
                  consumer (toasts, dialogs) resolves the active theme correctly. */}
              <PWARegister />
              <UpdateBanner />
              <SonnerProvider />
              <ConfirmProvider />
              <ConnectionStatus />
            </RoleProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
