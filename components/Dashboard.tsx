"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Sidebar, { useSidebar } from "@/components/sidebar"
import Header from "@/components/header"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"
import { WhatsNewWizard } from "@/components/whats-new-wizard"

interface DashboardProps {
  content?: ReactNode
  pageTitle?: string
}

export default function Dashboard({ content, pageTitle }: DashboardProps) {
  const {
    isMobileView,
    showMobileSidebar,
    setShowMobileSidebar,
    openMobileSidebar,
  } = useSidebar()

  const pathname = usePathname()
  const router = useRouter()
  const { isEvaluador, loading: roleLoading } = useRole()

  useEffect(() => {
    if (roleLoading || !isEvaluador) return
    if (!isEvaluadorAllowedRoute(pathname ?? '')) {
      router.replace('/desempeno')
    }
  }, [pathname, isEvaluador, roleLoading, router])

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background overflow-hidden">
      {/* Skip link accesible */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]
                   focus:rounded-lg focus:bg-card focus:px-4 focus:py-2.5
                   focus:text-sm focus:font-semibold focus:shadow-xl focus:ring-2 focus:ring-ring
                   focus:border focus:border-border transition-all"
      >
        Saltar al contenido
      </a>

      <Sidebar
        isMobileView={isMobileView}
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
      />

      {/* Área principal con scroll controlado */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        <Header
          title={pageTitle}
          isMobileView={isMobileView}
          showMobileSidebar={showMobileSidebar}
          onOpenSidebar={openMobileSidebar}
        />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin safe-right safe-bottom-content"
        >
          {/* Contenedor de contenido con ancho máximo para legibilidad */}
          <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-6 lg:px-8 py-6">

            {/* Wizard de novedades: ahora como banner sutil integrado (solo en inicio) */}
            {pathname === '/' && (
              <div className="mb-6">
                <WhatsNewWizard />
              </div>
            )}

            {/* Contenido dinámico de la página */}
            <div className="space-y-6">
              {content}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
