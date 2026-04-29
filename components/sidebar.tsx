"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
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
  Settings,
  TrendingUp,
  UserPlus,
  X,
  ChevronsUpDown,
  LayoutGrid,
  BookOpen,
  Bot,
  Award,
  ImageIcon,
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
import { EVALUADOR_ALLOWED_ROUTES } from "@/lib/hooks/useRole"
import { notify } from "@/lib/notify"
import SignOutOverlay from "@/components/signout-overlay"

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

// ─── Theme icon helper ───────────────────────────────────────────────────────

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }
const THEME_NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" }
const THEME_LABEL: Record<Theme, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" }

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
  const { canEdit, isEvaluador } = useRole()
  const [signingOut, setSigningOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showExpanded = isMobileView || !collapsed

  const avatarFallback = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Usuario"

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      const { supabase } = await import("@/lib/supabase/client")
      await supabase.auth.signOut()
      notify.success("Sesión cerrada correctamente")
    } catch {
      // continue to redirect even on error — session should be cleared
    }
    // Give the overlay + toast ~900ms to animate in before hard redirect
    setTimeout(() => {
      window.location.href = "/login"
    }, 900)
  }

  const cycleTheme = () => setTheme(THEME_NEXT[theme])
  const ThemeIcon = THEME_ICON[theme]

  return (
    <TooltipProvider delayDuration={0}>
      {mounted && createPortal(<SignOutOverlay show={signingOut} />, document.body)}

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
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isMobileView ? "x" : collapsed ? "right" : "left"}
                initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="inline-flex"
              >
                {isMobileView ? <X size={16} /> : collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <div className="space-y-1 p-2">
            {NAV_SECTIONS.filter((s) => !s.devOnly || canEdit).map((section, idx) => {
              const sectionItems = isEvaluador
                ? section.items.filter((i) => EVALUADOR_ALLOWED_ROUTES.some((r) => i.href === r || i.href.startsWith(r + '/')))
                : section.items
              if (sectionItems.length === 0) return null
              const hasActiveItem = sectionItems.some((i) => i.href === pathname)

              // Icon-only mode (desktop collapsed): keep the existing flat
              // rendering — separator + icons with tooltips. No collapsing.
              if (!showExpanded) {
                return (
                  <div key={section.sectionLabel}>
                    {idx > 0 && <div className="mx-3 my-1 border-t" />}
                    <div className="space-y-1">
                      {sectionItems.map((item) => {
                        const active = pathname === item.href
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                className={`w-full justify-start px-2 ${
                                  active ? "border-l-4 border-primary bg-primary/10" : ""
                                }`}
                                aria-current={active ? "page" : undefined}
                                asChild
                              >
                                <Link href={item.href}>
                                  <item.icon size={18} className="mx-auto" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              // Single-item sections render as a plain link — an accordion
              // header for a single child is noise.
              if (sectionItems.length === 1) {
                const item = sectionItems[0]
                const active = pathname === item.href
                return (
                  <Button
                    key={section.sectionLabel}
                    variant="ghost"
                    className={`w-full justify-start ${
                      active ? "border-l-4 border-primary bg-primary/10" : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                    asChild
                  >
                    <Link
                      href={item.href}
                      onClick={() => isMobileView && setShowMobileSidebar(false)}
                    >
                      <item.icon size={18} className="mr-2" />
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                )
              }

              return (
                <CollapsibleSection
                  key={section.sectionLabel}
                  label={section.sectionLabel}
                  defaultOpen={hasActiveItem}
                >
                  {sectionItems.map((item) => {
                    const active = pathname === item.href
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={`w-full justify-start pl-8 text-sm ${
                          active ? "border-l-4 border-primary bg-primary/10" : ""
                        }`}
                        aria-current={active ? "page" : undefined}
                        asChild
                      >
                        <Link
                          href={item.href}
                          onClick={() => isMobileView && setShowMobileSidebar(false)}
                        >
                          <item.icon size={16} className="mr-2" />
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    )
                  })}
                </CollapsibleSection>
              )
            })}
          </div>
        </nav>

        {/* User menu */}
        <div className="p-2 border-t flex-shrink-0">
          <DropdownMenu>
            {showExpanded ? (
              <DropdownMenuTrigger asChild>
                <button
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block font-medium text-sm truncate">{displayName}</span>
                  </span>
                  <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex w-full items-center justify-center rounded-md py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={profile?.avatar || undefined} />
                        <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">{displayName}</TooltipContent>
              </Tooltip>
            )}

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
                aria-label={`Tema actual: ${THEME_LABEL[theme]}. Click para cambiar.`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="inline-flex"
                  >
                    <ThemeIcon size={16} />
                  </motion.span>
                </AnimatePresence>
                <span>Tema</span>
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
    </TooltipProvider>
  )
}

// ─── CollapsibleSection ──────────────────────────────────────────────────────

/**
 * Shadcn-style collapsible group used inside the sidebar. The section
 * remembers its open state in localStorage (scoped by label) so it survives
 * reloads. Animated via framer-motion height tween.
 */
function CollapsibleSection({
  label,
  defaultOpen,
  children,
}: {
  label: string
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const storageKey = `sidebar:section:${label}`
  const [open, setOpen] = useState(defaultOpen)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === "true" || stored === "false") setOpen(stored === "true")
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Whenever the active route forces this section to be open, respect that
  // without overwriting the user's manual preference for the other direction.
  useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, String(open))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hydrated])

  const contentId = `sidebar-section-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>{label}</span>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-flex text-muted-foreground"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-1 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
