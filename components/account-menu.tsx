"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronDown, LogOut, Moon, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProfile, useRole, useUser } from "@/lib/hooks"
import { LOGIN_PATH, SETTINGS_PATH } from "@/lib/navigation"
import { supabase } from "@/lib/supabase/client"
import { confirmUnsavedChanges } from "@/lib/unsaved-changes"
import { cn } from "@/lib/utils"
import { useSignOut } from "@/components/signout-overlay"
import { useTheme } from "@/components/theme-context"

type AccountMenuProps = {
  variant: "header" | "sidebar"
  isCollapsed?: boolean
  onNavigate?: () => void
}

const accountMenuItemClass = "min-h-11 gap-2.5 px-2 text-sm font-normal"

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

export function AccountMenu({ variant, isCollapsed = false, onNavigate }: AccountMenuProps) {
  const router = useRouter()
  const { user } = useUser()
  const { profile } = useProfile(user?.id)
  const { isEvaluador, loading: roleLoading } = useRole()
  const { signingOut, setSigningOut } = useSignOut()
  const { themeMode, setThemeMode } = useTheme()

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() ?? "U"
  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Usuario"
  const sidebar = variant === "sidebar"

  const handleLogout = async () => {
    if (signingOut) return

    try {
      if (!(await confirmUnsavedChanges())) return
    } catch (error) {
      console.error("Could not confirm unsaved changes before sign out:", error)
      toast.error("No se pudo confirmar si hay cambios sin guardar. Inténtalo de nuevo.")
      return
    }

    setSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" })
      if (error) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (session) throw error
        console.error("Local sign out completed with a server revocation error:", error)
        toast.warning("La sesión se cerró, pero no se pudo confirmar con el servidor.")
      }
      router.replace(LOGIN_PATH)
    } catch (error) {
      console.error("Could not sign out:", error)
      setSigningOut(false)
      toast.error("No se pudo cerrar la sesión. Inténtalo de nuevo.")
    }
  }

  return (
    <>
      {user && <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Cuenta de ${displayName}`}
            title={sidebar && isCollapsed ? `Cuenta de ${displayName}` : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-md text-foreground transition-colors hover:bg-accent data-[state=open]:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              sidebar
                ? isCollapsed
                  ? "w-full justify-center px-0"
                  : "w-full gap-3 px-2.5"
                : "max-w-full gap-2 px-2",
            )}
          >
            <AccountAvatar src={profile?.avatar} initials={initials} />
            {(!sidebar || !isCollapsed) && (
              <span className={cn("truncate text-sm font-medium", sidebar ? "min-w-0 flex-1 text-left" : "hidden max-w-32 sm:inline")}>
                {displayName}
              </span>
            )}
            {(!sidebar || !isCollapsed) && (
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={sidebar && !isCollapsed ? "start" : "end"}
          side={sidebar ? (isCollapsed ? "right" : "top") : "bottom"}
          sideOffset={8}
          className={cn(
            "max-w-[calc(100vw-2rem)]",
            sidebar ? "w-[calc(var(--workspace-sidebar-width)-1rem)]" : "w-max",
          )}
        >
          {!roleLoading && !isEvaluador && (
            <>
              <DropdownMenuItem asChild className={accountMenuItemClass}>
                <Link href={SETTINGS_PATH} onClick={onNavigate}>
                  <Settings className="text-muted-foreground" aria-hidden="true" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            className={accountMenuItemClass}
            onSelect={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
          >
            <Moon className="text-muted-foreground" aria-hidden="true" />
            Tema oscuro
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={cn(accountMenuItemClass, "text-destructive focus:bg-destructive/10 focus:text-destructive")}
            disabled={signingOut}
            onSelect={() => { void handleLogout() }}
          >
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </DropdownMenuItem>

          {sidebar && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center justify-between gap-6 text-xs font-normal text-muted-foreground">
                <span>Versión del sistema</span>
                <span className="font-sans tabular-nums">2.0.0</span>
              </DropdownMenuLabel>
              <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                Designed by <span className="font-medium text-foreground">LAHH</span>
              </DropdownMenuLabel>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>}
    </>
  )
}
