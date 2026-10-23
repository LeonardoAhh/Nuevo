"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Sidebar, { useSidebar } from "@/components/sidebar"
import Header from "@/components/header"
import { useRole, useUser } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"
import { WorkspaceContainer } from "@/components/ui/workspace-container"
import { SystemInfoFooter } from "@/components/system-info-footer"
import { cn } from "@/lib/utils"


import { AppTransition } from "@/components/app-transition"
import { MaintenanceNoticeDialog } from "@/components/maintenance-notice-dialog"
import { MaintenanceNoticeStatusContext } from "@/components/maintenance-notice-status"
import { MAINTENANCE_NOTICE_EXPIRES_AT, MAINTENANCE_NOTICE_PENDING_KEY } from "@/lib/maintenance-notice"

interface DashboardProps {
  content?: ReactNode
  pageTitle?: string
  headerTitleHref?: string
  headerTitleHrefLabel?: string
}

export default function Dashboard({ content, pageTitle, headerTitleHref, headerTitleHrefLabel }: DashboardProps) {
  const {
    showMobileSidebar,
    setShowMobileSidebar,
    openMobileSidebar,
  } = useSidebar()

  const pathname = usePathname()
  const router = useRouter()
  const { isEvaluador, loading: roleLoading } = useRole()
  const { user, loading: userLoading } = useUser()
  const [showMaintenanceNotice, setShowMaintenanceNotice] = useState<boolean | null>(null)

  useEffect(() => {
    if (roleLoading || !isEvaluador) return
    if (!isEvaluadorAllowedRoute(pathname ?? '')) {
      router.replace('/desempeno')
    }
  }, [pathname, isEvaluador, roleLoading, router])

  useEffect(() => {
    if (roleLoading || userLoading || !user || (isEvaluador && !isEvaluadorAllowedRoute(pathname ?? ""))) return

    try {
      const pending = sessionStorage.getItem(MAINTENANCE_NOTICE_PENDING_KEY) === "1"
      const active = Date.now() < Date.parse(MAINTENANCE_NOTICE_EXPIRES_AT)
      if (!active) sessionStorage.removeItem(MAINTENANCE_NOTICE_PENDING_KEY)
      setShowMaintenanceNotice(pending && active)
    } catch {
      setShowMaintenanceNotice(false)
    }
  }, [roleLoading, userLoading, user, isEvaluador, pathname])

  if (roleLoading) return <AppTransition message="Preparando tu espacio…" />

  return (
    <div 
      className="workspace-shell safe-top bg-background"
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

      {!isEvaluador && (
        <Sidebar
          showMobileSidebar={showMobileSidebar}
          setShowMobileSidebar={setShowMobileSidebar}
        />
      )}

      {/* El documento es el único scroll de la página. */}
      <div
        className={cn(
          "workspace-frame bg-card md:rounded-xl md:border md:border-border",
          isEvaluador && "workspace-frame--full-width",
        )}
      >
        <Header
          title={pageTitle}
          titleHref={headerTitleHref}
          titleHrefLabel={headerTitleHrefLabel}
          showMobileSidebar={showMobileSidebar}
          onOpenSidebar={openMobileSidebar}
          showSidebarToggle={!isEvaluador}
        />

        <main
          id="main-content"
          className="min-w-0 flex-1 safe-right safe-bottom-content"
        >
          <MaintenanceNoticeStatusContext.Provider value={showMaintenanceNotice}>
            <WorkspaceContainer className="py-5 sm:py-6 lg:py-8">
              <div className="min-w-0 space-y-6">
                {content}
              </div>
            </WorkspaceContainer>
          </MaintenanceNoticeStatusContext.Provider>
        </main>
        {isEvaluador && <SystemInfoFooter variant="workspace" />}
      </div>
      <MaintenanceNoticeDialog
        open={showMaintenanceNotice === true}
        onClose={() => {
          try {
            sessionStorage.removeItem(MAINTENANCE_NOTICE_PENDING_KEY)
          } catch {
            // The notice can still close when browser storage is unavailable.
          }
          setShowMaintenanceNotice(false)
        }}
        isEvaluador={isEvaluador}
      />
    </div>
  )
}
