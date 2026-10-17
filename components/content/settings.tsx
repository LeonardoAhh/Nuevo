"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Palette, User, Check, AlertCircle,
  Upload, RotateCcw, Loader2, Save, X,
  ArrowRight, Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useTheme, ACCENT_COLOR_MAP, type AccentColor } from "@/components/theme-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfile, useUser } from "@/lib/hooks"
import { profileSchema, ProfileFormData } from "@/lib/validations/profile"
import { AuthForm } from "@/components/auth-form"
import { useMaintenanceMode } from "@/lib/hooks/useMaintenanceMode"
import { hasPrivateDeveloperAccess } from "@/lib/auth/private-developer"
import { ASSIGNMENTS_PATH } from "@/lib/navigation"

const ALL_ACCENTS: ReadonlyArray<AccentColor> = [
  "monochrome", "blue", "violet", "pink", "magenta", "green",
]

type Tab = "profile" | "appearance" | "developer"

const NAV_ITEMS_BASE: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "profile",       label: "Perfil",          icon: User,    description: "Nombre, avatar y datos personales" },
  { id: "appearance",    label: "Apariencia",       icon: Palette, description: "Colores y densidad" },
]

// ─── Shared section header ────────────────────────────────────────────────────
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
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
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        {htmlFor
          ? <Label htmlFor={htmlFor} className="text-sm font-medium cursor-pointer">{label}</Label>
          : <p className="text-sm font-medium text-foreground">{label}</p>
        }
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {title && (
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-mono text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {title}
          </h3>
        </div>
      )}
      <div className="divide-y divide-border px-5">
        {children}
      </div>
    </section>
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
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span>Cargando perfil…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
        <div className="flex flex-wrap items-center gap-4 py-5">
          <Avatar className="size-16 shrink-0">
            {profile?.avatar && <AvatarImage src={profile.avatar} alt="Foto de perfil" />}
            <AvatarFallback className="bg-muted text-foreground">
              {profile ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}` || "U" : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {profile ? `${profile.firstName} ${profile.lastName}` : "—"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              JPG, PNG o GIF · máx. 2 MB · imagen cuadrada recomendada
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 min-h-10 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar
                ? <Loader2 className="size-4 animate-spin" />
                : <Upload className="size-4" />}
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
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 py-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first-name" className="text-sm font-medium">Nombre *</Label>
              <Input
                id="first-name"
                {...register("firstName")}
                className={cn(errors.firstName && "border-destructive")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last-name" className="text-sm font-medium">Apellido *</Label>
              <Input
                id="last-name"
                {...register("lastName")}
                className={cn(errors.lastName && "border-destructive")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="text-sm font-medium">Nombre visible *</Label>
              <Input
                id="display-name"
                {...register("displayName")}
                className={cn(errors.displayName && "border-destructive")}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive">{errors.displayName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                readOnly
                className="bg-muted/30 text-muted-foreground"
              />
            </div>
          </div>
        </SettingGroup>
      </form>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 gap-2"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          <X className="size-4" />
          Descartar
        </Button>
        <Button
          type="submit"
          form="profile-form"
          className="min-h-11 gap-2"
          disabled={isSubmitting || profileLoading}
        >
          {isSubmitting
            ? <Loader2 className="size-4 animate-spin" />
            : <Save className="size-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}

// ─── APPEARANCE TAB ───────────────────────────────────────────────────────────
function AppearanceTab() {
  const { accentColor, fontSize, density, reducedMotion, setAccentColor, setFontSize, setDensity, setReducedMotion, resetTheme } = useTheme()

  return (
    <div className="space-y-6">
      <SectionHeader title="Apariencia" description="Personaliza cómo se ve la aplicación en tu dispositivo." />

      {/* Accent */}
      <SettingGroup title="Color de acento">
        <div className="space-y-3 py-5">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ALL_ACCENTS.map((name) => {
              const { accent, accentForeground, label } = ACCENT_COLOR_MAP[name]
              return (
                <TooltipProvider key={name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-pressed={accentColor === name}
                        aria-label={`Acento ${label}`}
                        className={cn(
                          "flex min-h-10 w-full items-center justify-center rounded-md border-2 transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          accentColor === name
                            ? "border-foreground"
                            : "border-transparent hover:border-border",
                        )}
                        style={{ backgroundColor: `hsl(${accent})` }}
                        onClick={() => setAccentColor(name)}
                      >
                        {accentColor === name && (
                          <Check className="size-4" style={{ color: `hsl(${accentForeground})` }} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>{label}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Afecta la navegación activa, indicadores y foco. Los botones primarios conservan la tinta del sistema.
          </p>
        </div>
      </SettingGroup>

      {/* Display settings */}
      <SettingGroup title="Pantalla">
        <SettingRow label="Tamaño de fuente" description="Ajusta el tamaño del texto en toda la app.">
          <Select value={fontSize} onValueChange={(v) => setFontSize(v as "small" | "medium" | "large")}>
            <SelectTrigger className="w-36 text-sm">
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
            <SelectTrigger className="w-36 text-sm">
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
        <div className="space-y-4 py-5">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primario</Button>
            <Button size="sm" variant="outline">Secundario</Button>
            <Button size="sm" variant="ghost">Fantasma</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Switch id="preview-sw" defaultChecked />
            <Label htmlFor="preview-sw" className="text-sm">Interruptor</Label>
            <Badge className="text-xs">Tinta</Badge>
            <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
              Acento
            </span>
            <Badge variant="outline" className="text-xs">Contorno</Badge>
          </div>
        </div>
      </SettingGroup>

      {/* Reset */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="min-h-11 gap-2"
          onClick={resetTheme}
        >
          <RotateCcw className="size-4" />
          Restablecer valores
        </Button>
      </div>
    </div>
  )
}

// ─── NOTIFICATIONS TAB ────────────────────────────────────────────────────────
// ─── DEVELOPER TAB ────────────────────────────────────────────────────────────
function DeveloperTab() {
  const { isMaintenance, endsAt, toggleMaintenance, loading, saving, saveError } = useMaintenanceMode()
  const [duration, setDuration] = useState("30")
  const [unit, setUnit] = useState("60")
  const [feedback, setFeedback] = useState("")
  const seconds = Number(duration) * Number(unit)
  const validDuration = duration.trim() !== "" && Number.isFinite(seconds) && seconds >= 1 && seconds <= 365 * 86400
  const saveMaintenance = async (active: boolean) => {
    setFeedback("")
    const success = await toggleMaintenance(active, seconds)
    setFeedback(success
      ? active ? "Mantenimiento guardado. El contador comienza desde ahora." : "Mantenimiento desactivado."
      : "")
  }

  return (
    <div className="space-y-6">
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
            onCheckedChange={saveMaintenance}
            disabled={loading || saving || (!isMaintenance && !validDuration)}
          />
        </SettingRow>
        <div className="space-y-3 py-4">
          <Label htmlFor="maintenance-duration">Duración estimada</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              id="maintenance-duration"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={event => setDuration(event.target.value)}
              disabled={loading || saving}
              aria-invalid={!validDuration}
              aria-describedby="maintenance-duration-help"
              className="w-28"
            />
            <Select value={unit} onValueChange={setUnit} disabled={loading || saving}>
              <SelectTrigger className="w-36" aria-label="Unidad de duración"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Segundos</SelectItem>
                <SelectItem value="60">Minutos</SelectItem>
                <SelectItem value="3600">Horas</SelectItem>
                <SelectItem value="86400">Días</SelectItem>
              </SelectContent>
            </Select>
            {isMaintenance && (
              <Button onClick={() => saveMaintenance(true)} disabled={loading || saving || !validDuration}>
                {saving ? "Guardando…" : "Reiniciar contador"}
              </Button>
            )}
          </div>
          <p id="maintenance-duration-help" className="text-xs text-muted-foreground">
            {validDuration ? "El contador comienza al activar o reiniciar. Al llegar a cero, el mantenimiento sigue activo hasta que lo desactives." : "Introduce una duración entre 1 segundo y 365 días."}
          </p>
          {isMaintenance && endsAt && Number.isFinite(Date.parse(endsAt)) && (
            <p className="text-xs text-muted-foreground">Fin estimado: {new Date(endsAt).toLocaleString("es-MX")}</p>
          )}
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          {feedback && <p role="status" className="text-sm">{feedback}</p>}
        </div>
      </SettingGroup>

      <SettingGroup title="Evaluaciones">
        <SettingRow
          label="Asignaciones de evaluadores"
          description="Elige las áreas y personas que puede evaluar cada cuenta."
        >
          <Button asChild variant="outline" className="min-h-11">
            <Link href={ASSIGNMENTS_PATH}>
              Abrir asignaciones
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
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
      return p === "appearance" || p === "developer" ? p : "profile"
    }
    return "profile"
  })

  const { user, loading: userLoading } = useUser()
  const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id)

  if (!user && !userLoading) return <AuthForm />

  const isDev = hasPrivateDeveloperAccess(user?.email)
  const navItems = isDev
    ? [...NAV_ITEMS_BASE, { id: "developer" as Tab, label: "Desarrollador", icon: Wrench, description: "Control y mantenimiento" }]
    : NAV_ITEMS_BASE
  const visibleTab = activeTab === "developer" && !isDev ? "profile" : activeTab

  return (
    <div className="flex min-h-0 flex-col gap-6 md:flex-row md:gap-8">

        {/* ── Sidebar (desktop) / Horizontal strip (mobile) ── */}
        <nav
          className="flex flex-wrap gap-2 border-b border-border pb-4 md:w-52 md:shrink-0 md:flex-col md:flex-nowrap md:gap-1 md:border-b-0 md:border-r md:pb-0 md:pr-6"
          aria-label="Secciones de configuración"
        >
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = visibleTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-full",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
                aria-pressed={active}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* ── Content ── */}
        <div className="min-w-0 flex-1">
          {visibleTab === "profile" && (
            <ProfileTab
              user={user}
              profile={profile}
              profileLoading={profileLoading}
              userLoading={userLoading}
              profileError={profileError}
            />
          )}
          {visibleTab === "appearance" && <AppearanceTab />}
          {visibleTab === "developer" && isDev && <DeveloperTab />}
        </div>
    </div>
  )
}
