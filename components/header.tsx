"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      className="bg-card border-b px-3 sm:px-6 p-2 min-h-[50px] sticky top-0 z-20"
    >
      <div className="flex items-center gap-2">
        {isMobileView && !showMobileSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenSidebar}
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </Button>
        )}
        {title && (
          <h1 className="text-lg sm:text-xl font-semibold truncate">{title}</h1>
        )}
      </div>
    </header>
  )
}
