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
import NotificationBell from "@/components/notification-bell"
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

  // Nav items shown in dropdown — excludes theme (lives in header icon) and
  // settings (shown at bottom of sidebar on desktop, "Más" sheet on mobile).
  const dropdownLinks = [
    {
      href:    "/settings",
      label:   "Configuración",
      icon:    Settings,
      show:    true,
    },
    {
      href:    "/recontratacion",
      label:   "Recontratación",
      icon:    FileCheck2,
      show:    !roleLoading && !isEvaluador,
    },
    {
      href:    "/ingresos-semanales",
      label:   "Ingresos Semanales",
      icon:    CalendarRange,
      show:    !roleLoading && !isEvaluador,
    },
    {
      href:    "/desempeno/seguimiento",
      label:   "Seguimiento Compromisos",
      icon:    FileWarning,
      show:    !roleLoading && !isEvaluador,
    },
    {
      href:    "/guia-evaluador",
      label:   "Guía Evaluador",
      icon:    BookOpen,
      show:    true,
    },
  ].filter((l) => l.show)

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

            {/* Theme cycle — desktop only; mobile sees it in the dropdown */}
            <button
              type="button"
              onClick={cycleTheme}
              aria-label={`Tema: ${THEME_LABEL[theme]}`}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Pill trigger: avatar + name on sm+ */}
                <button
                  type="button"
                  className="ml-1 flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2.5 text-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Menú de usuario"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[110px] truncate text-sm font-medium sm:block">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-56">

                {/* Identity block — not interactive */}
                <DropdownMenuLabel asChild>
                  <div className="flex cursor-default select-none items-center gap-3 px-2 py-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={profile?.avatar || undefined} />
                      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email ?? ""}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {dropdownLinks.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild>
                    <Link
                      href={href}
                      className="flex cursor-pointer items-center gap-2"
                      aria-current={pathname === href ? "page" : undefined}
                    >
                      <Icon
                        size={15}
                        className={pathname === href ? "text-primary" : "text-muted-foreground"}
                      />
                      <span className={pathname === href ? "font-medium text-primary" : ""}>
                        {label}
                      </span>
                      {pathname === href && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}

                {/* Theme toggle — mobile only (desktop has the icon in the header) */}
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 sm:hidden"
                  onSelect={(e) => { e.preventDefault(); cycleTheme() }}
                  aria-label={`Tema: ${THEME_LABEL[theme]}`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={theme}
                      initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                      exit={{   opacity: 0, rotate:  30,  scale: 0.8 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="inline-flex text-muted-foreground"
                    >
                      <ThemeIcon size={15} />
                    </motion.span>
                  </AnimatePresence>
                  <span>Tema</span>
                  <span className="ml-auto text-xs text-muted-foreground">{THEME_LABEL[theme]}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="flex cursor-pointer items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut size={15} />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>
    </>
  )
}
