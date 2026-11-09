"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeft, PanelLeftDashed, X } from "lucide-react"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { HOME_PATH, MOBILE_NAV_ID, NAV_SECTIONS, findActiveLeaf } from "@/lib/navigation"
import { AppMark } from "@/components/app-transition"
import { useRole, type AppRole } from "@/lib/hooks/useRole"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AccountMenu } from "@/components/account-menu"

// Matches Tailwind's `md` boundary; layout visibility itself stays in CSS.
const DESKTOP_QUERY = "(min-width: 48rem)"
const SIDEBAR_COLLAPSED_KEY = "workspace-sidebar-collapsed"

const rowIdle = "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
const rowActiveSolid = "ui-floating-surface border-sidebar-border font-medium text-sidebar-foreground"
const navLinkBase = "flex min-h-11 w-full items-center rounded-md border border-transparent px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
const BRAND_NAME = "ViñoPlastic"
const ROLE_LABELS: Record<AppRole, string> = {
  dev: "Desarrollador",
  admin: "Administrador",
  evaluador: "Evaluador",
}

export interface SidebarApi {
  showMobileSidebar: boolean
  openMobileSidebar: () => void
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
}

export function useSidebar(): SidebarApi & {
  setShowMobileSidebar: (v: boolean) => void
} {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [preferenceLoaded, setPreferenceLoaded] = useState(false)

  const openMobileSidebar = useCallback(() => setShowMobileSidebar(true), [])
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed((collapsed) => !collapsed), [])

  useEffect(() => {
    try {
      setIsSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true")
    } catch (error) {
      console.error("No se pudo leer la preferencia de la barra lateral.", error)
    } finally {
      setPreferenceLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!preferenceLoaded) return

    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed))
    } catch (error) {
      console.error("No se pudo guardar la preferencia de la barra lateral.", error)
    }
  }, [isSidebarCollapsed, preferenceLoaded])

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const closeOnDesktop = () => {
      if (desktop.matches) setShowMobileSidebar(false)
    }
    desktop.addEventListener("change", closeOnDesktop)
    closeOnDesktop()
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

  return {
    showMobileSidebar,
    setShowMobileSidebar,
    openMobileSidebar,
    isSidebarCollapsed,
    toggleSidebar,
  }
}

function SidebarBrand({
  role,
  onClose,
}: {
  role: AppRole
  onClose?: () => void
}) {
  return (
    <div className="relative flex h-[var(--workspace-header-height)] shrink-0 items-center px-3">
      <Link
        href={HOME_PATH}
        onClick={onClose}
        aria-label={`${BRAND_NAME}, ir a Inicio`}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-sidebar-border bg-card px-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          onClose && "mr-11",
        )}
      >
        <AppMark className="size-9 shrink-0" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-foreground">{BRAND_NAME}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{ROLE_LABELS[role]}</span>
        </span>
      </Link>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="absolute right-3 flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/**
 * Full navigation tree shared by the desktop panel and mobile drawer.
 */
function NavTree({
  pathname,
  onNavigate,
  isCollapsed = false,
}: {
  pathname: string
  onNavigate?: () => void
  isCollapsed?: boolean
}) {
  const navigationItems = NAV_SECTIONS.flatMap((section) => {
    const activeLeaf = findActiveLeaf(section.items, pathname)
    return section.items.map((leaf) => ({
      leaf,
      active: leaf.href === activeLeaf?.href,
    }))
  }).sort((a, b) => {
    if (a.leaf.href === HOME_PATH || b.leaf.href === HOME_PATH) {
      return a.leaf.href === b.leaf.href ? 0 : a.leaf.href === HOME_PATH ? -1 : 1
    }
    return a.leaf.label.localeCompare(b.leaf.label, "es", { sensitivity: "base" })
  })

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        id={!onNavigate ? "workspace-desktop-navigation" : undefined}
        aria-label="Secciones"
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-4 scrollbar-thin",
          isCollapsed ? "px-2" : "px-3",
        )}
      >
        <ul className="space-y-0 pt-1">
          {navigationItems.map(({ leaf, active }) => {
            const link = (
              <Link
                href={leaf.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  navLinkBase,
                  isCollapsed ? "justify-center px-0" : "gap-3",
                  active ? rowActiveSolid : rowIdle,
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md",
                    active ? "text-sidebar-primary" : "text-muted-foreground",
                  )}
                >
                  <leaf.icon className="size-4" aria-hidden="true" />
                </span>
                <span className={cn("truncate", isCollapsed && "sr-only")}>{leaf.label}</span>
              </Link>
            )

            return (
              <li key={leaf.href}>
                {isCollapsed && !onNavigate ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{leaf.label}</TooltipContent>
                  </Tooltip>
                ) : link}
              </li>
            )
          })}
        </ul>
      </nav>
    </TooltipProvider>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SidebarProps {
  showMobileSidebar: boolean
  setShowMobileSidebar: (v: boolean) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({
  showMobileSidebar,
  setShowMobileSidebar,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()
  const { role } = useRole()
  const closeMobile = useCallback(() => setShowMobileSidebar(false), [setShowMobileSidebar])

  return (
    <>
      {/* ── Mobile drawer (focus trap + Escape + scroll lock via Radix/vaul) ── */}
      <Drawer direction="left" shouldScaleBackground={false} open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <DrawerContent
          id={MOBILE_NAV_ID}
          raw
          fullViewport
          showHandle={false}
          className="inset-y-0 left-0 right-auto mt-0 w-[var(--workspace-sidebar-width)] max-w-[calc(100vw-2rem)] rounded-none border-y-0 border-l-0"
        >
          <div className="safe-top flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
            <DrawerTitle className="sr-only">Menú principal</DrawerTitle>
            <DrawerDescription className="sr-only">
              Navegación entre las secciones de la aplicación
            </DrawerDescription>

            <SidebarBrand role={role} onClose={closeMobile} />
            <div aria-hidden="true" className="mx-3 my-2 shrink-0 border-t border-sidebar-border" />
            <NavTree pathname={pathname} onNavigate={closeMobile} />
            {role !== "evaluador" && (
              <div className="safe-bottom-content shrink-0 border-t border-sidebar-border px-3 py-2">
                <AccountMenu variant="sidebar" onNavigate={closeMobile} />
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Desktop sidebar ── */}
      <aside
        aria-label="Menú principal"
        data-collapsed={isCollapsed}
        className="workspace-sidebar hidden flex-col bg-sidebar text-sidebar-foreground md:flex"
      >
        <div className={cn(
          "mx-2 flex h-12 shrink-0 items-center px-2",
          isCollapsed ? "justify-center" : "justify-between gap-2",
        )}>
          {!isCollapsed && (
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">{BRAND_NAME}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{ROLE_LABELS[role]}</span>
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expandir navegación" : "Contraer navegación"}
            aria-controls="workspace-desktop-navigation"
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expandir navegación" : "Contraer navegación"}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {isCollapsed
              ? <PanelLeft className="size-5" aria-hidden="true" />
              : <PanelLeftDashed className="size-5" aria-hidden="true" />}
          </button>
        </div>
        <div
          aria-hidden="true"
          className="mx-3 mt-[var(--workspace-inset)] shrink-0 border-t border-sidebar-border"
        />
        <NavTree pathname={pathname} isCollapsed={isCollapsed} />
        {role !== "evaluador" && (
          <div className="shrink-0 border-t border-sidebar-border px-2 py-2">
            <AccountMenu variant="sidebar" isCollapsed={isCollapsed} />
          </div>
        )}
      </aside>
    </>
  )
}
