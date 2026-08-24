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
  rail: "w-[76px]",
  full: "w-[264px]",
} as const

// Visual language: solid primary pill for the active item, soft accent tiles
// for hover states, uppercase section headings for grouping.
const rowIdle = "text-muted-foreground hover:bg-accent hover:text-foreground"
const rowActiveSolid = "bg-primary text-primary-foreground font-medium shadow-sm"

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
      className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-80"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-card text-foreground shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
          <path d="M12 1.5V6.5M12 17.5V22.5M4.5 12H9.5M14.5 12H19.5M5.25 5.25L8.5 8.5M15.5 15.5L18.75 18.75M5.25 18.75L8.5 15.5M15.5 8.5L18.75 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      {!compact && (
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
                    "flex h-10 w-full items-center gap-3 rounded-xl px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? rowActiveSolid : rowIdle,
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md",
                      active ? "bg-primary-foreground/20" : "bg-accent",
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
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "h-9",
                          active ? rowActiveSolid : rowIdle,
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 shrink-0 rounded-[2px]",
                            active ? "bg-primary-foreground/80" : "bg-border",
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
                "grid size-11 place-items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                  "relative grid size-11 place-items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : rowIdle,
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-[9px] size-1.5 rounded-[2px] bg-primary"
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
            className="inset-y-0 left-0 right-auto mt-0 w-[286px] max-w-[86vw] rounded-none rounded-r-2xl border-y-0 border-l-0"
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
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {/* ── Desktop floating panel ── */}
      {isDesktop && (
        <TooltipProvider delayDuration={0}>
          <aside
            aria-label="Menú principal"
            className={cn(
              "my-3 ml-3 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
              "transition-[width] duration-300 ease-in-out",
              isExpanded ? WIDTH.full : WIDTH.rail,
            )}
          >
            {/* Brand */}
            <div className={cn("flex h-[60px] shrink-0 items-center px-3", !isExpanded && "justify-center px-0")}>
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
                      "flex h-10 w-full items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
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
