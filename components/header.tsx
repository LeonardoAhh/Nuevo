"use client"

import { useState } from "react"
import { useAppUpdate, type UpdateStatus } from "@/lib/hooks/useAppUpdate"
import { toast } from "sonner"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu, Settings, LogOut, RefreshCw, ChevronDown, Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useProfile, useRole } from "@/lib/hooks"
import { getRouteLabel, LOGIN_PATH, MOBILE_NAV_ID, SETTINGS_PATH } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import SignOutOverlay from "@/components/signout-overlay"
import { APP_TRANSITION_MIN_MS, useAppReducedMotion } from "@/components/app-transition"
import { WorkspaceContainer } from "@/components/ui/workspace-container"

// ─── Component ────────────────────────────────────────────────────────────────

interface HeaderProps {
  title?: string
  showMobileSidebar: boolean
  onOpenSidebar: () => void
  showSidebarToggle?: boolean
}

const UPDATE_ACTION_LABEL: Record<UpdateStatus, string> = {
  idle: "Buscar actualización",
  checking: "Buscando actualización…",
  available: "Actualizar ahora",
  applying: "Actualizando…",
  "up-to-date": "Buscar actualización",
}

const accountMenuItemClass = "min-h-11 gap-2.5 px-2.5 text-sm"

function AccountAvatar({ src, initials, className }: { src?: string | null; initials: string; className?: string }) {
  return (
    <Avatar className={cn("size-8 shrink-0 rounded-full border border-border", className)}>
      <AvatarImage src={src || undefined} alt="" />
      <AvatarFallback className="rounded-full bg-primary text-xs font-medium text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

export default function Header({
  title,
  showMobileSidebar,
  onOpenSidebar,
  showSidebarToggle = true,
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { profile } = useProfile(user?.id)
  const { isEvaluador, loading: roleLoading } = useRole()
  const [signingOut, setSigningOut] = useState(false)
  const reducedMotion = useAppReducedMotion()
  const { status: updateStatus, checkForUpdate, applyUpdate, getLatestStatus } = useAppUpdate()

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Usuario"
  const pageLabel = title || getRouteLabel(pathname)

  const handleLogout = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      const { supabase } = await import("@/lib/supabase/client")
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      if (!reducedMotion) {
        await new Promise((resolve) => setTimeout(resolve, APP_TRANSITION_MIN_MS))
      }
      router.replace(LOGIN_PATH)
    } catch {
      setSigningOut(false)
      toast.error("No se pudo cerrar la sesión. Inténtalo de nuevo.")
    }
  }

  const handleCheckForUpdate = async () => {
    if (updateStatus === "available") {
      applyUpdate()
      toast.loading("Actualizando…", { id: "app-update" })
      return
    }

    toast.loading("Buscando actualización…", { id: "app-update" })
    try {
      await checkForUpdate()
      const latest = getLatestStatus()
      if (latest === "available") {
        toast.success("¡Nueva versión disponible!", {
          id: "app-update",
          description: "Abre el menú de nuevo para actualizar.",
        })
      } else if (latest === "up-to-date") {
        toast.success("Estás al día", {
          id: "app-update",
          description: "No hay actualizaciones disponibles.",
        })
      } else {
        toast.dismiss("app-update")
      }
    } catch {
      toast.error("No se pudo buscar una actualización.", { id: "app-update" })
    }
  }

  return (
    <>
      <SignOutOverlay show={signingOut} />

      <header
        className="workspace-header sticky top-0 z-20 h-[var(--workspace-header-height)] shrink-0 border-b border-border bg-card md:top-[var(--workspace-inset)]"
      >
        <WorkspaceContainer className="flex h-full items-center gap-2">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label="Abrir menú de navegación"
              aria-controls={showMobileSidebar ? MOBILE_NAV_ID : undefined}
              aria-expanded={showMobileSidebar}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
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

          {user && (
            <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Cuenta de ${displayName}`}
                  className={cn(
                    "flex min-h-11 max-w-full items-center gap-2 rounded-md border border-border bg-card px-2 text-foreground transition-colors",
                    "hover:bg-accent data-[state=open]:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <AccountAvatar src={profile?.avatar} initials={initials} />
                  <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-64 max-w-[calc(100vw-2rem)] p-1.5">
                {/* Identity */}
                <DropdownMenuLabel className="flex min-w-0 items-center gap-3 px-2 py-2.5 font-normal">
                  <AccountAvatar src={profile?.avatar} initials={initials} className="size-9" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
                    {user?.email && (
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </span>
                </DropdownMenuLabel>

                {/* Preferences */}
                {!roleLoading && !isEvaluador && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className={accountMenuItemClass}>
                      <Link href={SETTINGS_PATH}>
                        <Settings className="text-muted-foreground" aria-hidden="true" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>

                  </>
                )}

                {/* Session */}
                <DropdownMenuSeparator />

                <DropdownMenuItem className={accountMenuItemClass} disabled={updateStatus === "checking" || updateStatus === "applying"} onSelect={() => { void handleCheckForUpdate() }}>
                  {updateStatus === "checking" || updateStatus === "applying"
                    ? <Loader2 className="animate-spin text-muted-foreground" aria-hidden="true" />
                    : <RefreshCw className="text-muted-foreground" aria-hidden="true" />}
                  {UPDATE_ACTION_LABEL[updateStatus]}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className={cn(accountMenuItemClass, "text-destructive focus:bg-destructive/10 focus:text-destructive")}
                  disabled={signingOut}
                  onSelect={() => { void handleLogout() }}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
        </WorkspaceContainer>
      </header>
    </>
  )
}
