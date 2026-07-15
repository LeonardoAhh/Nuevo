"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import {
  Award, BookOpen, CalendarRange, ChevronRight, ClipboardCheck,
  FileText, GraduationCap, ImageIcon, LayoutDashboard,
  LayoutGrid, ListChecks, Settings,
  TrendingUp, UserPlus, X, FileWarning, FileCheck2, ChevronsUpDown, LogOut, Briefcase, ChevronDown, ChevronsLeft, ChevronsRight, User
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
      { label: "Ingresos", href: "/ingresos" },
      { label: "Recontratación", href: "/recontratacion" },
    ]
  },
  {
    label: "Capacitación",
    icon: GraduationCap,
    items: [
      { label: "Empleados", href: "/capacitacion" },
      { label: "Categorías", href: "/promociones" },
      { label: "Exámenes", href: "/examenes" },
      { label: "Matriz Habilidades", href: "/reportes" },
    ],
  },
  {
    label: "Desempeño",
    icon: Award,
    items: [
      { label: "Evaluaciones", href: "/desempeno" },
      { label: "Cumplimiento", href: "/desempeno/cumplimiento" },
      { label: "Compromisos", href: "/desempeno/seguimiento" },
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

const accordionVariants: Variants = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: { height: "auto", opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
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

function DesktopNavItem({ parent, pathname, isExpanded, index }: { parent: NavParent; pathname: string; isExpanded: boolean; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  const activeSubHref = parent.items
    ?.filter(sub => isActive(pathname, sub.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  const active = parent.href
    ? isActive(pathname, parent.href)
    : !!activeSubHref

  useEffect(() => {
    if (active) setIsOpen(true)
  }, [active])

  const content = (
    <button
      type={parent.href ? "button" : "button"}
      onClick={() => { if (!parent.href && isExpanded) setIsOpen(!isOpen) }}
      className={cn(
        "relative flex h-10 w-full items-center rounded-md transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
        isExpanded ? "px-3 justify-between" : "justify-center",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {active && !isExpanded && (
        <motion.span
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <div className="flex items-center gap-3">
        <parent.icon size={20} strokeWidth={active ? 1.75 : 2} className="shrink-0" />
        {isExpanded && <span className={cn("text-sm whitespace-nowrap", active ? "font-medium" : "font-normal")}>{parent.label}</span>}
      </div>
      {isExpanded && parent.items?.length && (
        <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
      )}
    </button>
  )

  const wrappedContent = parent.href ? (
    <Link href={parent.href} aria-label={parent.label} className="block w-full">
      {content}
    </Link>
  ) : content

  if (isExpanded) {
    return (
      <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible" className="flex flex-col gap-1 mb-1">
        {wrappedContent}
        {parent.items?.length && (
          <AnimatePresence>
            {isOpen && (
              <motion.div variants={accordionVariants} initial="hidden" animate="visible" exit="exit" className="pl-9 pr-2 space-y-1 overflow-hidden">
                {parent.items.map(sub => {
                  const subActive = sub.href === activeSubHref
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        "flex h-8 w-full items-center rounded-md px-3 text-sm transition-colors whitespace-nowrap",
                        subActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                      )}
                    >
                      {sub.label}
                    </Link>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    )
  }

  // Collapsed state (Icons + Tooltip + Dropdown)
  if (!parent.items?.length && parent.href) {
    return (
      <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible">
        <Tooltip>
          <TooltipTrigger asChild>
            {wrappedContent}
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
              {wrappedContent}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {parent.label}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-56 rounded-xl border-border/50 bg-background/80 backdrop-blur-xl shadow-xl p-1.5">
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

function DrawerNavItem({ parent, pathname, onNavigate, index }: { parent: NavParent; pathname: string; onNavigate: () => void; index: number }) {
  const activeSubHref = parent.items
    ?.filter(sub => isActive(pathname, sub.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

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
          const active = sub.href === activeSubHref
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
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_expanded")
    if (saved !== null) setIsExpanded(saved === "true")
  }, [])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => {
      const next = !prev
      localStorage.setItem("sidebar_expanded", String(next))
      return next
    })
  }, [])

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

      <AnimatePresence>
        {(isDesktop || showMobileSidebar) && (
          <motion.aside
            role="navigation"
            aria-label="Menú principal"
            className={cn(
              "flex flex-col border-r bg-card transition-[width] duration-300 ease-in-out",
              isMobileView && "fixed left-0 top-0 z-50 w-64 shadow-xl",
              isDesktop && (isExpanded ? "w-[260px]" : "w-[68px]"),
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
            <div className="flex h-[50px] shrink-0 items-center border-b px-2 overflow-hidden">
              {isMobileView ? (
                <div className="flex w-full items-center justify-between">
                  <span className="select-none text-lg font-bold tracking-tight px-2 whitespace-nowrap">
                    <span className="text-primary">VIÑO</span>
                    <span className="text-foreground">PLASTIC</span>
                  </span>
                  <button
                    type="button"
                    onClick={closeMobile}
                    aria-label="Cerrar menú"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full h-full px-2">
                  {isExpanded && (
                    <Link href="/" className="flex items-center gap-3 outline-none rounded-md focus-visible:ring-2 focus-visible:ring-ring">
                      <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <span className="select-none text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden">
                        <span className="text-primary">VIÑO</span>
                        <span className="text-foreground">PLASTIC</span>
                      </span>
                    </Link>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleExpanded}
                        className={cn(
                          "flex h-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground shrink-0",
                          isExpanded ? "w-8" : "w-full"
                        )}
                      >
                        {isExpanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{isExpanded ? "Colapsar menú" : "Expandir menú"}</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Nav items */}
            <nav
              className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-2 transition-opacity duration-200 mt-2",
                roleLoading && "pointer-events-none opacity-0",
              )}
            >
              <div className={cn("space-y-1", isExpanded ? "px-1" : "")}>
                {visibleParents.map((parent, pIdx) => {
                  return isMobileView ? (
                    <DrawerNavItem
                      key={parent.label}
                      parent={parent}
                      pathname={pathname}
                      onNavigate={closeMobile}
                      index={pIdx}
                    />
                  ) : (
                    <DesktopNavItem
                      key={parent.label}
                      parent={parent}
                      pathname={pathname}
                      isExpanded={isExpanded}
                      index={pIdx}
                    />
                  )
                })}
              </div>
            </nav>

            {/* Mobile safe area spacer */}
            {!isDesktop && (
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
