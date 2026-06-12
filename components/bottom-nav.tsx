"use client"

import { useState, type ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Award,
  BookOpen,
  Bot,
  ClipboardCheck,
  FileWarning,
  ImageIcon,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  TrendingUp,
  UserPlus,
  Settings,
} from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/hooks"
import { isEvaluadorAllowedRoute } from "@/lib/hooks/useRole"

// ─── Types ───────────────────────────────────────────────────────────────────

type IconComp = ComponentType<{ size?: number; className?: string }>

interface NavItem {
  label: string
  href: string
  icon: IconComp
}

// ─── Config ──────────────────────────────────────────────────────────────────

// Four primary destinations — the most frequented pages. The rest move to the
// "Más" sheet below.
const PRIMARY: NavItem[] = [
  { label: "Inicio", href: "/", icon: LayoutDashboard },
  { label: "Ingresos", href: "/ingresos", icon: UserPlus },
  { label: "Capacitación", href: "/capacitacion", icon: GraduationCap },
]

// Primary items shown to evaluador (all three must be in EVALUADOR_ALLOWED_ROUTES)
const EVALUADOR_PRIMARY: NavItem[] = [
  { label: "Desempeño", href: "/desempeno", icon: Award },
  { label: "Cursos", href: "/cursos", icon: BookOpen },
  { label: "Eventos", href: "/eventos", icon: ImageIcon },
]

// hrefs that evaluador sees in their primary bar — excluded from the "Más" drawer
const EVALUADOR_PRIMARY_HREFS = new Set(EVALUADOR_PRIMARY.map((i) => i.href))

// Everything else lives in the bottom sheet, grouped by category to keep the
// list readable.
const MORE_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Capacitación",
    items: [
      { label: "Calificaciones",         href: "/calificaciones",          icon: LayoutGrid    },
      { label: "Promociones",            href: "/promociones",             icon: TrendingUp    },
      { label: "Exámenes",               href: "/examenes",                icon: ClipboardCheck},
      { label: "Seguimiento Compromisos",href: "/desempeno/seguimiento",   icon: FileWarning   },
    ],
  },
  {
    label: "Público",
    items: [
      { label: "Cursos", href: "/cursos", icon: BookOpen },
      { label: "Eventos", href: "/eventos", icon: ImageIcon },
    ],
  },
  {
    label: "Cuenta",
    items: [{ label: "Ajustes", href: "/settings", icon: Settings }],
  },
]

// ALL hrefs that could live inside the drawer (used to highlight the "Más" tab)
const ALL_MORE_HREFS = new Set(
  MORE_GROUPS.flatMap((g) => g.items.map((i) => i.href)),
)

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Mobile-only bottom navigation. Renders a fixed bar with three primary
 * destinations and a "Más" tab that opens a bottom sheet listing the
 * remaining routes. Hidden on tablet/desktop — the sidebar is the nav there.
 *
 * Active state is computed against the current `pathname`; the "Más" tab
 * lights up when the user is on any route that lives inside the sheet.
 */
export default function BottomNav() {
  const pathname = usePathname() ?? "/"
  const [open, setOpen] = useState(false)
  const { isEvaluador } = useRole()

  // Don't render on the public landing pages — they have their own layouts.
  if (isPublicPath(pathname)) return null

  // For evaluador: use a role-specific primary bar and filter the drawer.
  const primaryItems = isEvaluador ? EVALUADOR_PRIMARY : PRIMARY

  // Drawer groups: for evaluador, exclude non-allowed routes AND routes already
  // promoted to the primary bar so there's no duplication.
  const visibleMoreGroups = MORE_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!isEvaluador) return true
        return isEvaluadorAllowedRoute(item.href) && !EVALUADOR_PRIMARY_HREFS.has(item.href)
      }),
    }))
    .filter((group) => group.items.length > 0)

  const visibleMoreHrefs = new Set(
    visibleMoreGroups.flatMap((g) => g.items.map((i) => i.href)),
  )

  const moreActive = (isEvaluador ? visibleMoreHrefs : ALL_MORE_HREFS).has(pathname)

  return (
    <>
      <nav
        aria-label="Navegación principal móvil"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 md:hidden",
          "border-t border-border/60 bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/75",
          "safe-bottom",
        )}
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {primaryItems.map((item) => (
            <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir más opciones"
              aria-expanded={open}
              className={cn(
                "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                moreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {moreActive ? (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-x-6 top-1 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              ) : null}
              <MoreHorizontal className="size-5" aria-hidden />
              <span className="text-[11px]">Más</span>
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="safe-bottom">
          <DrawerHeader className="text-left">
            <DrawerTitle>Menú</DrawerTitle>
            <DrawerDescription>Todas las secciones disponibles.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-6 px-4 pb-6">
            {visibleMoreGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                            active
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/60 bg-card text-foreground hover:border-primary/30 hover:bg-muted/40",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-lg",
                              active ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground",
                            )}
                          >
                            <item.icon size={18} aria-hidden />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {active ? (
          <motion.span
            layoutId="bottom-nav-active"
            className="absolute inset-x-6 top-1 h-0.5 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        ) : null}
        <item.icon size={20} aria-hidden />
        <span className="text-[11px]">{item.label}</span>
      </Link>
    </li>
  )
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith("/auth") ||
    pathname === "/login" ||
    pathname === "/offline" ||
    pathname.startsWith("/eventos") ||
    pathname.startsWith("/recursos") ||
    pathname.startsWith("/cursos") ||
    pathname.startsWith("/preview")
  )
}
