import type React from "react"
import type { Metadata, Viewport } from "next"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-context"
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
      <head>
        {/* Apply theme settings synchronously before React hydrates to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var c={"blue":"221.2 83.2% 53.3%","purple":"262.1 83.3% 57.8%","green":"142.1 76.2% 36.3%","orange":"24.6 95% 53.1%","pink":"339 90.6% 51.8%","yellow":"47.9 95.8% 53.1%"};
  var cf={"blue":"210 40% 98%","purple":"210 40% 98%","green":"355.7 100% 97.3%","orange":"355.7 100% 97.3%","pink":"355.7 100% 97.3%","yellow":"26 83.3% 14.1%"};
  var fs={"small":"14px","medium":"16px","large":"18px"};
  var t=localStorage.getItem("theme");
  if(t==="dark")document.documentElement.classList.add("dark");
  var f=localStorage.getItem("fontSize");
  if(f&&fs[f])document.documentElement.style.fontSize=fs[f];
  var a=localStorage.getItem("accentColor");
  if(a==="custom"){
    var hex=(localStorage.getItem("customColor")||"").replace("#","");
    if(/^[0-9a-f]{6}$/i.test(hex)){
      var r=parseInt(hex.slice(0,2),16)/255,g=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255;
      var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s=0,l=(mx+mn)/2;
      if(mx!==mn){var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}
      document.documentElement.style.setProperty("--primary",Math.round(h*360)+" "+Math.round(s*100)+"% "+Math.round(l*100)+"%");
    }
  }else if(a&&c[a]){
    document.documentElement.style.setProperty("--primary",c[a]);
    document.documentElement.style.setProperty("--primary-foreground",cf[a]);
  }
  if(localStorage.getItem("reducedMotion")==="true")document.documentElement.classList.add("reduce-motion");
}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <PWARegister />
      </body>
    </html>
  )
}
