"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsLeft, ChevronsRight, X } from "lucide-react"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS, findActiveLeaf, isActiveRoute, type NavSection } from "@/lib/navigation"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"
import { useIsMobile } from "@/components/ui/responsive-shell"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Matches the `md:` breakpoint used by Dashboard's flex layout. */
const MOBILE_BREAKPOINT = 768

const SIDEBAR_STORAGE_KEYS = {
  expanded: "sidebar_expanded",
} as const

/** Custom event fired after toggling the persisted collapse preference. */
const EXPANDED_CHANGE_EVENT = "vtx:sidebar-expanded-change"

const WIDTH = {
  rail: "w-16",
  full: "w-60",
} as const

// Traditional navigation language: restrained backgrounds, compact radii and
// clear hierarchy without floating surfaces or shadows.
const rowIdle = "text-muted-foreground hover:bg-accent hover:text-foreground"
const rowActiveSolid = "bg-accent text-foreground font-medium"

// ─── Hook (public API consumed by Dashboard) ──────────────────────────────────

export interface SidebarApi {
  isMobileView: boolean
  showMobileSidebar: boolean
  openMobileSidebar: () => void
}

export function useSidebar(): SidebarApi & {
  setShowMobileSidebar: (v: boolean) => void
} {
  const isMobileView = useIsMobile(MOBILE_BREAKPOINT)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const openMobileSidebar = useCallback(() => setShowMobileSidebar(true), [])

  return { isMobileView, showMobileSidebar, setShowMobileSidebar, openMobileSidebar }
}

// ─── Role filtering ───────────────────────────────────────────────────────────

function useVisibleSections(isEvaluador: boolean): NavSection[] {
  return useMemo(() => {
    if (!isEvaluador) return NAV_SECTIONS
    return NAV_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items?.filter((leaf) => isEvaluadorAllowedRoute(leaf.href)),
      }))
      .filter((section) =>
        (section.href && isEvaluadorAllowedRoute(section.href)) ||
        (section.items?.length ?? 0) > 0
      )
  }, [isEvaluador])
}

/**
 * Collapse preference persisted in localStorage, exposed as an external
 * store so the first client render already reflects the saved value.
 * Collapsed is stored as "false"; absence means expanded (default).
 */
function useExpandedPreference(): [boolean, () => void] {
  const key = SIDEBAR_STORAGE_KEYS.expanded

  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener(EXPANDED_CHANGE_EVENT, onStoreChange)
    return () => window.removeEventListener(EXPANDED_CHANGE_EVENT, onStoreChange)
  }, [])

  const isExpanded = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) !== "false",
    () => true,
  )

  const toggle = useCallback(() => {
    const next = window.localStorage.getItem(key) === "false"
    window.localStorage.setItem(key, String(next))
    window.dispatchEvent(new Event(EXPANDED_CHANGE_EVENT))
  }, [key])

  return [isExpanded, toggle]
}

// ─── Shared pieces ────────────────────────────────────────────────────────────

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Inicio — VIÑOPLASTIC"
      className="group flex items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {compact ? (
        <span className="select-none text-sm font-semibold tracking-tight text-foreground">
          VP
        </span>
      ) : (
        <span className="select-none overflow-hidden whitespace-nowrap text-[17px] font-medium tracking-tight">
          <span className="text-foreground">VIÑO</span>
          <span className="text-muted-foreground ml-0.5">PLASTIC</span>
        </span>
      )}
    </Link>
  )
}

/**
 * Full navigation tree — every access always visible, grouped under uppercase
 * section headings. Shared by the desktop panel and the mobile drawer.
 */
function NavTree({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavSection[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Secciones" className="flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4 scrollbar-thin">
      <ul className="space-y-3 pt-1">
        {sections.map((section) => {
          const activeLeaf = findActiveLeaf(section.items, pathname)

          // Section without children → single direct row.
          if (!section.items?.length && section.href) {
            const active = isActiveRoute(pathname, section.href)
            return (
              <li key={section.label}>
                <Link
                  href={section.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? rowActiveSolid : rowIdle,
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <section.icon size={16} strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
                  </span>
                  <span className="truncate">{section.label}</span>
                </Link>
              </li>
            )
          }

          // Grouped section → heading + always-visible links.
          return (
            <li key={section.label}>
              <p className="flex items-center gap-2 px-1 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <section.icon size={14} aria-hidden="true" />
                {section.label}
              </p>
              <ul className="ml-4 space-y-0.5 border-l border-border/70 pl-2">
                {section.items?.map((leaf) => {
                  const active = leaf.href === activeLeaf?.href
                  return (
                    <li key={leaf.href}>
                      <Link
                        href={leaf.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "h-9",
                          active ? rowActiveSolid : rowIdle,
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 shrink-0 rounded-[2px]",
                            active ? "bg-primary" : "bg-border",
                          )}
                        />
                        <span className="truncate">{leaf.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ─── Desktop · collapsed rail ─────────────────────────────────────────────────

function RailSection({
  section,
  pathname,
}: {
  section: NavSection
  pathname: string
}) {
  // Direct link → icon tile with tooltip.
  if (!section.items?.length && section.href) {
    const active = isActiveRoute(pathname, section.href)
    return (
      <li className="flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={section.href}
              aria-current={active ? "page" : undefined}
              aria-label={section.label}
              className={cn(
                "grid size-11 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? rowActiveSolid : rowIdle,
              )}
            >
              <section.icon size={20} strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {section.label}
          </TooltipContent>
        </Tooltip>
      </li>
    )
  }

  // Grouped section → icon tile with flyout menu.
  const activeLeaf = findActiveLeaf(section.items, pathname)
  const active = Boolean(activeLeaf)

  return (
    <li className="flex justify-center">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`${section.label} — abrir submenú`}
                aria-haspopup="menu"
                className={cn(
                  "relative grid size-11 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : rowIdle,
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-2 h-6 w-0.5 bg-primary"
                  />
                )}
                <section.icon size={20} strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {!active && (
            <TooltipContent side="right" className="font-medium">
              {section.label}
            </TooltipContent>
          )}
        </Tooltip>

        <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-56 p-1.5">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-1" />
          {section.items?.map((leaf) => {
            const leafActive = leaf.href === activeLeaf?.href
            return (
              <DropdownMenuItem key={leaf.href} asChild className="cursor-pointer rounded-lg">
                <Link href={leaf.href} aria-current={leafActive ? "page" : undefined}>
                  {leaf.label}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SidebarProps {
  isMobileView: boolean
  showMobileSidebar: boolean
  setShowMobileSidebar: (v: boolean) => void
  isEvaluador?: boolean
}

export default function Sidebar({
  isMobileView,
  showMobileSidebar,
  setShowMobileSidebar,
  isEvaluador = false,
}: SidebarProps) {
  const pathname = usePathname()
  const sections = useVisibleSections(isEvaluador)
  const closeMobile = useCallback(() => setShowMobileSidebar(false), [setShowMobileSidebar])
  const [isExpanded, toggleExpanded] = useExpandedPreference()

  const isDesktop = !isMobileView

  return (
    <>
      {/* ── Mobile drawer (focus trap + Escape + scroll lock via Radix/vaul) ── */}
      {isMobileView && (
        <Drawer direction="left" open={showMobileSidebar} onOpenChange={(open) => !open && closeMobile()}>
          <DrawerContent
            raw
            showHandle={false}
            // Anchor BOTH top and bottom so the panel always spans the viewport.
            className="inset-y-0 left-0 right-auto mt-0 w-[286px] max-w-[86vw] rounded-none border-y-0 border-l-0"
          >
            <div
              className="flex h-full flex-col bg-card"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            >
              {/* Accessible drawer title (visually replaced by the brand mark) */}
              <DrawerTitle className="sr-only">Menú principal</DrawerTitle>
              <DrawerDescription className="sr-only">
                Navegación entre las secciones de la aplicación
              </DrawerDescription>

              <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-border/60 pl-4 pr-2">
                <BrandMark />
                <button
                  type="button"
                  onClick={closeMobile}
                  aria-label="Cerrar menú"
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <NavTree sections={sections} pathname={pathname} onNavigate={closeMobile} />

              <div
                className="shrink-0"
                style={{ height: "env(safe-area-inset-bottom, 0px)" }}
                aria-hidden="true"
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* ── Desktop sidebar ── */}
      {isDesktop && (
        <TooltipProvider delayDuration={0}>
          <aside
            aria-label="Menú principal"
            className={cn(
              "flex shrink-0 flex-col overflow-hidden bg-card",
              "transition-[width] duration-300 ease-in-out",
              isExpanded ? WIDTH.full : WIDTH.rail,
            )}
          >
            {/* Brand */}
            <div className={cn("flex h-[60px] shrink-0 items-center border-b border-border px-3", !isExpanded && "justify-center px-0")}>
              <BrandMark compact={!isExpanded} />
            </div>

            {/* Nav tree */}
            {isExpanded ? (
              <NavTree sections={sections} pathname={pathname} />
            ) : (
              <nav aria-label="Secciones" className="flex-1 space-y-2 overflow-x-hidden overflow-y-auto px-2 pb-4 pt-1 scrollbar-thin">
                <ul className="space-y-1.5">
                  {sections.map((section) => (
                    <RailSection key={section.label} section={section} pathname={pathname} />
                  ))}
                </ul>
              </nav>
            )}

            {/* Footer · collapse toggle (text + icon) */}
            <div
              className={cn(
                "shrink-0 border-t border-border/60",
                isExpanded ? "p-3" : "px-2 py-3",
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleExpanded}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Colapsar menú lateral" : "Expandir menú lateral"}
                    className={cn(
                      rowIdle,
                      "flex h-10 w-full cursor-pointer items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isExpanded ? "gap-3 px-3" : "justify-center",
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronsLeft size={18} aria-hidden="true" />
                        Colapsar
                      </>
                    ) : (
                      <ChevronsRight size={18} aria-hidden="true" />
                    )}
                  </button>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right">Expandir</TooltipContent>
                )}
              </Tooltip>
            </div>
          </aside>
        </TooltipProvider>
      )}
    </>
  )
}
