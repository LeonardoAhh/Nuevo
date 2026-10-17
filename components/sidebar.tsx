"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { SystemInfoFooter } from "@/components/system-info-footer"
import { cn } from "@/lib/utils"
import { HOME_PATH, MOBILE_NAV_ID, NAV_SECTIONS, findActiveLeaf, isActiveRoute } from "@/lib/navigation"
import { AppMark } from "@/components/app-transition"
import { useRole, type AppRole } from "@/lib/hooks/useRole"

// Matches Tailwind's `md` boundary; layout visibility itself stays in CSS.
const DESKTOP_QUERY = "(min-width: 48rem)"

const rowIdle = "text-muted-foreground hover:bg-accent hover:text-foreground"
const rowActiveSolid = "bg-muted font-medium text-foreground"
const navLinkBase = "flex min-h-11 w-full items-center rounded-md px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
const BRAND_NAME = "ViñoPlastic"
const ROLE_LABELS: Record<AppRole, string> = {
  dev: "Desarrollador",
  admin: "Administrador",
  evaluador: "Evaluador",
}

export interface SidebarApi {
  showMobileSidebar: boolean
  openMobileSidebar: () => void
}

export function useSidebar(): SidebarApi & {
  setShowMobileSidebar: (v: boolean) => void
} {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const openMobileSidebar = useCallback(() => setShowMobileSidebar(true), [])

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const closeOnDesktop = () => {
      if (desktop.matches) setShowMobileSidebar(false)
    }
    desktop.addEventListener("change", closeOnDesktop)
    closeOnDesktop()
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

  return { showMobileSidebar, setShowMobileSidebar, openMobileSidebar }
}

function SidebarBrand({ role, onClose }: { role: AppRole; onClose?: () => void }) {
  return (
    <div className="relative flex h-[var(--workspace-header-height)] shrink-0 items-center px-3">
      <Link
        href={HOME_PATH}
        onClick={onClose}
        aria-label={`${BRAND_NAME}, ir a Inicio`}
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-card px-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
          className="absolute right-3 flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/**
 * Full navigation tree — every access always visible, grouped under uppercase
 * section headings. Shared by the desktop panel and the mobile drawer.
 */
function NavTree({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Secciones" className="min-h-0 flex-1 px-3 pb-4 max-md:overflow-x-hidden max-md:overflow-y-auto max-md:scrollbar-thin">
      <ul className="space-y-1 pt-1">
        {NAV_SECTIONS.map((section) => {
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
                    navLinkBase,
                    "gap-3",
                    active ? rowActiveSolid : rowIdle,
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <section.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="truncate">{section.label}</span>
                </Link>
              </li>
            )
          }

          // Grouped section → heading + always-visible links.
          return (
            <li key={section.label} className="pt-3">
              <p className="flex items-center gap-2 px-1 pb-1 font-mono text-xs font-medium uppercase text-muted-foreground">
                <section.icon className="size-3.5" aria-hidden="true" />
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
                          navLinkBase,
                          "gap-2.5",
                          active ? rowActiveSolid : rowIdle,
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 shrink-0 rounded-[2px]",
                            active ? "bg-foreground" : "bg-border",
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
  showMobileSidebar: boolean
  setShowMobileSidebar: (v: boolean) => void
}

export default function Sidebar({
  showMobileSidebar,
  setShowMobileSidebar,
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
          <div className="safe-top flex h-full min-h-0 flex-col bg-background">
            <DrawerTitle className="sr-only">Menú principal</DrawerTitle>
            <DrawerDescription className="sr-only">
              Navegación entre las secciones de la aplicación
            </DrawerDescription>

            <SidebarBrand role={role} onClose={closeMobile} />
            <NavTree pathname={pathname} onNavigate={closeMobile} />
            <SystemInfoFooter className="safe-bottom-content" />
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Desktop sidebar ── */}
      <aside
        aria-label="Menú principal"
        className="workspace-sidebar hidden flex-col bg-background md:flex"
      >
        <SidebarBrand role={role} />
        <NavTree pathname={pathname} />
        <SystemInfoFooter />
      </aside>
    </>
  )
}
