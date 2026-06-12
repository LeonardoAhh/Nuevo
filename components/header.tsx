"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu, Moon, Sun, Monitor, Settings, LogOut,
  BookOpen, FileCheck2, CalendarRange, FileWarning,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, type Theme } from "@/components/theme-context"
import { useUser, useProfile, useRole } from "@/lib/hooks"
import { notify } from "@/lib/notify"
import SignOutOverlay from "@/components/signout-overlay"

// ─── Constants ────────────────────────────────────────────────────────────────

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }
const THEME_NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" }
const THEME_LABEL: Record<Theme, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" }

const ROUTE_LABELS: Record<string, string> = {
  "/":                       "Dashboard",
  "/ingresos":               "Nuevo Ingreso",
  "/capacitacion":           "Capacitación",
  "/calificaciones":         "Calificaciones",
  "/promociones":            "Promociones",
  "/desempeno":              "Evaluación Desempeño",
  "/desempeno/cumplimiento": "Cumplimiento Evaluaciones",
  "/recontratacion":         "Recontratación",
  "/examenes":               "Exámenes",
  "/whatsapp":               "WhatsApp Bot",
  "/ingresos-semanales":     "Ingresos Semanales",
  "/cursos":                 "Cursos",
  "/bot":                    "Bot WhatsApp",
  "/eventos":                "Eventos",
  "/desempeno/seguimiento": "Seguimiento Compromisos",
  "/guia-evaluador":         "Guía Evaluador",
  "/settings":               "Configuración",
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HeaderProps {
  title?: string
  isMobileView: boolean
  showMobileSidebar: boolean
  onOpenSidebar: () => void
}

export default function Header({
  title,
  isMobileView,
  showMobileSidebar,
  onOpenSidebar,
}: HeaderProps) {
  const pathname   = usePathname()
  const { theme, setTheme } = useTheme()
  const { user }   = useUser()
  const { profile } = useProfile(user?.id)
  const { isEvaluador, loading: roleLoading } = useRole()
  const [signingOut, setSigningOut] = useState(false)
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Usuario"
  const pageLabel   = title || ROUTE_LABELS[pathname] || ""
  const ThemeIcon   = THEME_ICON[theme]
  const cycleTheme  = () => setTheme(THEME_NEXT[theme])

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      const { supabase } = await import("@/lib/supabase/client")
      await supabase.auth.signOut()
      notify.success("Sesión cerrada correctamente")
    } catch { /* redirect anyway */ }
    setTimeout(() => { window.location.href = "/login" }, 900)
  }

  // Nav items moved to the sidebar
  return (
    <>
      {mounted && <SignOutOverlay show={signingOut} />}

      <header
        role="banner"
        className="sticky top-0 z-20 border-b bg-card/95 supports-[backdrop-filter]:bg-card/80 backdrop-blur safe-top"
      >
        <div className="flex items-center gap-2 h-[50px] px-3 sm:px-4">

          {/* Hamburger — mobile only, when sidebar is closed */}
          {isMobileView && !showMobileSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label="Abrir menú"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <Menu size={18} />
            </button>
          )}

          {/* Page title */}
          <div className="flex min-w-0 flex-1 items-center">
            {pageLabel && (
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                {pageLabel}
              </h1>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">

            {/* Refresh */}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              Actualizar
            </button>

            {/* Theme cycle */}
            <button
              type="button"
              onClick={cycleTheme}
              aria-label={`Tema: ${THEME_LABEL[theme]}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                  exit={{   opacity: 0, rotate:  30,  scale: 0.8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="inline-flex"
                >
                  <ThemeIcon size={16} />
                </motion.span>
              </AnimatePresence>
            </button>

            {/* User menu */}
            <div className="ml-2 flex items-center gap-3 pl-2 sm:border-l sm:ml-4 sm:pl-4">
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={profile?.avatar || undefined} />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[110px] truncate text-sm font-medium">
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>

          </div>
        </div>
      </header>
    </>
  )
}
