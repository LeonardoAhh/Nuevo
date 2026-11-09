"use client"

import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import type { User } from "@supabase/supabase-js"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Check, Loader2, Save, Upload, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserProfile } from "@/lib/hooks/useProfile"
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile"
import { SettingsGroup, SettingsSectionHeader } from "./SettingsPrimitives"

type ProfileSettingsProps = {
  user: User | null
  profile: UserProfile | null
  profileLoading: boolean
  userLoading: boolean
  profileError: string | null
  updateProfile: (updates: Partial<UserProfile>) => Promise<{
    success: boolean
    error?: string
    message?: string
  }>
  uploadAvatar: (file: File) => Promise<{
    success: boolean
    error?: string
    message?: string
  }>
}

export function ProfileSettings({
  user,
  profile,
  profileLoading,
  userLoading,
  profileError,
  updateProfile,
  uploadAvatar,
}: ProfileSettingsProps) {
  const [showSaved, setShowSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
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

  useEffect(() => {
    if (!profile) return
    reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      email: profile.email,
      language: profile.language || "en",
      dateFormat: profile.dateFormat || "mm-dd-yyyy",
    })
  }, [profile, reset])

  const showSuccess = () => {
    setShowSaved(true)
    window.setTimeout(() => setShowSaved(false), 3000)
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaveError(null)
      const result = await updateProfile(data)
      if (result.success) showSuccess()
      else setSaveError(result.error || "No se pudo guardar el perfil")
    } catch {
      setSaveError("Ocurrió un error inesperado")
    }
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setIsUploadingAvatar(true)
      setSaveError(null)
      const result = await uploadAvatar(file)
      if (result.success) showSuccess()
      else setSaveError(result.error || "No se pudo subir la imagen")
    } catch {
      setSaveError("Ocurrió un error inesperado")
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (userLoading || profileLoading) {
    return (
      <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
        <span>Cargando perfil…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SettingsSectionHeader
        title="Perfil"
        description="Tu información personal y foto de perfil."
      />

      {showSaved && (
        <Alert className="border-success/30 bg-success/10">
          <Check className="size-4 text-success" aria-hidden="true" />
          <AlertDescription className="text-success">
            Perfil actualizado con éxito.
          </AlertDescription>
        </Alert>
      )}
      {(saveError || profileError) && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertDescription>{saveError || profileError}</AlertDescription>
        </Alert>
      )}

      <SettingsGroup title="Foto de perfil">
        <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
          <Avatar className="size-16 shrink-0">
            {profile?.avatar && <AvatarImage src={profile.avatar} alt="Foto de perfil" />}
            <AvatarFallback className="bg-muted text-foreground">
              {profile ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}` || "U" : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {profile ? `${profile.firstName} ${profile.lastName}` : "—"}
            </p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              JPG, PNG o GIF · máx. 2 MB · imagen cuadrada recomendada
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 min-h-11 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {isUploadingAvatar ? "Subiendo…" : "Cambiar foto"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
              aria-label="Seleccionar nueva foto de perfil"
            />
          </div>
        </div>
      </SettingsGroup>

      <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <SettingsGroup title="Datos personales">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 py-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-sm font-medium">Nombre *</Label>
              <Input
                id="first-name"
                {...register("firstName")}
                className={`min-h-11 ${errors.firstName ? "border-destructive" : ""}`}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? "first-name-error" : undefined}
              />
              {errors.firstName && (
                <p id="first-name-error" className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-sm font-medium">Apellido *</Label>
              <Input
                id="last-name"
                {...register("lastName")}
                className={`min-h-11 ${errors.lastName ? "border-destructive" : ""}`}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? "last-name-error" : undefined}
              />
              {errors.lastName && (
                <p id="last-name-error" className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-sm font-medium">Nombre visible *</Label>
              <Input
                id="display-name"
                {...register("displayName")}
                className={`min-h-11 ${errors.displayName ? "border-destructive" : ""}`}
                aria-invalid={Boolean(errors.displayName)}
                aria-describedby={errors.displayName ? "display-name-error" : undefined}
              />
              {errors.displayName && (
                <p id="display-name-error" className="text-sm text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                readOnly
                className="min-h-11 bg-muted/30 text-muted-foreground"
              />
            </div>
          </div>
        </SettingsGroup>
      </form>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 gap-2"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          <X className="size-4" aria-hidden="true" />
          Descartar
        </Button>
        <Button
          type="submit"
          form="profile-form"
          className="min-h-11 gap-2"
          disabled={isSubmitting || profileLoading}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
