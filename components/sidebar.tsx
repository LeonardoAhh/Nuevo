"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "framer-motion"
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
  CalendarClock,
  ListChecks,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"

// ─── Nav config ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string; fill?: string; strokeWidth?: number }>
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
      { label: "Cumplimiento", href: "/reportes", icon: FileText },
      { label: "Reporte Diario", href: "/reporte-diario", icon: CalendarClock },
      { label: "Evaluación Desempeño", href: "/desempeno", icon: Award },
      { label: "Cumplimiento Evaluaciones", href: "/desempeno/cumplimiento", icon: ListChecks },
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

// ─── Animation variants ──────────────────────────────────────────────────────

const sidebarVariants: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: "-100%", opacity: 0, transition: { duration: 0.2 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.25, ease: "easeOut" },
  }),
}

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
  const { canEdit, isEvaluador, loading: roleLoading } = useRole()

  const isItemVisible = (href: string) =>
    !isEvaluador || isEvaluadorAllowedRoute(href)

  const visibleSections = NAV_SECTIONS
    .filter((s) => {
      if (s.devOnly && !canEdit) return false
      if (isEvaluador) return s.items.some((item) => isItemVisible(item.href))
      return true
    })
    .map((section) => ({
      ...section,
      items: isEvaluador
        ? section.items.filter((item) => isItemVisible(item.href))
        : section.items,
    }))

  const isExpanded = isMobileView

  // Flatten items for stagger index
  let globalIdx = 0

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileView && showMobileSidebar && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileSidebar(false)}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(!isMobileView || showMobileSidebar) && (
          <motion.aside
            role="navigation"
            aria-label="Menú principal"
            className={`
              bg-card border-r flex flex-col
              max-md:fixed max-md:z-50 max-md:top-0 max-md:left-0 max-md:shadow-lg max-md:w-64
              max-md:overflow-hidden
              md:w-[68px]
            `}
            style={{
              height: isMobileView ? "100dvh" : undefined,
              paddingTop: isMobileView ? "env(safe-area-inset-top, 0px)" : undefined,
              paddingLeft: isMobileView ? "env(safe-area-inset-left, 0px)" : undefined,
            }}
            {...(isMobileView ? { variants: sidebarVariants, initial: "hidden", animate: "visible", exit: "exit" } : {})}
          >
            {/* Logo */}
            <div className="h-[50px] shrink-0 border-b flex items-center justify-center px-2">
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
            <nav className={`flex-1 min-h-0 overflow-y-auto scrollbar-thin transition-opacity duration-200 ${roleLoading ? "opacity-0" : "opacity-100"}`}>
              <div className="space-y-1 p-2">
                {visibleSections.map((section, idx) => {
                  const sectionItems = section.items

                  if (!isExpanded) {
                    return (
                      <div key={section.sectionLabel}>
                        {idx > 0 && <div className="mx-2 my-2 border-t" />}
                        <div className="space-y-1">
                          {sectionItems.map((item) => {
                            const active = pathname === item.href
                            const i = globalIdx++
                            return (
                              <motion.div
                                key={item.href}
                                custom={i}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`relative w-full h-10 transition-colors ${active
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                        }`}
                                      aria-current={active ? "page" : undefined}
                                      asChild
                                    >
                                      <Link href={item.href}>
                                        {active && (
                                          <motion.div
                                            layoutId="sidebar-active-indicator"
                                            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-primary"
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                          />
                                        )}
                                        <item.icon
                                          size={20}
                                          fill={active ? "currentColor" : "none"}
                                          strokeWidth={active ? 1.5 : 2}
                                        />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="font-medium">
                                    {item.label}
                                  </TooltipContent>
                                </Tooltip>
                              </motion.div>
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
                          const i = globalIdx++
                          return (
                            <motion.div
                              key={item.href}
                              custom={i}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              <Button
                                variant="ghost"
                                className={`relative w-full justify-start gap-3 transition-colors ${active
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:text-foreground"
                                  }`}
                                aria-current={active ? "page" : undefined}
                                asChild
                              >
                                <Link
                                  href={item.href}
                                  onClick={() => setShowMobileSidebar(false)}
                                >
                                  {active && (
                                    <motion.div
                                      layoutId="sidebar-active-mobile"
                                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-primary"
                                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                  )}
                                  <item.icon
                                    size={18}
                                    fill={active ? "currentColor" : "none"}
                                    strokeWidth={active ? 1.5 : 2}
                                  />
                                  <span className="text-sm">{item.label}</span>
                                </Link>
                              </Button>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </nav>

            {/* Bottom: Settings (desktop) or safe-area spacer (mobile) */}
            {!isExpanded ? (
              <div className="shrink-0 border-t p-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-full h-10 ${pathname === "/settings"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                        }`}
                      asChild
                    >
                      <Link href="/settings">
                        <Settings
                          size={20}
                          fill={pathname === "/settings" ? "currentColor" : "none"}
                          strokeWidth={pathname === "/settings" ? 1.5 : 2}
                        />
                      </Link>
                    </Button>
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
