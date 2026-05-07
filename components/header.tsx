"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  Moon,
  Sun,
  Monitor,
  Settings,
  LogOut,
  ChevronsUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, type Theme } from "@/components/theme-context"
import { useUser, useProfile } from "@/lib/hooks"
import { notify } from "@/lib/notify"
import NotificationBell from "@/components/notification-bell"
import SignOutOverlay from "@/components/signout-overlay"

// ─── Theme helpers ───────────────────────────────────────────────────────────

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }
const THEME_NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" }
const THEME_LABEL: Record<Theme, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" }

// ─── Breadcrumb map ──────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/ingresos": "Nuevo Ingreso",
  "/capacitacion": "Capacitación",
  "/calificaciones": "Calificaciones",
  "/promociones": "Promociones",
  "/desempeno": "Evaluación Desempeño",
  "/examenes": "Exámenes",
  "/whatsapp": "WhatsApp Bot",
  "/cursos": "Cursos",
  "/bot": "Bot WhatsApp",
  "/eventos": "Eventos",
  "/settings": "Configuración",
}

// ─── Component ───────────────────────────────────────────────────────────────

interface HeaderProps {
  title?: string
  isMobileView: boolean
  showMobileSidebar: boolean
  onOpenSidebar: () => void
}

export default function Header({ title, isMobileView, showMobileSidebar, onOpenSidebar }: HeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const { profile } = useProfile(user?.id)
  const [signingOut, setSigningOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const avatarFallback = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Usuario"

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      const { supabase } = await import("@/lib/supabase/client")
      await supabase.auth.signOut()
      notify.success("Sesión cerrada correctamente")
    } catch {
      // continue to redirect even on error
    }
    setTimeout(() => {
      window.location.href = "/login"
    }, 900)
  }

  const cycleTheme = () => setTheme(THEME_NEXT[theme])
  const ThemeIcon = THEME_ICON[theme]

  const pageLabel = title || ROUTE_LABELS[pathname] || ""

  return (
    <>
      {mounted && <SignOutOverlay show={signingOut} />}

      <header
        role="banner"
        className="sticky top-0 z-20 border-b bg-card/95 supports-[backdrop-filter]:bg-card/80 backdrop-blur safe-top"
      >
        <div className="flex items-center gap-3 h-[50px] px-3 sm:px-5">
          {/* Mobile hamburger */}
          {isMobileView && !showMobileSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={onOpenSidebar}
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </Button>
          )}

          {/* Breadcrumb / page title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {pageLabel && (
              <h1 className="text-sm sm:text-base font-semibold truncate text-foreground">
                {pageLabel}
              </h1>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={cycleTheme}
              aria-label={`Tema: ${THEME_LABEL[theme]}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="inline-flex"
                >
                  <ThemeIcon size={16} />
                </motion.span>
              </AnimatePresence>
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="text-[10px] font-medium">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
                    {displayName}
                  </span>
                  <ChevronsUpDown size={12} className="hidden sm:block shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                <DropdownMenuLabel asChild>
                  <div className="flex items-center gap-3 px-2 py-2 cursor-default select-none">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={profile?.avatar || undefined} />
                      <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{displayName}</span>
                      <span className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  asChild
                  className={
                    pathname === "/settings"
                      ? "bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary"
                      : ""
                  }
                >
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings size={16} />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); cycleTheme() }}
                  className="flex items-center gap-2 cursor-pointer"
                  aria-label={`Tema actual: ${THEME_LABEL[theme]}. Click para cambiar.`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={theme}
                      initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="inline-flex"
                    >
                      <ThemeIcon size={16} />
                    </motion.span>
                  </AnimatePresence>
                  <span>Tema</span>
                  <span className="ml-auto text-xs text-muted-foreground">{THEME_LABEL[theme]}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut size={16} />
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
