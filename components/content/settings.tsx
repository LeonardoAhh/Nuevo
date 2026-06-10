"use client"

import React, { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Moon, Monitor, Palette, Sun, User, Check, AlertCircle,
  Upload, RotateCcw, Bell, Loader2, BellOff, Save, X,
  ChevronRight, Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useTheme, ACCENT_COLOR_MAP, type AccentColor, type Theme } from "@/components/theme-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfile, useUser, useNotificationPreferences } from "@/lib/hooks"
import { profileSchema, ProfileFormData } from "@/lib/validations/profile"
import { AuthForm } from "@/components/auth-form"
import NotificationHistory from "@/components/notification-history"
import { requestPushPermission, unsubscribeFromPush, isPushSubscribed } from "@/lib/supabase/push"
import { useMaintenanceMode } from "@/lib/hooks/useMaintenanceMode"

const ALL_ACCENTS: ReadonlyArray<AccentColor> = [
  "blue", "indigo", "purple", "violet",
  "rose", "pink", "orange", "amber",
  "green", "teal", "cyan", "slate",
]

type Tab = "profile" | "appearance" | "notifications" | "developer"

const NAV_ITEMS_BASE: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "profile",       label: "Perfil",          icon: User,    description: "Nombre, avatar y datos personales" },
  { id: "appearance",    label: "Apariencia",       icon: Palette, description: "Tema, colores y densidad" },
  { id: "notifications", label: "Notificaciones",   icon: Bell,    description: "Alertas y preferencias de push" },
]

// ─── Shared section header ────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
        {title}
      </h2>
      <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
        {description}
      </p>
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="h-px w-full" style={{ background: "hsl(var(--border))" }} />
}

// ─── Row — label + description + control ─────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
  htmlFor,
}: {
  label: string
  description?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        {htmlFor
          ? <Label htmlFor={htmlFor} className="text-sm font-medium cursor-pointer">{label}</Label>
          : <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{label}</p>
        }
        {description && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: "hsl(var(--muted-foreground))" }}>
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ─── Grouped section box ──────────────────────────────────────────────────────
function SettingGroup({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {title && (
        <div
          className="px-4 py-2.5 border-b"
          style={{
            borderColor: "hsl(var(--border))",
            background: "hsl(var(--muted) / 0.5)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            {title}
          </p>
        </div>
      )}
      <div className="px-4 divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
        {children}
      </div>
    </div>
  )
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────
function ProfileTab({
  user, profile, profileLoading, userLoading, profileError,
}: {
  user: any; profile: any; profileLoading: boolean; userLoading: boolean; profileError: string | null
}) {
  const [showSaved, setShowSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateProfile, uploadAvatar } = useProfile(user?.id)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", displayName: "", email: "", language: "en", dateFormat: "mm-dd-yyyy" },
  })

  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        email: profile.email,
        language: profile.language || "en",
        dateFormat: profile.dateFormat || "mm-dd-yyyy",
      })
    }
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaveError(null)
      const result = await updateProfile(data)
      if (result.success) {
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 3000)
      } else {
        setSaveError(result.error || "No se pudo guardar el perfil")
      }
    } catch {
      setSaveError("Ocurrió un error inesperado")
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploadingAvatar(true)
      setSaveError(null)
      const result = await uploadAvatar(file)
      if (result.success) {
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 3000)
      } else {
        setSaveError(result.error || "No se pudo subir la imagen")
      }
    } catch {
      setSaveError("Ocurrió un error inesperado")
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(var(--primary))" }} />
        <span className="ml-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Cargando perfil…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Perfil" description="Tu información personal y foto de perfil." />

      {showSaved && (
        <Alert className="border-success/30 bg-success/10">
          <Check className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">Perfil actualizado con éxito.</AlertDescription>
        </Alert>
      )}
      {(saveError || profileError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError || profileError}</AlertDescription>
        </Alert>
      )}

      {/* Avatar */}
      <SettingGroup title="Foto de perfil">
        <div className="py-4 flex items-center gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={profile?.avatar || "/diverse-group-city.png"} alt="Avatar" />
            <AvatarFallback>
              {profile ? `${profile.firstName[0]}${profile.lastName[0]}` : "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
              {profile ? `${profile.firstName} ${profile.lastName}` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              JPG, PNG o GIF · máx. 2 MB · imagen cuadrada recomendada
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Upload className="h-3 w-3" />}
              {isUploadingAvatar ? "Subiendo…" : "Cambiar foto"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>
      </SettingGroup>

      {/* Form */}
      <form id="profile-form" onSubmit={handleSubmit(onSubmit)}>
        <SettingGroup title="Datos personales">
          <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="first-name" className="text-xs font-medium">Nombre *</Label>
              <Input
                id="first-name"
                {...register("firstName")}
                className={cn("text-base md:text-sm h-9", errors.firstName && "border-destructive")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last-name" className="text-xs font-medium">Apellido *</Label>
              <Input
                id="last-name"
                {...register("lastName")}
                className={cn("text-base md:text-sm h-9", errors.lastName && "border-destructive")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="text-xs font-medium">Nombre visible *</Label>
              <Input
                id="display-name"
                {...register("displayName")}
                className={cn("text-base md:text-sm h-9", errors.displayName && "border-destructive")}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">{errors.displayName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                readOnly
                className="cursor-not-allowed opacity-60 h-9"
              />
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                Gestionado por tu proveedor de autenticación.
              </p>
            </div>
          </div>
        </SettingGroup>
      </form>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          <X className="h-3.5 w-3.5" />
          Descartar
        </Button>
        <Button
          type="submit"
          form="profile-form"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={isSubmitting || profileLoading}
        >
          {isSubmitting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Save className="h-3.5 w-3.5" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}

// ─── APPEARANCE TAB ───────────────────────────────────────────────────────────
function AppearanceTab() {
  const { theme, accentColor, fontSize, density, reducedMotion, setTheme, setAccentColor, setFontSize, setDensity, setReducedMotion, resetTheme } = useTheme()

  return (
    <div className="space-y-5">
      <SectionHeader title="Apariencia" description="Personaliza cómo se ve la aplicación en tu dispositivo." />

      {/* Theme mode */}
      <SettingGroup title="Modo de color">
        <div className="py-3">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "light" as Theme, label: "Claro",   Icon: Sun,     iconBg: "bg-background border",  iconFg: "text-foreground" },
                { value: "dark"  as Theme, label: "Oscuro",  Icon: Moon,    iconBg: "bg-foreground border",  iconFg: "text-background" },
                { value: "system"as Theme, label: "Sistema", Icon: Monitor, iconBg: "bg-muted border",       iconFg: "text-foreground" },
              ] as const
            ).map(({ value, label, Icon, iconBg, iconFg }) => {
              const selected = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3 px-2 rounded-lg border transition-all text-center",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent/40"
                  )}
                >
                  <div className={cn("p-2 rounded-full shadow-sm", iconBg)}>
                    <Icon className={cn("h-5 w-5", iconFg)} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>{label}</span>
                  {selected && (
                    <span className="sr-only">(seleccionado)</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </SettingGroup>

      {/* Accent */}
      <SettingGroup title="Color de acento">
        <div className="py-3 space-y-3">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {ALL_ACCENTS.map((name) => {
              const { primary, label } = ACCENT_COLOR_MAP[name]
              return (
                <TooltipProvider key={name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-pressed={accentColor === name}
                        aria-label={`Acento ${label}`}
                        className={cn(
                          "h-8 w-full rounded-lg border-2 flex items-center justify-center transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          accentColor === name
                            ? "border-foreground scale-110 shadow-md"
                            : "border-transparent hover:scale-105 hover:shadow-sm",
                        )}
                        style={{ backgroundColor: `hsl(${primary})` }}
                        onClick={() => setAccentColor(name)}
                      >
                        {accentColor === name && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>{label}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Afecta botones, enlaces y elementos interactivos.
          </p>
        </div>
      </SettingGroup>

      {/* Display settings */}
      <SettingGroup title="Pantalla">
        <SettingRow label="Tamaño de fuente" description="Ajusta el tamaño del texto en toda la app.">
          <Select value={fontSize} onValueChange={(v) => setFontSize(v as "small" | "medium" | "large")}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeño</SelectItem>
              <SelectItem value="medium">Mediano</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow label="Densidad" description="Reduce el espaciado para mostrar más contenido.">
          <Select value={density} onValueChange={(v) => setDensity(v as "comfortable" | "compact")}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Cómoda</SelectItem>
              <SelectItem value="compact">Compacta</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          label="Movimiento reducido"
          description="Minimiza animaciones y transiciones."
          htmlFor="reduced-motion"
        >
          <Switch id="reduced-motion" checked={reducedMotion} onCheckedChange={setReducedMotion} />
        </SettingRow>
      </SettingGroup>

      {/* Preview */}
      <SettingGroup title="Vista previa">
        <div className="py-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="text-xs h-8">Primario</Button>
            <Button size="sm" variant="outline" className="text-xs h-8">Secundario</Button>
            <Button size="sm" variant="ghost" className="text-xs h-8">Fantasma</Button>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="preview-sw" />
            <Label htmlFor="preview-sw" className="text-xs">Interruptor</Label>
            <Badge className="text-xs">Etiqueta</Badge>
            <Badge variant="outline" className="text-xs">Contorno</Badge>
          </div>
        </div>
      </SettingGroup>

      {/* Reset */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={resetTheme}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restablecer valores
        </Button>
      </div>
    </div>
  )
}

// ─── NOTIFICATIONS TAB ────────────────────────────────────────────────────────
function NotificationsTab({ userId }: { userId?: string }) {
  const [notifSaved, setNotifSaved] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const { preferences: notifPrefs, loading: notifLoading, saving: notifSaving, updatePreference, savePreferences } = useNotificationPreferences(userId)

  React.useEffect(() => {
    isPushSubscribed().then(setPushSubscribed).catch(() => {})
  }, [])

  const handleTogglePush = async () => {
    setPushLoading(true)
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush()
        setPushSubscribed(false)
      } else {
        const ok = await requestPushPermission()
        setPushSubscribed(ok)
      }
    } finally {
      setPushLoading(false)
    }
  }

  const alertItems = [
    { key: "pushBajas",        label: "Baja registrada",           desc: "Push inmediato al registrar una baja" },
    { key: "pushBajasWarning", label: "Aviso anticipado de baja",  desc: "3 días, 1 día y el día exacto" },
    { key: "pushRg",           label: "RG-REC-048 por vencer",     desc: "7 días, 3 días y el día del vencimiento" },
    { key: "pushContrato",     label: "Término de contrato",       desc: "7 días, 3 días y el día del vencimiento" },
  ] as const

  return (
    <div className="space-y-5">
      <SectionHeader title="Notificaciones" description="Gestiona alertas y permisos de notificación push." />

      {notifSaved && (
        <Alert className="border-success/30 bg-success/10">
          <Check className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">Preferencias guardadas.</AlertDescription>
        </Alert>
      )}

      {/* Push device toggle */}
      <SettingGroup title="Este dispositivo">
        <SettingRow
          label={pushSubscribed ? "Push activadas" : "Push desactivadas"}
          description={
            pushSubscribed
              ? "Recibirás alertas aunque la app esté cerrada."
              : "Actívalas para recibir alertas en segundo plano."
          }
        >
          <div className="flex items-center gap-2">
            {pushSubscribed
              ? <Badge variant="outline" className="text-xs border-success/40 text-success bg-success/10">Activo</Badge>
              : <Badge variant="outline" className="text-xs">Inactivo</Badge>
            }
            <Button
              variant={pushSubscribed ? "outline" : "default"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={pushLoading}
              onClick={handleTogglePush}
            >
              {pushLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : pushSubscribed
                  ? <><BellOff className="h-3.5 w-3.5" />Desactivar</>
                  : <><Bell className="h-3.5 w-3.5" />Activar</>
              }
            </Button>
          </div>
        </SettingRow>
      </SettingGroup>

      {/* Alert preferences */}
      <SettingGroup title="Alertas de empleados">
        {alertItems.map(({ key, label, desc }) => (
          <SettingRow key={key} label={label} description={desc} htmlFor={`notif-${key}`}>
            <Switch
              id={`notif-${key}`}
              checked={notifPrefs[key]}
              onCheckedChange={(v) => updatePreference(key, v)}
              disabled={notifLoading}
            />
          </SettingRow>
        ))}
        <div className="py-3 flex justify-between items-center">
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            Solo aplica a roles admin y dev.
          </p>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={notifSaving || notifLoading}
            onClick={async () => {
              const result = await savePreferences()
              if (result?.success) {
                setNotifSaved(true)
                setTimeout(() => setNotifSaved(false), 3000)
              }
            }}
          >
            {notifSaving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : notifSaved
                ? <Check className="h-3.5 w-3.5" />
                : <Save className="h-3.5 w-3.5" />
            }
            Guardar
          </Button>
        </div>
      </SettingGroup>

      {/* History */}
      <NotificationHistory />
    </div>
  )
}

// ─── DEVELOPER TAB ────────────────────────────────────────────────────────────
function DeveloperTab() {
  const { isMaintenance, toggleMaintenance, loading } = useMaintenanceMode()
  
  return (
    <div className="space-y-5">
      <SectionHeader title="Desarrollador" description="Peligro: Opciones avanzadas de control global del sistema." />
      
      <SettingGroup title="Control de Sistema">
        <SettingRow 
          label="Modo Mantenimiento" 
          description="Al activar, todos los usuarios en producción serán bloqueados y verán la pantalla de mantenimiento. Tú seguirás teniendo acceso si estás en localhost."
          htmlFor="maintenance-sw"
        >
          <Switch 
            id="maintenance-sw" 
            checked={isMaintenance} 
            onCheckedChange={toggleMaintenance} 
            disabled={loading}
          />
        </SettingRow>
      </SettingGroup>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab")
      return (p as Tab) || "profile"
    }
    return "profile"
  })

  const { user, loading: userLoading } = useUser()
  const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id)

  if (!user && !userLoading) return <AuthForm />

  const isDev = user?.email === "leo@adm.com"
  const navItems = isDev 
    ? [...NAV_ITEMS_BASE, { id: "developer" as Tab, label: "Desarrollador", icon: Wrench, description: "Control y mantenimiento" }]
    : NAV_ITEMS_BASE

  return (
    <>
      <style>{`
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          border-radius: 0.5rem;
          transition: background 0.12s ease, color 0.12s ease;
          cursor: pointer;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
        }
        .settings-nav-item:hover:not(.active) {
          background: hsl(var(--accent) / 0.6);
        }
        .settings-nav-item.active {
          background: hsl(var(--primary) / 0.1);
          color: hsl(var(--primary));
        }
        .settings-nav-item.active .nav-icon {
          color: hsl(var(--primary));
        }
        .settings-nav-item:not(.active) .nav-icon {
          color: hsl(var(--muted-foreground));
        }
      `}</style>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 min-h-0">

        {/* ── Sidebar (desktop) / Horizontal strip (mobile) ── */}
        <nav
          className={cn(
            /* Mobile: horizontal scroll strip */
            "flex flex-row md:flex-col gap-1",
            "overflow-x-auto md:overflow-x-visible",
            "pb-1 md:pb-0",
            /* Desktop */
            "md:w-52 md:shrink-0",
          )}
          aria-label="Secciones de configuración"
        >
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn("settings-nav-item", active && "active")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="nav-icon h-4 w-4 shrink-0" />
                <span className={cn(
                  "text-sm whitespace-nowrap",
                  active ? "font-semibold" : "font-medium",
                  !active && "text-foreground"
                )}>
                  {label}
                </span>
                {/* Chevron solo en desktop */}
                {active && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 hidden md:block shrink-0 opacity-60" style={{ color: "hsl(var(--primary))" }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Separator desktop */}
        <div
          className="hidden md:block w-px self-stretch"
          style={{ background: "hsl(var(--border))" }}
        />

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <ProfileTab
              user={user}
              profile={profile}
              profileLoading={profileLoading}
              userLoading={userLoading}
              profileError={profileError}
            />
          )}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "notifications" && <NotificationsTab userId={user?.id} />}
          {activeTab === "developer" && isDev && <DeveloperTab />}
        </div>
      </div>
    </>
  )
}
