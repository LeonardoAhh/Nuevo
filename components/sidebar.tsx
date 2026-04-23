"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Sun,
  Monitor,
  Paintbrush,
  Settings,
  TrendingUp,
  UserPlus,
  X,
  ChevronsUpDown,
  Menu,
  LayoutGrid,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, type Theme } from "@/components/theme-context"
import { useUser, useProfile, useRole } from "@/lib/hooks"
import { notify } from "@/lib/notify"

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
      { label: "Exámenes", href: "/examenes", icon: ClipboardCheck },
      { label: "WhatsApp Bot", href: "/whatsapp", icon: MessageSquare },
    ],
  },
  {
    sectionLabel: "Edición",
    items: [{ label: "Flayers", href: "/flayers", icon: Paintbrush }],
  },
  {
    sectionLabel: "Público",
    items: [{ label: "Cursos", href: "/cursos", icon: BookOpen }],
  },
]

// ─── Theme icon helper ───────────────────────────────────────────────────────

const THEME_ICON: Record<Theme, typeof Sun> = { light: Moon, dark: Sun, system: Monitor }
const THEME_NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" }
const THEME_LABEL: Record<Theme, string> = { light: "Oscuro", dark: "Sistema", system: "Claro" }

// ─── Component ───────────────────────────────────────────────────────────────

export interface SidebarApi {
  isMobileView: boolean
  showMobileSidebar: boolean
  openMobileSidebar: () => void
}

export function useSidebar(): SidebarApi & {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  setShowMobileSidebar: (v: boolean) => void
} {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useLayoutEffect(() => {
    setCollapsed(localStorage.getItem("sidebarCollapsed") === "true")
    setIsMobileView(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(collapsed))
  }, [collapsed])

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

  return { collapsed, setCollapsed, isMobileView, showMobileSidebar, setShowMobileSidebar, openMobileSidebar }
}

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  isMobileView: boolean
  showMobileSidebar: boolean
  setShowMobileSidebar: (v: boolean) => void
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  isMobileView,
  showMobileSidebar,
  setShowMobileSidebar,
}: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const { profile } = useProfile(user?.id)
  const { canEdit } = useRole()

  const showExpanded = isMobileView || !collapsed

  const avatarFallback = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Usuario"

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase/client")
    await supabase.auth.signOut()
    notify.success("Sesión cerrada correctamente")
    setTimeout(() => {
      window.location.href = "/login"
    }, 1200)
  }

  const cycleTheme = () => setTheme(THEME_NEXT[theme])
  const ThemeIcon = THEME_ICON[theme]

  return (
    <>
      {/* Backdrop */}
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
          bg-card border-r transition-all duration-300 flex flex-col
          max-md:fixed max-md:z-50 max-md:h-[100dvh] max-md:shadow-lg max-md:w-64
          max-md:-translate-x-full max-md:overflow-hidden
          ${showMobileSidebar ? "max-md:translate-x-0" : ""}
          ${collapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        {/* Logo / collapse toggle */}
        <div className="p-2 h-[50px] border-b flex items-center justify-between">
          <div className="flex items-center">
            {showExpanded ? (
              <span className="text-lg font-bold tracking-tight select-none">
                <span className="text-primary">VIÑO</span>
                <span className="text-foreground">PLASTIC</span>
              </span>
            ) : (
              <span className="text-lg font-bold text-primary select-none mx-auto">V</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={isMobileView ? "Cerrar menú" : collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            onClick={() =>
              isMobileView ? setShowMobileSidebar(false) : setCollapsed(!collapsed)
            }
          >
            {isMobileView ? <X size={16} /> : collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <div className="space-y-3 p-2">
            {NAV_SECTIONS.filter((s) => !s.devOnly || canEdit).map((section, idx) => (
              <div key={section.sectionLabel}>
                {showExpanded ? (
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.sectionLabel}
                    </span>
                  </div>
                ) : (
                  idx > 0 && <div className="mx-3 my-1 border-t" />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = pathname === item.href
                    return (
                      <TooltipProvider key={item.href} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              className={`w-full justify-start ${showExpanded ? "" : "px-2"} ${
                                active ? "border-l-4 border-primary bg-primary/10" : ""
                              }`}
                              aria-current={active ? "page" : undefined}
                              asChild
                            >
                              <Link
                                href={item.href}
                                onClick={() => isMobileView && setShowMobileSidebar(false)}
                              >
                                <item.icon size={18} className={showExpanded ? "mr-2" : "mx-auto"} />
                                {showExpanded && <span>{item.label}</span>}
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {!showExpanded && <TooltipContent side="right">{item.label}</TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User menu */}
        <div className="p-2 border-t flex-shrink-0">
          <DropdownMenu>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`
                        flex items-center rounded-md text-sm transition-colors
                        hover:bg-accent hover:text-accent-foreground
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${showExpanded ? "w-full gap-3 px-2 py-2" : "justify-center w-full py-2"}
                      `}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={profile?.avatar || undefined} />
                        <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                      </Avatar>
                      {showExpanded && (
                        <>
                          <span className="flex-1 min-w-0 text-left">
                            <span className="block font-medium text-sm truncate">{displayName}</span>
                          </span>
                          <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground" />
                        </>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {!showExpanded && <TooltipContent side="right">{displayName}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
              <DropdownMenuLabel asChild>
                <div className="flex items-center gap-3 px-2 py-2 cursor-default select-none">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">{displayName}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                asChild
                className={
                  pathname === "/settings"
                    ? "bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary"
                    : ""
                }
              >
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings size={16} />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); cycleTheme() }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ThemeIcon size={16} />
                <span>Apariencia</span>
                <span className="ml-auto text-xs text-muted-foreground">{THEME_LABEL[theme]}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
