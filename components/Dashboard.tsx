"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Sidebar, { useSidebar } from "@/components/sidebar"
import Header from "@/components/header"
import { useRole } from "@/lib/hooks"
import { EVALUADOR_ALLOWED_ROUTES } from "@/lib/hooks/useRole"

interface DashboardProps {
  content?: ReactNode
  pageTitle?: string
}

export default function Dashboard({ content, pageTitle }: DashboardProps) {
  const {
    collapsed,
    setCollapsed,
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
    const allowed = EVALUADOR_ALLOWED_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + '/')
    )
    if (!allowed) {
      router.replace('/desempeno')
    }
  }, [pathname, isEvaluador, roleLoading, router])

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido
      </a>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobileView={isMobileView}
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
      />

      <div className="flex-1 overflow-auto scrollbar-thin safe-right">
        <Header
          title={pageTitle}
          isMobileView={isMobileView}
          showMobileSidebar={showMobileSidebar}
          onOpenSidebar={openMobileSidebar}
        />

        <main
          id="main-content"
          className="bg-background px-3 py-6 sm:px-6 safe-bottom-content"
        >
          {content}
        </main>
      </div>
    </div>
  )
}
