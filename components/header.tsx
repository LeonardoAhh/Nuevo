"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import NotificationBell from "@/components/notification-bell"

interface HeaderProps {
  title?: string
  isMobileView: boolean
  showMobileSidebar: boolean
  onOpenSidebar: () => void
}

export default function Header({ title, isMobileView, showMobileSidebar, onOpenSidebar }: HeaderProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-20 h-[50px] border-b bg-card/95 supports-[backdrop-filter]:bg-card/80 backdrop-blur px-3 sm:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-2 h-full">
        {isMobileView && !showMobileSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={onOpenSidebar}
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </Button>
        )}
        {title && (
          <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate min-w-0 flex-1">
            {title}
          </h1>
        )}

        <div className="ml-auto shrink-0">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
