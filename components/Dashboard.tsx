"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Sidebar, { useSidebar } from "@/components/sidebar"
import Header from "@/components/header"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"
import { WorkspaceContainer } from "@/components/ui/workspace-container"
import { cn } from "@/lib/utils"


import { Loader2 } from "lucide-react"

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

  if (roleLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div 
      className="flex h-[100dvh] flex-col overflow-hidden bg-background md:flex-row"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Skip link accesible */}
      <a
        href="#main-content"
        className="sr-only transition-colors focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100]
                   focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2.5
                   focus:text-sm focus:font-semibold focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido
      </a>

      <Sidebar
        isMobileView={isMobileView}
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
        isEvaluador={isEvaluador}
      />

      {/* Área principal con scroll controlado */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden bg-card",
          "md:my-2 md:mr-2 md:rounded-xl md:border md:border-border",
        )}
      >
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
          <WorkspaceContainer className="py-5 sm:py-6 lg:py-8">
            <div className="min-w-0 space-y-6">
              {content}
            </div>
          </WorkspaceContainer>
        </main>
      </div>
    </div>
  )
}
