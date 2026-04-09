"use client"

import React, { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Moon,
  Palette,
  Sun,
  User,
  Check,
  Paintbrush,
  AlertCircle,
  Upload,
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
import { useTheme } from "@/components/theme-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ColorPicker } from "@/components/color-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProfile, useUser } from "@/lib/hooks"
import { profileSchema, ProfileFormData } from "@/lib/validations/profile"
import { AuthForm } from "@/components/auth-form"

type AccentColor = "blue" | "purple" | "green" | "orange" | "pink" | "yellow" | "custom"

interface ColorOption {
  name: AccentColor
  value: string
  textColor: string
}

const colorOptions: ColorOption[] = [
  { name: "blue", value: "bg-blue-500", textColor: "text-white" },
  { name: "purple", value: "bg-purple-500", textColor: "text-white" },
  { name: "green", value: "bg-green-500", textColor: "text-white" },
  { name: "orange", value: "bg-orange-500", textColor: "text-white" },
  { name: "pink", value: "bg-pink-500", textColor: "text-white" },
  { name: "yellow", value: "bg-yellow-500", textColor: "text-black" },
]

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState("profile")
  const { theme, accentColor, customColor, fontSize, reducedMotion, setTheme, setAccentColor, setCustomColor, setFontSize, setReducedMotion, isColorLight } = useTheme()
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook para usuario autenticado
  const { user, loading: userLoading } = useUser()

  // Hooks para API
  const { profile, loading: profileLoading, error: profileError, updateProfile, uploadAvatar } = useProfile(user?.id)

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
  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
  }

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColor(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    setAccentColor("custom")
  }

  const saveThemePreferences = () => {
    try {
      // Show success message
      setShowSavedMessage(true)
      setSaveError(null)
      setTimeout(() => {
        setShowSavedMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving theme preferences:", error)
      setSaveError("Failed to save preferences. Please try again.")
    }
  }

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
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          {/* Loading State */}
          {(userLoading || profileLoading) && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Cargando perfil...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success/Error Messages */}
          {showSavedMessage && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
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
              <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Información de perfil</CardTitle>
              <CardDescription className="dark:text-gray-400">
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
                    className="dark:border-gray-600 dark:text-gray-200"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, GIF o PNG. Tamaño máximo 2MB. Se recomienda imagen cuadrada.
                  </p>
                </div>
              </div>

              <form id="profile-form" onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="dark:text-gray-200">
                      Nombre *
                    </Label>
                    <Input
                      id="first-name"
                      {...registerProfile("firstName")}
                      className={cn(
                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                        profileErrors.firstName && "border-red-500"
                      )}
                    />
                    {profileErrors.firstName && (
                      <p className="text-sm text-red-500">{profileErrors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="dark:text-gray-200">
                      Apellido *
                    </Label>
                    <Input
                      id="last-name"
                      {...registerProfile("lastName")}
                      className={cn(
                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                        profileErrors.lastName && "border-red-500"
                      )}
                    />
                    {profileErrors.lastName && (
                      <p className="text-sm text-red-500">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="dark:text-gray-200">
                      Nombre visible *
                    </Label>
                    <Input
                      id="display-name"
                      {...registerProfile("displayName")}
                      className={cn(
                        "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
                        profileErrors.displayName && "border-red-500"
                      )}
                    />
                    {profileErrors.displayName && (
                      <p className="text-sm text-red-500">{profileErrors.displayName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-gray-200">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      readOnly
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed opacity-70"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                className="dark:border-gray-600 dark:text-gray-200"
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
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Tema</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Personaliza la apariencia de la aplicación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Modo de color</Label>
                <div className="flex gap-4">
                  <div
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer ${
                      theme === "light" ? "border-primary bg-primary/10" : "dark:border-gray-600"
                    }`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="bg-white border shadow-sm p-2 rounded-full">
                      <Sun className="h-6 w-6 text-yellow-500" />
                    </div>
                    <span className="font-medium dark:text-gray-200">Claro</span>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer ${
                      theme === "dark" ? "border-primary bg-primary/10" : "dark:border-gray-600"
                    }`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="bg-gray-900 border shadow-sm p-2 rounded-full">
                      <Moon className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="font-medium dark:text-gray-200">Oscuro</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="dark:text-gray-200">Color de acento</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {colorOptions.map((color) => (
                    <TooltipProvider key={color.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "h-12 w-full rounded-md border-2 flex items-center justify-center transition-all",
                              color.value,
                              accentColor === color.name
                                ? "border-black dark:border-white scale-105"
                                : "border-transparent hover:scale-105",
                            )}
                            onClick={() => handleAccentColorChange(color.name)}
                          >
                            {accentColor === color.name && <Check className={cn("h-6 w-6", color.textColor)} />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{color.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}

                  {/* Custom color option */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "h-12 w-full rounded-md border-2 flex items-center justify-center transition-all relative overflow-hidden",
                            accentColor === "custom"
                              ? "border-black dark:border-white scale-105"
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Selecciona un color de acento para personalizar tu tablero.
                </p>
              </div>

              {/* Custom Color Picker Section */}
              {accentColor === "custom" && (
                <div className="space-y-3 p-4 border rounded-lg dark:border-gray-700">
                  <Label className="text-base dark:text-gray-200">Color personalizado</Label>
                  <ColorPicker onColorChange={handleCustomColorChange} />
                </div>
              )}

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Tamaño de fuente</Label>
                <Select value={fontSize} onValueChange={(v) => setFontSize(v as "small" | "medium" | "large")}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue placeholder="Selecciona el tamaño" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="small">Pequeño</SelectItem>
                    <SelectItem value="medium">Mediano</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base dark:text-gray-200">Movimiento reducido</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Reduce la cantidad de animaciones y efectos de movimiento.
                  </p>
                </div>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              {saveError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {showSavedMessage && (
                <p className="text-green-600 dark:text-green-400 flex items-center">
                  <Check className="h-4 w-4 mr-1" /> Theme preferences saved
                </p>
              )}
              <div className="ml-auto">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={saveThemePreferences}
                >
                  Save Preferences
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Vista previa del tema</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Vista previa de cómo se verá el tema seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Componentes UI</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Button className="w-full">Botón primario</Button>
                      <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-200">
                        Botón secundario
                      </Button>
                      <Button variant="ghost" className="w-full dark:text-gray-200">
                        Botón fantasma
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-card border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-sm dark:text-gray-200">Componente tarjeta</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="preview-switch" />
                        <Label htmlFor="preview-switch" className="dark:text-gray-200">
                          Interruptor
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Badge>Predeterminado</Badge>
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-200">
                          Contorno
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
