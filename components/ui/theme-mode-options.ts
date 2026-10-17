import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
import type { Theme } from "@/lib/theme/constants"

export const THEME_MODE_OPTIONS: ReadonlyArray<{
  value: Theme
  label: string
  icon: LucideIcon
}> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
]

export function isThemeMode(value: string): value is Theme {
  return THEME_MODE_OPTIONS.some((option) => option.value === value)
}
