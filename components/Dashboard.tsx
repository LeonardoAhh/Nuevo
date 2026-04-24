"use client"

import type { ReactNode } from "react"
import Sidebar, { useSidebar } from "@/components/sidebar"
import Header from "@/components/header"

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

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobileView={isMobileView}
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
      />

      <div className="flex-1 overflow-auto scrollbar-thin">
        <Header
          title={pageTitle}
          isMobileView={isMobileView}
          showMobileSidebar={showMobileSidebar}
          onOpenSidebar={openMobileSidebar}
        />

        <main className="px-3 sm:px-6 py-6 bg-background">
          {content}
        </main>
      </div>
    </div>
  )
}
