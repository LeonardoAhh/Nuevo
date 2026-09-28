"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { NAV_SECTIONS, findActiveLeaf, isActiveRoute, type NavSection } from "@/lib/navigation"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"
import { useIsMobile } from "@/components/ui/responsive-shell"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Matches the `md:` breakpoint used by Dashboard's flex layout. */
const MOBILE_BREAKPOINT = 768

// Traditional navigation language: restrained backgrounds, compact radii and
// clear hierarchy without floating surfaces or shadows.
const rowIdle = "text-muted-foreground hover:bg-accent hover:text-foreground"
const rowActiveSolid = "bg-brand/10 text-brand-text font-medium"

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

// ─── Shared pieces ────────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <Link
      href="/"
      aria-label="Inicio — VIÑOPLASTIC"
      className="group flex items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="select-none overflow-hidden whitespace-nowrap text-[17px] font-medium tracking-tight">
        <span className="text-foreground">VIÑO</span>
        <span className="ml-0.5 text-muted-foreground">PLASTIC</span>
      </span>
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
                      active ? "text-brand-text" : "text-muted-foreground",
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
              <p className="flex items-center gap-2 px-1 pb-1 pt-2 font-mono text-[11px] font-medium uppercase text-muted-foreground">
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
                            active ? "bg-brand" : "bg-border",
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
              className="flex h-full flex-col bg-background"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            >
              {/* Accessible drawer title (visually replaced by the brand mark) */}
              <DrawerTitle className="sr-only">Menú principal</DrawerTitle>
              <DrawerDescription className="sr-only">
                Navegación entre las secciones de la aplicación
              </DrawerDescription>

              <div className="flex h-[56px] shrink-0 items-center justify-between pl-4 pr-2">
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
        <aside
          aria-label="Menú principal"
          className="my-2 flex w-60 shrink-0 flex-col overflow-hidden bg-background"
        >
          <div className="flex h-[60px] shrink-0 items-center px-3">
            <BrandMark />
          </div>
          <NavTree sections={sections} pathname={pathname} />
        </aside>
      )}
    </>
  )
}
