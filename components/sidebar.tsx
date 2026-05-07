"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  TrendingUp,
  UserPlus,
  X,
  LayoutGrid,
  BookOpen,
  Bot,
  Award,
  ImageIcon,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRole } from "@/lib/hooks"
import { EVALUADOR_ALLOWED_ROUTES } from "@/lib/hooks/useRole"

// ─── Nav config ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface NavSection {
  sectionLabel: string
  items: NavItem[]
  devOnly?: boolean
}

const NAV_SECTIONS: NavSection[] = [
  {
    sectionLabel: "General",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    sectionLabel: "Contratos",
    items: [{ label: "Nuevo Ingreso", href: "/ingresos", icon: UserPlus }],
  },
  {
    sectionLabel: "Capacitación",
    items: [
      { label: "Capacitación", href: "/capacitacion", icon: GraduationCap },
      { label: "Calificaciones", href: "/calificaciones", icon: LayoutGrid },
      { label: "Promociones", href: "/promociones", icon: TrendingUp },
      { label: "Reportes", href: "/reportes", icon: FileText },
      { label: "Evaluación Desempeño", href: "/desempeno", icon: Award },
      { label: "Exámenes", href: "/examenes", icon: ClipboardCheck },
      { label: "WhatsApp Bot", href: "/whatsapp", icon: MessageSquare },
    ],
  },
  {
    sectionLabel: "Público",
    items: [
      { label: "Cursos", href: "/cursos", icon: BookOpen },
      { label: "Bot WhatsApp", href: "/bot", icon: Bot },
      { label: "Eventos", href: "/eventos", icon: ImageIcon },
    ],
  },
]

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface SidebarApi {
  isMobileView: boolean
  showMobileSidebar: boolean
  openMobileSidebar: () => void
}

export function useSidebar(): SidebarApi & {
  setShowMobileSidebar: (v: boolean) => void
} {
  const [isMobileView, setIsMobileView] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useLayoutEffect(() => {
    setIsMobileView(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => setIsMobileView(window.innerWidth < 768), 100)
    }
    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const openMobileSidebar = useCallback(() => setShowMobileSidebar(true), [])

  return { isMobileView, showMobileSidebar, setShowMobileSidebar, openMobileSidebar }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SidebarProps {
  isMobileView: boolean
  showMobileSidebar: boolean
  setShowMobileSidebar: (v: boolean) => void
}

export default function Sidebar({
  isMobileView,
  showMobileSidebar,
  setShowMobileSidebar,
}: SidebarProps) {
  const pathname = usePathname()
  const { canEdit, isEvaluador } = useRole()

  const isItemAllowed = (href: string) =>
    !isEvaluador || EVALUADOR_ALLOWED_ROUTES.some((r) => href === r || href.startsWith(r + '/'))

  const isExpanded = isMobileView

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      {isMobileView && showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileSidebar(false)}
          aria-hidden="true"
        />
      )}

      <aside
        role="navigation"
        aria-label="Menú principal"
        className={`
          bg-card border-r transition-all duration-300 flex flex-col safe-top safe-left safe-bottom
          max-md:fixed max-md:z-50 max-md:top-0 max-md:bottom-0 max-md:left-0 max-md:shadow-lg max-md:w-64
          max-md:-translate-x-full max-md:overflow-hidden
          ${showMobileSidebar ? "max-md:translate-x-0" : ""}
          md:w-[68px]
        `}
      >
        {/* Logo */}
        <div className="h-[50px] border-b flex items-center justify-center px-2">
          {isExpanded ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-lg font-bold tracking-tight select-none">
                <span className="text-primary">VIÑO</span>
                <span className="text-foreground">PLASTIC</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Cerrar menú"
                onClick={() => setShowMobileSidebar(false)}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <Link
              href="/"
              className="text-xl font-bold text-primary select-none hover:opacity-80 transition-opacity"
            >
              V
            </Link>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <div className="space-y-1 p-2">
            {NAV_SECTIONS.filter((s) => !s.devOnly || canEdit).map((section, idx) => {
              const sectionItems = section.items

              if (!isExpanded) {
                return (
                  <div key={section.sectionLabel}>
                    {idx > 0 && <div className="mx-2 my-2 border-t" />}
                    <div className="space-y-1">
                      {sectionItems.map((item) => {
                        const active = pathname === item.href
                        const allowed = isItemAllowed(item.href)
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              {allowed ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`w-full h-10 ${
                                    active
                                      ? "bg-primary/10 text-primary border-l-[3px] border-primary rounded-l-none"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                  }`}
                                  aria-current={active ? "page" : undefined}
                                  asChild
                                >
                                  <Link href={item.href}>
                                    <item.icon size={20} />
                                  </Link>
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-full h-10 opacity-30 cursor-not-allowed"
                                  disabled
                                >
                                  <item.icon size={20} />
                                </Button>
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {allowed ? item.label : `${item.label} (sin acceso)`}
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              return (
                <div key={section.sectionLabel}>
                  {idx > 0 && (
                    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.sectionLabel}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {sectionItems.map((item) => {
                      const active = pathname === item.href
                      const allowed = isItemAllowed(item.href)
                      return allowed ? (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className={`w-full justify-start gap-3 ${
                            active
                              ? "bg-primary/10 text-primary border-l-[3px] border-primary rounded-l-none"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          aria-current={active ? "page" : undefined}
                          asChild
                        >
                          <Link
                            href={item.href}
                            onClick={() => setShowMobileSidebar(false)}
                          >
                            <item.icon size={18} />
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className="w-full justify-start gap-3 opacity-30 cursor-not-allowed"
                          disabled
                        >
                          <item.icon size={18} />
                          <span className="text-sm">{item.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        {/* Bottom: Settings icon (desktop only) */}
        {!isExpanded && (
          <div className="border-t p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-full h-10 ${
                    pathname === "/settings"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                  asChild
                >
                  <Link href="/settings">
                    <Settings size={20} />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Configuración
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
