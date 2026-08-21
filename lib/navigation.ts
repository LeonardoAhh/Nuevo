/**
 * Single source of truth for app navigation.
 *
 * Consumed by components/sidebar.tsx (menu tree) and components/header.tsx
 * (page titles). Add new routes here once — every consumer updates itself.
 */
import type { LucideIcon } from "lucide-react"
import { Award, GraduationCap, LayoutDashboard, UserPlus } from "lucide-react"

export interface NavLeaf {
  label: string
  href: string
}

export interface NavSection {
  label: string
  /** Icon shown next to the section name. */
  icon: LucideIcon
  /** Direct link when the section has no children. */
  href?: string
  items?: NavLeaf[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Personal",
    icon: UserPlus,
    items: [
      { label: "Nuevos Empleados", href: "/ingresos" },
      { label: "Recontratación", href: "/recontratacion" },
    ],
  },
  {
    label: "Capacitación",
    icon: GraduationCap,
    items: [
      { label: "Plantilla", href: "/capacitacion" },
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

/**
 * Routes that live outside the sidebar menu (public pages, standalone tools)
 * but still need a display title in the header.
 */
const EXTRA_ROUTE_LABELS: Record<string, string> = {
  "/settings": "Configuración",
  "/ingresos-semanales": "Ingresos Semanales",
  "/whatsapp": "WhatsApp Bot",
  "/bot": "Bot WhatsApp",
  "/desempeno/pendientes": "Evaluaciones Pendientes",
}

/** True when `pathname` is `href` itself or anywhere below it. */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Longest matching leaf inside a section, or undefined. */
export function findActiveLeaf(
  items: NavLeaf[] | undefined,
  pathname: string,
): NavLeaf | undefined {
  return items
    ?.filter((leaf) => isActiveRoute(pathname, leaf.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

/**
 * Human title for the current route: checks nav sections (exact match first,
 * then deepest prefix) and finally the extra standalone routes.
 */
export function getRouteLabel(pathname: string): string {
  const leaves: NavLeaf[] = NAV_SECTIONS.flatMap((section) => [
    ...(section.href ? [{ label: section.label, href: section.href }] : []),
    ...(section.items ?? []),
  ])

  const exact = leaves.find((leaf) => leaf.href === pathname)
  if (exact) return exact.label

  const prefixed = leaves
    .filter((leaf) => pathname.startsWith(`${leaf.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (prefixed) return prefixed.label

  return EXTRA_ROUTE_LABELS[pathname] ?? ""
}
