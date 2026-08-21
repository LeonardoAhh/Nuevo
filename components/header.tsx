"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu, Moon, Sun, Monitor, Settings, LogOut,
  RefreshCw, ChevronDown, Palette,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme, type Theme } from "@/components/theme-context"
import { useUser, useProfile } from "@/lib/hooks"
import { getRouteLabel } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import SignOutOverlay from "@/components/signout-overlay"

// ─── Theme options (single source for label + icon) ──────────────────────────

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light",  label: "Claro",   icon: Sun },
  { value: "dark",   label: "Oscuro",  icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
]

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
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const { profile } = useProfile(user?.id)
  const [signingOut, setSigningOut] = useState(false)

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Usuario"
  const pageLabel = title || getRouteLabel(pathname)

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      const { supabase } = await import("@/lib/supabase/client")
      await supabase.auth.signOut()
    } catch { /* redirect anyway */ }
    setTimeout(() => { router.replace("/login") }, 1200)
  }

  return (
    <>
      <SignOutOverlay show={signingOut} />

      {/* Floating card — mirrors the sidebar panel (rounded, bordered, soft
          shadow) so both landmarks read as surfaces of the same system. */}
      <header
        role="banner"
        className={cn(
          "sticky top-0 z-20 rounded-2xl border border-border/60 bg-card/95",
          "supports-[backdrop-filter]:bg-card/80 backdrop-blur shadow-sm safe-top",
          "mx-2 mt-2 sm:mx-3 sm:mt-3",
        )}
      >
        <div className="flex h-[56px] items-center gap-2 pl-2 pr-2 sm:pl-3">
          {/* Hamburger — mobile only, when sidebar is closed */}
          {isMobileView && !showMobileSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label="Abrir menú de navegación"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <Menu size={19} />
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

          {/* Account menu — single entry point for user actions */}
          <nav aria-label="Menú de cuenta">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Cuenta de ${displayName}`}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full pr-1.5 pl-1 transition-colors",
                    "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <Avatar className="size-8 shrink-0 rounded-full ring-2 ring-primary/15">
                    <AvatarImage src={profile?.avatar || undefined} alt="" />
                    <AvatarFallback className="rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[110px] truncate text-sm font-medium sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown size={14} className="mr-1 hidden text-muted-foreground sm:block" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {/* Identity */}
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  {user?.email && (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Preferences */}
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings size={16} aria-hidden="true" />
                    Configuración
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette size={16} aria-hidden="true" />
                    Tema
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={theme}
                      onValueChange={(value) => setTheme(value as Theme)}
                    >
                      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                          <Icon size={16} aria-hidden="true" />
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Session */}
                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={() => window.location.reload()}>
                  <RefreshCw size={16} aria-hidden="true" />
                  Buscar Actualización
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => { void handleLogout() }}
                >
                  <LogOut size={16} aria-hidden="true" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>
    </>
  )
}
