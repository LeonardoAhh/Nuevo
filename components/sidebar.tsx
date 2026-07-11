"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import {
  Award, BookOpen, CalendarRange, ChevronRight, ClipboardCheck,
  FileText, GraduationCap, ImageIcon, LayoutDashboard,
  LayoutGrid, ListChecks, Settings,
  TrendingUp, UserPlus, X, FileWarning, FileCheck2, ChevronsUpDown, LogOut, Briefcase
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavSubItem {
  label: string
  href:  string
}

interface NavParent {
  label:   string
  href?:   string
  icon:    React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  items?:  NavSubItem[]
  devOnly?: boolean
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_PARENTS: NavParent[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Personal",
    icon: UserPlus,
    items: [
      { label: "Nuevo Ingreso", href: "/ingresos" },
      { label: "Recontratación", href: "/recontratacion" },
      { label: "Ingresos Semanales", href: "/ingresos-semanales" },
    ]
  },
  {
    label: "Capacitación",
    icon: GraduationCap,
    items: [
      { label: "Base Capacitación", href: "/capacitacion" },
      { label: "Base Categorias", href: "/promociones" },
      { label: "Genera Exámenes", href: "/examenes" },
      { label: "Matriz de habilidades", href: "/reportes" },
    ],
  },
  {
    label: "Desempeño",
    icon: Award,
    items: [
      { label: "Evaluación Desempeño", href: "/desempeno" },
      { label: "Cumplimiento Evaluaciones", href: "/desempeno/cumplimiento" },
      { label: "Seguimiento Compromisos", href: "/desempeno/seguimiento" },
      { label: "Guía Evaluador", href: "/guia-evaluador" },
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
function IconNavItem({ parent, active, index }: { parent: NavParent; active: boolean; index: number }) {
  const content = (
    <div
      className={cn(
        "relative flex h-10 w-full items-center justify-center rounded-md transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
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
      <parent.icon size={20} strokeWidth={active ? 1.75 : 2} />
    </div>
  )

  if (!parent.items?.length && parent.href) {
    return (
      <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={parent.href} aria-label={parent.label}>
              {content}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {parent.label}
          </TooltipContent>
        </Tooltip>
      </motion.div>
    )
  }

  return (
    <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              {content}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {parent.label}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-56 rounded-xl border-border/50 bg-background/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-1.5">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{parent.label}</DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-1" />
          {parent.items?.map(sub => (
            <DropdownMenuItem key={sub.href} asChild className="rounded-lg cursor-pointer">
              <Link href={sub.href} className="w-full flex items-center justify-between">
                {sub.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

/** Full-width link/accordion used in the mobile drawer */
function DrawerNavItem({
  parent,
  pathname,
  onNavigate,
  index,
}: {
  parent:     NavParent
  pathname:   string
  onNavigate: () => void
  index:      number
}) {
  if (!parent.items?.length && parent.href) {
    const active = isActive(pathname, parent.href)
    return (
      <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible">
        <Link
          href={parent.href}
          onClick={onNavigate}
          className={cn(
            "relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition-colors",
            active ? "bg-primary/10 font-medium text-primary" : "font-normal text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <parent.icon size={18} strokeWidth={active ? 1.75 : 2} className="shrink-0" />
          {parent.label}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible" className="py-2">
      <div className="flex items-center gap-3 px-3 py-1 text-sm font-medium text-foreground">
        <parent.icon size={18} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
        {parent.label}
      </div>
      <div className="mt-1 ml-9 flex flex-col gap-1 border-l border-border/50 pl-2">
        {parent.items?.map(sub => {
          const active = isActive(pathname, sub.href)
          return (
            <Link
              key={sub.href}
              href={sub.href}
              onClick={onNavigate}
              className={cn(
                "flex h-8 w-full items-center rounded-md px-3 text-sm transition-colors",
                active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              {sub.label}
            </Link>
          )
        })}
      </div>
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
  const visibleParents = NAV_PARENTS
    .filter((p) => {
      if (p.devOnly && !canEdit) return false
      if (isEvaluador) {
        if (p.href && isEvaluadorAllowedRoute(p.href)) return true
        if (p.items?.some((item) => isEvaluadorAllowedRoute(item.href))) return true
        return false
      }
      return true
    })
    .map((p) => ({
      ...p,
      items: isEvaluador && p.items
        ? p.items.filter((item) => isEvaluadorAllowedRoute(item.href))
        : p.items,
    }))

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
            <div className="flex h-[50px] shrink-0 items-center justify-center border-b px-2">
              {isMobileView ? (
                <div className="flex w-full items-center justify-between">
                  <span className="select-none text-lg font-bold tracking-tight px-2">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-10 w-full items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                      <Briefcase className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={16} className="w-56 rounded-xl border-border/50 bg-background/80 backdrop-blur-xl shadow-xl p-1.5">
                    <div className="px-2 py-2 flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold leading-none">VIÑOPLASTIC</span>
                        <span className="text-xs text-muted-foreground mt-1">Enterprise</span>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Nav items */}
            <nav
              className={cn(
                "flex-1 overflow-y-auto scrollbar-thin p-2 transition-opacity duration-200 mt-2",
                roleLoading && "pointer-events-none opacity-0",
              )}
            >
              <div className="space-y-1">
                {visibleParents.map((parent, pIdx) => {
                  const active = parent.href
                    ? isActive(pathname, parent.href)
                    : parent.items?.some(sub => isActive(pathname, sub.href)) ?? false

                  return isMobileView ? (
                    <DrawerNavItem
                      key={parent.label}
                      parent={parent}
                      pathname={pathname}
                      onNavigate={closeMobile}
                      index={pIdx}
                    />
                  ) : (
                    <IconNavItem
                      key={parent.label}
                      parent={parent}
                      active={active}
                      index={pIdx}
                    />
                  )
                })}
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
