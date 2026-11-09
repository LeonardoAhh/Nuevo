"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Palette, User, Wrench } from "lucide-react"
import { AuthForm } from "@/components/auth-form"
import { useProfile } from "@/lib/hooks/useProfile"
import { useUser } from "@/lib/hooks/useUser"
import { hasPrivateDeveloperAccess } from "@/lib/auth/private-developer"
import { ProfileSettings } from "./settings/ProfileSettings"
import { AppearanceSettings } from "./settings/AppearanceSettings"
import { DeveloperSettings } from "./settings/DeveloperSettings"
import { cn } from "@/lib/utils"

type SettingsTab = "profile" | "appearance" | "developer"

type SettingsNavigationItem = {
  id: SettingsTab
  label: string
  description: string
  icon: LucideIcon
}

const BASE_NAVIGATION: SettingsNavigationItem[] = [
  {
    id: "profile",
    label: "Perfil",
    description: "Datos personales y foto",
    icon: User,
  },
  {
    id: "appearance",
    label: "Apariencia",
    description: "Lectura y movimiento",
    icon: Palette,
  },
]

function getInitialTab(): SettingsTab {
  if (typeof window === "undefined") return "profile"
  const tab = new URLSearchParams(window.location.search).get("tab")
  return tab === "appearance" || tab === "developer" ? tab : "profile"
}

function SettingsNavigation({
  items,
  activeTab,
  onSelect,
}: {
  items: SettingsNavigationItem[]
  activeTab: SettingsTab
  onSelect: (tab: SettingsTab) => void
}) {
  return (
    <nav
      className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
      aria-label="Secciones de configuración"
    >
      {items.map(({ id, label, description, icon: Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-pressed={active}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-md border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:w-full lg:py-2",
              active
                ? "border-border bg-card text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-sm font-medium">{label}</span>
              <span className="hidden text-xs leading-4 text-muted-foreground lg:block">
                {description}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab)
  const { user, loading: userLoading } = useUser()
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    uploadAvatar,
  } = useProfile(user?.id)

  if (!user && !userLoading) return <AuthForm />

  const isDeveloper = hasPrivateDeveloperAccess(user?.email)
  const navigationItems = isDeveloper
    ? [
        ...BASE_NAVIGATION,
        {
          id: "developer" as const,
          label: "Desarrollador",
          description: "Administración del sistema",
          icon: Wrench,
        },
      ]
    : BASE_NAVIGATION
  const visibleTab = activeTab === "developer" && !isDeveloper ? "profile" : activeTab

  return (
    <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-5 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-8">
      <SettingsNavigation
        items={navigationItems}
        activeTab={visibleTab}
        onSelect={setActiveTab}
      />

      <div className="min-w-0 max-w-3xl">
        {visibleTab === "profile" && (
          <ProfileSettings
            user={user}
            profile={profile}
            profileLoading={profileLoading}
            userLoading={userLoading}
            profileError={profileError}
            updateProfile={updateProfile}
            uploadAvatar={uploadAvatar}
          />
        )}
        {visibleTab === "appearance" && <AppearanceSettings />}
        {visibleTab === "developer" && isDeveloper && <DeveloperSettings />}
      </div>
    </div>
  )
}
