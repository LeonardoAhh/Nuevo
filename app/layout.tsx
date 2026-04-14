import type React from "react"
import type { Metadata, Viewport } from "next"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-context"
import { PWARegister } from "@/components/pwa-register"
import { SonnerProvider } from "@/components/ui/sonner-provider"

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)",  color: "#1e40af" },
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
    statusBarStyle: "default",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Apply theme settings synchronously before React hydrates to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var d=document.documentElement;
  var c={"blue":"221.2 83.2% 53.3%","purple":"262.1 83.3% 57.8%","green":"142.1 76.2% 36.3%","orange":"24.6 95% 53.1%","pink":"339 90.6% 51.8%","yellow":"47.9 95.8% 53.1%"};
  var cf={"blue":"210 40% 98%","purple":"210 40% 98%","green":"355.7 100% 97.3%","orange":"355.7 100% 97.3%","pink":"355.7 100% 97.3%","yellow":"26 83.3% 14.1%"};
  var fs={"small":"14px","medium":"16px","large":"18px"};
  var t=localStorage.getItem("theme");
  if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");
  var f=localStorage.getItem("fontSize");
  if(f&&fs[f])d.style.setProperty("--font-base-size",fs[f]);
  var dn=localStorage.getItem("density");
  if(dn==="compact"){d.classList.add("density-compact");d.style.setProperty("--density-scale","0.875");}
  var a=localStorage.getItem("accentColor");
  if(a==="custom"){
    var hex=(localStorage.getItem("customColor")||"").replace("#","");
    if(/^[0-9a-f]{6}$/i.test(hex)){
      var r=parseInt(hex.slice(0,2),16)/255,g=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255;
      var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s=0,l=(mx+mn)/2;
      if(mx!==mn){var dd=mx-mn;s=l>0.5?dd/(2-mx-mn):dd/(mx+mn);if(mx===r)h=(g-b)/dd+(g<b?6:0);else if(mx===g)h=(b-r)/dd+2;else h=(r-g)/dd+4;h/=6;}
      d.style.setProperty("--primary",Math.round(h*360)+" "+Math.round(s*100)+"% "+Math.round(l*100)+"%");
      var br=(0.299*r+0.587*g+0.114*b);
      d.style.setProperty("--primary-foreground",br>0.5?"222.2 84% 4.9%":"210 40% 98%");
    }
  }else if(a&&c[a]){
    d.style.setProperty("--primary",c[a]);
    d.style.setProperty("--primary-foreground",cf[a]);
  }
  if(localStorage.getItem("reducedMotion")==="true")d.classList.add("reduce-motion");
}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <PWARegister />
        <SonnerProvider />
      </body>
    </html>
  )
}
