"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, X } from "lucide-react"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS, findActiveLeaf, isActiveRoute, type NavSection } from "@/lib/navigation"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"
import { useIsMobile } from "@/components/ui/responsive-shell"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Matches the `md:` breakpoint used by Dashboard's flex layout. */
const MOBILE_BREAKPOINT = 768

const DESKTOP_WIDTH = "w-[264px]"

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

function useVisibleSections(): NavSection[] {
  const { isEvaluador } = useRole()

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

// ─── Shared pieces ────────────────────────────────────────────────────────────

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Inicio — VIÑOPLASTIC"
      className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Briefcase className="size-[17px]" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="select-none overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight">
          <span className="text-primary">VIÑO</span>
          <span className="text-foreground">PLASTIC</span>
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
                            "size-1.5 shrink-0 rounded-full",
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

// ─── Main component ───────────────────────────────────────────────────────────

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
  const sections = useVisibleSections()
  const closeMobile = useCallback(() => setShowMobileSidebar(false), [setShowMobileSidebar])

  const isDesktop = !isMobileView

  return (
    <>
      {/* ── Mobile drawer (focus trap + Escape + scroll lock via Radix/vaul) ── */}
      {isMobileView && (
        <Drawer direction="left" open={showMobileSidebar} onOpenChange={(open) => !open && closeMobile()}>
          <DrawerContent
            raw
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
        <aside
          aria-label="Menú principal"
          className={cn(
            "my-3 ml-3 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
            DESKTOP_WIDTH,
          )}
        >
          <div className="flex h-[60px] shrink-0 items-center px-4">
            <BrandMark />
          </div>

          <NavTree sections={sections} pathname={pathname} />
        </aside>
      )}
    </>
  )
}
