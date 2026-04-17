"use client"

import React, { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Moon,
  Monitor,
  Palette,
  Sun,
  User,
  Check,
  Paintbrush,
  AlertCircle,
  Upload,
  RotateCcw,
  Bell,
  Loader2,
  BellOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useTheme, ACCENT_COLOR_MAP, type AccentColor, type Theme } from "@/components/theme-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ColorPicker } from "@/components/color-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfile, useUser, useNotificationPreferences } from "@/lib/hooks"
import { profileSchema, ProfileFormData } from "@/lib/validations/profile"
import { AuthForm } from "@/components/auth-form"
import NotificationHistory from "@/components/notification-history"
import { requestPushPermission, unsubscribeFromPush, isPushSubscribed } from "@/lib/supabase/push"

type PresetAccent = Exclude<AccentColor, "custom">

const PRESET_ACCENTS: ReadonlyArray<PresetAccent> = ["blue", "purple", "green", "orange", "pink", "yellow"]

const YELLOW_USES_DARK_TEXT = new Set<PresetAccent>(["yellow"])

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return params.get("tab") || "profile"
    }
    return "profile"
  })
  const { theme, accentColor, customColor, fontSize, density, reducedMotion, setTheme, setAccentColor, setCustomColor, setFontSize, setDensity, setReducedMotion, isColorLight, resetTheme } = useTheme()
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook para usuario autenticado
  const { user, loading: userLoading } = useUser()

  // Hooks para API
  const { profile, loading: profileLoading, error: profileError, updateProfile, uploadAvatar, updateThemePreferences } = useProfile(user?.id)
  const { preferences: notifPrefs, loading: notifLoading, saving: notifSaving, updatePreference: updateNotifPref, savePreferences: saveNotifPrefs } = useNotificationPreferences(user?.id)
  const [notifSaved, setNotifSaved] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  // Verificar estado de suscripción push al abrir el tab
  React.useEffect(() => {
    if (activeTab !== "notifications") return
    isPushSubscribed().then(setPushSubscribed).catch(() => {})
  }, [activeTab])

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

  // Formulario unificado de perfil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      displayName: "",
      email: "",
      language: "en",
      dateFormat: "mm-dd-yyyy",
    },
  })

  // Sincronizar formulario cuando se carga el perfil
  React.useEffect(() => {
    if (profile) {
      resetProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        email: profile.email,
        language: profile.language || "en",
        dateFormat: profile.dateFormat || "mm-dd-yyyy",
      })
    }
  }, [profile, resetProfile])

  // Funciones para manejar formularios
  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setSaveError(null)
      const result = await updateProfile(data)
      if (result.success) {
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), 3000)
      } else {
        setSaveError(result.error || "Failed to save profile")
      }
    } catch (error) {
      setSaveError("An unexpected error occurred")
    }
  }


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingAvatar(true)
      setSaveError(null)

      const result = await uploadAvatar(file)

      if (result.success) {
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), 3000)
      } else {
        setSaveError(result.error || "Failed to upload avatar")
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setSaveError("An unexpected error occurred")
    } finally {
      setIsUploadingAvatar(false)
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Direct application of theme changes
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColor(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    setAccentColor("custom")
  }

  // Debounced sync of theme preferences to Supabase
  React.useEffect(() => {
    if (!user?.id) return
    const timer = setTimeout(() => {
      updateThemePreferences({ theme, accentColor, customColor, fontSize, density, reducedMotion })
    }, 500)
    return () => clearTimeout(timer)
  }, [theme, accentColor, customColor, fontSize, density, reducedMotion, user?.id])

  // Load theme preferences from Supabase on mount
  React.useEffect(() => {
    if (!profile?.themePreferences || Object.keys(profile.themePreferences).length === 0) return
    const p = profile.themePreferences
    if (p.theme) setTheme(p.theme as Theme)
    if (p.accentColor) setAccentColor(p.accentColor as AccentColor)
    if (p.customColor) setCustomColor(p.customColor)
    if (p.fontSize) setFontSize(p.fontSize as "small" | "medium" | "large")
    if (p.density) setDensity(p.density as "comfortable" | "compact")
    if (p.reducedMotion !== undefined) setReducedMotion(p.reducedMotion)
  }, [profile?.id])

  // Si no hay usuario autenticado, mostrar formulario de login
  if (!user && !userLoading) {
    return <AuthForm />
  }

  return (
    <>
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex w-full">
          <TabsTrigger value="profile" className="flex-1 text-xs sm:text-sm">
            <User className="mr-1 sm:mr-2 h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 text-xs sm:text-sm">
            <Palette className="mr-1 sm:mr-2 h-4 w-4" />
            <span>Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 text-xs sm:text-sm">
            <Bell className="mr-1 sm:mr-2 h-4 w-4" />
            <span>Notificaciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          {/* Loading State */}
          {(userLoading || profileLoading) && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Cargando perfil...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success/Error Messages */}
          {showSavedMessage && (
            <Alert className="border-success/30 bg-success/10">
              <Check className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                ¡Perfil actualizado con éxito!
              </AlertDescription>
            </Alert>
          )}

          {(saveError || profileError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {saveError || profileError}
              </AlertDescription>
            </Alert>
          )}

          {!profileLoading && !userLoading && (
            <>
              <Card>
            <CardHeader>
              <CardTitle>Información de perfil</CardTitle>
              <CardDescription>
                Actualiza tu información personal y tu foto de perfil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar || "/diverse-group-city.png"} alt="Profile" />
                  <AvatarFallback>
                    {profile ? `${profile.firstName[0]}${profile.lastName[0]}` : "JK"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Cambiar avatar
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF o PNG. Tamaño máximo 2MB. Se recomienda imagen cuadrada.
                  </p>
                </div>
              </div>

              <form id="profile-form" onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">
                      Nombre *
                    </Label>
                    <Input
                      id="first-name"
                      {...registerProfile("firstName")}
                      className={cn(
                        "text-base md:text-sm",
                        profileErrors.firstName && "border-red-500"
                      )}
                    />
                    {profileErrors.firstName && (
                      <p className="text-sm text-destructive">{profileErrors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">
                      Apellido *
                    </Label>
                    <Input
                      id="last-name"
                      {...registerProfile("lastName")}
                      className={cn(
                        "text-base md:text-sm",
                        profileErrors.lastName && "border-red-500"
                      )}
                    />
                    {profileErrors.lastName && (
                      <p className="text-sm text-destructive">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">
                      Nombre visible *
                    </Label>
                    <Input
                      id="display-name"
                      {...registerProfile("displayName")}
                      className={cn(
                        "text-base md:text-sm",
                        profileErrors.displayName && "border-red-500"
                      )}
                    />
                    {profileErrors.displayName && (
                      <p className="text-sm text-destructive">{profileErrors.displayName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      readOnly
                      className="cursor-not-allowed opacity-70"
                    />
                    <p className="text-xs text-muted-foreground">
                      El email se gestiona desde tu proveedor de autenticación.
                    </p>
                  </div>
                </div>

              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => resetProfile()}
                disabled={isSubmittingProfile}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="profile-form"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmittingProfile || profileLoading}
              >
                {isSubmittingProfile ? "Guardando..." : "Guardar cambios"}
              </Button>
            </CardFooter>
          </Card>
            </>
          )}
        </TabsContent>




        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Modo de color</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors",
                      theme === "light" ? "border-primary bg-primary/10" : "border-border"
                    )}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="bg-background border shadow-sm p-2 rounded-full">
                      <Sun className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="font-medium text-sm">Claro</span>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors",
                      theme === "dark" ? "border-primary bg-primary/10" : "border-border"
                    )}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="bg-foreground border shadow-sm p-2 rounded-full">
                      <Moon className="h-6 w-6 text-background" />
                    </div>
                    <span className="font-medium text-sm">Oscuro</span>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors",
                      theme === "system" ? "border-primary bg-primary/10" : "border-border"
                    )}
                    onClick={() => handleThemeChange("system")}
                  >
                    <div className="bg-muted border shadow-sm p-2 rounded-full">
                      <Monitor className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="font-medium text-sm">Sistema</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Color de acento</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PRESET_ACCENTS.map((name) => {
                    const { primary } = ACCENT_COLOR_MAP[name]
                    const checkTextClass = YELLOW_USES_DARK_TEXT.has(name) ? "text-black" : "text-white"
                    return (
                      <TooltipProvider key={name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                "h-12 w-full rounded-md border-2 flex items-center justify-center transition-all",
                                accentColor === name
                                  ? "border-foreground scale-105"
                                  : "border-transparent hover:scale-105",
                              )}
                              style={{ backgroundColor: `hsl(${primary})` }}
                              onClick={() => handleAccentColorChange(name)}
                            >
                              {accentColor === name && <Check className={cn("h-6 w-6", checkTextClass)} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="capitalize">{name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}

                  {/* Custom color option */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "h-12 w-full rounded-md border-2 flex items-center justify-center transition-all relative overflow-hidden",
                            accentColor === "custom"
                              ? "border-foreground scale-105"
                              : "border-transparent hover:scale-105",
                          )}
                          onClick={() => handleAccentColorChange("custom")}
                          style={{ backgroundColor: customColor }}
                        >
                          {accentColor === "custom" && (
                            <Check className={cn("h-6 w-6", isColorLight(customColor) ? "text-black" : "text-white")} />
                          )}
                          <Paintbrush className="h-5 w-5 absolute top-1 right-1 text-white drop-shadow-md" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Custom</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecciona un color de acento para personalizar tu tablero.
                </p>
              </div>

              {/* Custom Color Picker Section */}
              {accentColor === "custom" && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <Label className="text-base">Color personalizado</Label>
                  <ColorPicker onColorChange={handleCustomColorChange} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Tamaño de fuente</Label>
                <Select value={fontSize} onValueChange={(v) => setFontSize(v as "small" | "medium" | "large")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeño</SelectItem>
                    <SelectItem value="medium">Mediano</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Densidad</Label>
                <Select value={density} onValueChange={(v) => setDensity(v as "comfortable" | "compact")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la densidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Cómoda</SelectItem>
                    <SelectItem value="compact">Compacta</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Reduce el espaciado general de la interfaz.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Movimiento reducido</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce la cantidad de animaciones y efectos de movimiento.
                  </p>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="gap-2"
                onClick={resetTheme}
              >
                <RotateCcw className="h-4 w-4" />
                Restablecer valores por defecto
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vista previa del tema</CardTitle>
              <CardDescription>
                Vista previa de cómo se verá el tema seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Componentes UI</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Button className="w-full">Botón primario</Button>
                      <Button variant="outline" className="w-full">
                        Botón secundario
                      </Button>
                      <Button variant="ghost" className="w-full">
                        Botón fantasma
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-card border rounded-md">
                        <p className="text-sm">Componente tarjeta</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="preview-switch" />
                        <Label htmlFor="preview-switch">
                          Interruptor
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Badge>Predeterminado</Badge>
                        <Badge variant="outline">Contorno</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications" className="space-y-4">
          {notifSaved && (
            <Alert className="border-success/30 bg-success/10">
              <Check className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">¡Preferencias de notificación guardadas!</AlertDescription>
            </Alert>
          )}

          {/* Fila superior: 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

            {/* Col 1 — Push subscription toggle */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {pushSubscribed ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                  Notificaciones push
                </CardTitle>
                <CardDescription>
                  Recibe alertas en este dispositivo aunque la app esté cerrada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {pushSubscribed ? "Activadas en este dispositivo" : "Desactivadas en este dispositivo"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pushSubscribed
                        ? "Recibirás notificaciones push aunque no tengas la app abierta."
                        : "Actívalas para recibir alertas aunque no tengas la app abierta."}
                    </p>
                  </div>
                  <Button
                    variant={pushSubscribed ? "outline" : "default"}
                    size="sm"
                    disabled={pushLoading}
                    onClick={handleTogglePush}
                    className="ml-4 shrink-0"
                  >
                    {pushLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : pushSubscribed ? "Desactivar" : "Activar push"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Col 2 — Alertas de empleados */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Alertas de empleados</CardTitle>
                <CardDescription>Solo aplica a usuarios con rol admin o dev.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Baja registrada</Label>
                    <p className="text-xs text-muted-foreground">Push inmediato al registrar una baja</p>
                  </div>
                  <Switch
                    checked={notifPrefs.pushBajas}
                    onCheckedChange={(v) => updateNotifPref("pushBajas", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Aviso anticipado de baja</Label>
                    <p className="text-xs text-muted-foreground">3 días, 1 día y el día exacto</p>
                  </div>
                  <Switch
                    checked={notifPrefs.pushBajasWarning}
                    onCheckedChange={(v) => updateNotifPref("pushBajasWarning", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">RG-REC-048 por vencer</Label>
                    <p className="text-xs text-muted-foreground">7 días, 3 días y el día del vencimiento</p>
                  </div>
                  <Switch
                    checked={notifPrefs.pushRg}
                    onCheckedChange={(v) => updateNotifPref("pushRg", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Término de contrato</Label>
                    <p className="text-xs text-muted-foreground">7 días, 3 días y el día del vencimiento</p>
                  </div>
                  <Switch
                    checked={notifPrefs.pushContrato}
                    onCheckedChange={(v) => updateNotifPref("pushContrato", v)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  disabled={notifSaving || notifLoading}
                  onClick={async () => {
                    const result = await saveNotifPrefs()
                    if (result?.success) {
                      setNotifSaved(true)
                      setTimeout(() => setNotifSaved(false), 3000)
                    }
                  }}
                >
                  {notifSaving ? "Guardando…" : notifSaved ? "Guardado" : "Guardar preferencias"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Fila inferior: historial a ancho completo */}
          <NotificationHistory />
        </TabsContent>
      </Tabs>
    </>
  )
}
