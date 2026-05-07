import type React from "react"
import type { Metadata, Viewport } from "next"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-context"
import { PWARegister } from "@/components/pwa-register"
import { SonnerProvider } from "@/components/ui/sonner-provider"
import { ConfirmProvider } from "@/components/ui/confirm-dialog"
import { ConnectionStatus } from "@/components/connection-status"
import { InstallPrompt } from "@/components/install-prompt"

// Values below match --card tokens in app/globals.css so the mobile browser /
// PWA status bar (Android) and the sticky header blend seamlessly. The theme
// provider also updates the meta tag dynamically when the user cycles themes
// in-app, so this OS-media fallback only applies on first paint.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f5" },
    { media: "(prefers-color-scheme: dark)",  color: "#1a1a1f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "Capacitación Qro",
  description: "Sistema de Administractión, Estandarización y Control de Datos",
  applicationName: "Vertx System v2.0",
  appleWebApp: {
    capable: true,
    // "black-translucent" lets the app draw under the status bar; our sticky
    // header already reserves env(safe-area-inset-top) so the header color
    // shows through the bar in both light and dark themes.
    statusBarStyle: "black-translucent",
    title: "Vertx System v2.0",
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
    shortcut: "/icons/favicon-32.png",
  },
}

import { ViewportFix } from "@/components/viewport-fix"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Apply theme settings synchronously before React hydrates to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var d=document.documentElement;
  var c={"slate":"220 14% 46%","blue":"221 62% 55%","indigo":"234 56% 58%","purple":"262 52% 56%","violet":"271 58% 55%","rose":"350 55% 52%","pink":"330 50% 55%","orange":"25 68% 50%","amber":"40 62% 44%","green":"152 48% 38%","teal":"172 50% 36%","cyan":"192 55% 42%"};
  var fs={"small":"14px","medium":"16px","large":"18px"};
  var t=localStorage.getItem("theme");
  if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");
  var f=localStorage.getItem("fontSize");
  if(f&&fs[f])d.style.setProperty("--font-base-size",fs[f]);
  var dn=localStorage.getItem("density");
  if(dn==="compact"){d.classList.add("density-compact");d.style.setProperty("--density-scale","0.875");}
  var a=localStorage.getItem("accentColor");
  if(a&&c[a]){
    d.style.setProperty("--primary",c[a]);
    d.style.setProperty("--primary-foreground","0 0% 98%");
  }
  if(localStorage.getItem("reducedMotion")==="true")d.classList.add("reduce-motion");
}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ViewportFix />
        <ThemeProvider>{children}</ThemeProvider>
        <PWARegister />
        <SonnerProvider />
        <ConfirmProvider />
        <ConnectionStatus />
        <InstallPrompt />
      </body>
    </html>
  )
}
