"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import {
  Award, BookOpen, Bot, CalendarClock, ClipboardCheck,
  FileText, GraduationCap, ImageIcon, LayoutDashboard,
  LayoutGrid, ListChecks, MessageSquare, Settings,
  TrendingUp, UserPlus, X,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href:  string
  icon:  React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
}

interface NavSection {
  label:   string
  items:   NavItem[]
  devOnly?: boolean
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    label: "General",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Contratos",
    items: [{ label: "Nuevo Ingreso", href: "/ingresos", icon: UserPlus }],
  },
  {
    label: "Capacitación",
    items: [
      { label: "Capacitación",             href: "/capacitacion",          icon: GraduationCap },
      { label: "Calificaciones",           href: "/calificaciones",        icon: LayoutGrid    },
      { label: "Promociones",              href: "/promociones",           icon: TrendingUp    },
      { label: "Cumplimiento",             href: "/reportes",              icon: FileText      },
      { label: "Reporte Diario",           href: "/reporte-diario",        icon: CalendarClock },
      { label: "Evaluación Desempeño",     href: "/desempeno",             icon: Award         },
      { label: "Cumplimiento Evaluaciones",href: "/desempeno/cumplimiento",icon: ListChecks    },
      { label: "Exámenes",                 href: "/examenes",              icon: ClipboardCheck},
      { label: "WhatsApp Bot",             href: "/whatsapp",              icon: MessageSquare },
    ],
  },
  {
    label: "Público",
    items: [
      { label: "Cursos",        href: "/cursos",  icon: BookOpen  },
      { label: "Bot WhatsApp",  href: "/bot",     icon: Bot       },
      { label: "Eventos",       href: "/eventos", icon: ImageIcon },
    ],
  },
]

// ─── Animation variants ───────────────────────────────────────────────────────

const drawerVariants: Variants = {
  hidden:  { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit:    { x: "-100%", opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
}

const itemVariants: Variants = {
  hidden:  { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.025, duration: 0.2, ease: "easeOut" },
  }),
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface SidebarApi {
  isMobileView:     boolean
  showMobileSidebar: boolean
  openMobileSidebar: () => void
}

export function useSidebar(): SidebarApi & {
  setShowMobileSidebar: (v: boolean) => void
} {
  const [isMobileView,      setIsMobileView]      = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useLayoutEffect(() => {
    setIsMobileView(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(tid)
      tid = setTimeout(() => setIsMobileView(window.innerWidth < 768), 100)
    }
    window.addEventListener("resize", onResize)
    return () => { clearTimeout(tid); window.removeEventListener("resize", onResize) }
  }, [])

  const openMobileSidebar = useCallback(() => setShowMobileSidebar(true), [])

  return { isMobileView, showMobileSidebar, setShowMobileSidebar, openMobileSidebar }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Icon-only button used in the collapsed desktop sidebar */
function IconNavItem({ item, active, index }: { item: NavItem; active: boolean; index: number }) {
  return (
    <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={cn(
              "relative flex h-10 w-full items-center justify-center rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-indicator"
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <item.icon size={20} strokeWidth={active ? 1.75 : 2} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  )
}

/** Full-width link used in the mobile drawer */
function DrawerNavItem({
  item,
  active,
  index,
  onNavigate,
}: {
  item:       NavItem
  active:     boolean
  index:      number
  onNavigate: () => void
}) {
  return (
    <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-primary/10 font-medium text-primary"
            : "font-normal text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-indicator"
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        <item.icon size={18} strokeWidth={active ? 1.75 : 2} className="shrink-0" />
        {item.label}
      </Link>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SidebarProps {
  isMobileView:        boolean
  showMobileSidebar:   boolean
  setShowMobileSidebar: (v: boolean) => void
}

export default function Sidebar({
  isMobileView,
  showMobileSidebar,
  setShowMobileSidebar,
}: SidebarProps) {
  const pathname = usePathname()
  const { canEdit, isEvaluador, loading: roleLoading } = useRole()
  const closeMobile = () => setShowMobileSidebar(false)

  // Filter sections and items based on role
  const visibleSections = NAV_SECTIONS
    .filter((s) => {
      if (s.devOnly && !canEdit) return false
      if (isEvaluador) return s.items.some((item) => isEvaluadorAllowedRoute(item.href))
      return true
    })
    .map((s) => ({
      ...s,
      items: isEvaluador
        ? s.items.filter((item) => isEvaluadorAllowedRoute(item.href))
        : s.items,
    }))

  // Flat item list for stable stagger indices (no mutable counter in render)
  const flatItems = visibleSections.flatMap((s) => s.items)
  const indexOf   = (href: string) => flatItems.findIndex((i) => i.href === href)

  const isDesktop = !isMobileView

  return (
    <TooltipProvider delayDuration={0}>

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileView && showMobileSidebar && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeMobile}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar / Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {(isDesktop || showMobileSidebar) && (
          <motion.aside
            role="navigation"
            aria-label="Menú principal"
            className={cn(
              "flex flex-col border-r bg-card",
              // Mobile: fixed drawer
              isMobileView && "fixed left-0 top-0 z-50 w-64 shadow-xl",
              // Desktop: static icon strip
              isDesktop && "md:w-[68px]",
            )}
            style={{
              height:      isMobileView ? "100dvh"                          : undefined,
              paddingTop:  isMobileView ? "env(safe-area-inset-top, 0px)"   : undefined,
              paddingLeft: isMobileView ? "env(safe-area-inset-left, 0px)"  : undefined,
            }}
            {...(isMobileView
              ? { variants: drawerVariants, initial: "hidden", animate: "visible", exit: "exit" }
              : {}
            )}
          >
            {/* Logo bar */}
            <div className="flex h-[50px] shrink-0 items-center border-b px-2">
              {isMobileView ? (
                <div className="flex w-full items-center justify-between">
                  <span className="select-none text-lg font-bold tracking-tight">
                    <span className="text-primary">VIÑO</span>
                    <span className="text-foreground">PLASTIC</span>
                  </span>
                  <button
                    type="button"
                    onClick={closeMobile}
                    aria-label="Cerrar menú"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/"
                  aria-label="Ir al dashboard"
                  className="mx-auto select-none text-xl font-bold text-primary transition-opacity hover:opacity-75"
                >
                  V
                </Link>
              )}
            </div>

            {/* Nav items */}
            <nav
              className={cn(
                "flex-1 overflow-y-auto scrollbar-thin p-2 transition-opacity duration-200",
                roleLoading && "pointer-events-none opacity-0",
              )}
            >
              <div className="space-y-1">
                {visibleSections.map((section, sIdx) => (
                  <div key={section.label}>
                    {/* Section divider */}
                    {sIdx > 0 && (
                      isMobileView ? (
                        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {section.label}
                        </p>
                      ) : (
                        <div className="mx-2 my-1.5 border-t" />
                      )
                    )}

                    {/* Items */}
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isActive(pathname, item.href)
                        const idx    = indexOf(item.href)

                        return isMobileView ? (
                          <DrawerNavItem
                            key={item.href}
                            item={item}
                            active={active}
                            index={idx}
                            onNavigate={closeMobile}
                          />
                        ) : (
                          <IconNavItem
                            key={item.href}
                            item={item}
                            active={active}
                            index={idx}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            {/* Bottom: Settings (desktop) | safe-area spacer (mobile) */}
            {isDesktop ? (
              <div className="shrink-0 border-t p-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/settings"
                      aria-label="Configuración"
                      aria-current={pathname === "/settings" ? "page" : undefined}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        pathname === "/settings"
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <Settings
                        size={20}
                        strokeWidth={pathname === "/settings" ? 1.75 : 2}
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Configuración
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div
                className="shrink-0"
                style={{ height: "env(safe-area-inset-bottom, 0px)" }}
                aria-hidden="true"
              />
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}
