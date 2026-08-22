"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  ACCENT_COLOR_MAP,
  APP_THEME_COLOR as THEME_COLOR_MAP,
  DENSITY_SCALE_MAP,
  FONT_SIZE_MAP,
  THEME_STORAGE_KEYS,
  type AccentColor,
  type Density,
  type FontSize,
  type Theme,
} from "@/lib/theme/constants"

// Re-exported so existing consumers keep importing from this module.
export type { Theme, AccentColor, FontSize, Density }
export { ACCENT_COLOR_MAP }

const THEME_COLOR_META_ID = "dynamic-theme-color"

function setMetaThemeColor(color: string) {
  if (typeof document === "undefined") return
  // We keep an unconditional, non-media tag that wins over any OS-media
  // variants Next injected from `viewport.themeColor` (last matching wins).
  // We must NOT remove React-managed nodes — doing so crashes the reconciler
  // with `removeChild` on next render. So we own a single tag by id and only
  // mutate its `content`.
  let meta = document.getElementById(THEME_COLOR_META_ID) as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement("meta")
    meta.id = THEME_COLOR_META_ID
    meta.name = "theme-color"
    document.head.appendChild(meta)
  }
  if (meta.content !== color) {
    meta.content = color
  }
}

type ThemeContextType = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  accentColor: AccentColor
  fontSize: FontSize
  density: Density
  reducedMotion: boolean
  isColorLight: (hex?: string) => boolean
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  setFontSize: (size: FontSize) => void
  setDensity: (d: Density) => void
  setReducedMotion: (v: boolean) => void
  toggleTheme: () => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Helper function to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  try {
    // Remove the # if present
    hex = hex.replace(/^#/, "")

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255

    // Find the min and max values to calculate the lightness
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    let l = (max + min) / 2

    // Calculate the saturation
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      // Calculate the hue
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    // Convert to degrees, percentage, percentage
    h = Math.round(h * 360)
    s = Math.round(s * 100)
    l = Math.round(l * 100)

    return { h, s, l }
  } catch (error) {
    console.error("Error converting hex to HSL:", error)
    return { h: 221, s: 83, l: 53 } // Default blue
  }
}

// Helper function to determine if a color is light or dark
function isColorLight(hex?: string): boolean {
  if (!hex) return true

  try {
    // Remove the # if present
    hex = hex.replace(/^#/, "")

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    // Calculate the perceived brightness using the formula
    // (0.299*R + 0.587*G + 0.114*B)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Return true if the color is light (brightness > 0.5)
    return brightness > 0.5
  } catch (error) {
    console.error("Error determining if color is light:", error)
    return true // Default to light
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [accentColor, setAccentColorRaw] = useState<AccentColor>("blue")
  const setAccentColor = useCallback((c: AccentColor) => {
    setAccentColorRaw(c in ACCENT_COLOR_MAP ? c : "blue")
  }, [])
  const [fontSize, setFontSize] = useState<FontSize>("medium")
  const [density, setDensity] = useState<Density>("comfortable")
  const [reducedMotion, setReducedMotion] = useState<boolean>(false)

  // Resolve the effective theme (light or dark) from "system" or explicit
  const resolveTheme = useCallback((t: Theme): "light" | "dark" => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return t
  }, [])

  // Initialize from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEYS.theme) as Theme | null
    const storedAccentColor = localStorage.getItem(THEME_STORAGE_KEYS.accentColor) as AccentColor | null
    const storedFontSize = localStorage.getItem(THEME_STORAGE_KEYS.fontSize) as FontSize | null
    const storedDensity = localStorage.getItem(THEME_STORAGE_KEYS.density) as Density | null
    const storedReducedMotion = localStorage.getItem(THEME_STORAGE_KEYS.reducedMotion)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system")) {
      setTheme(storedTheme)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    }

    if (storedAccentColor && storedAccentColor in ACCENT_COLOR_MAP) setAccentColor(storedAccentColor)
    if (storedFontSize && storedFontSize in FONT_SIZE_MAP) setFontSize(storedFontSize)
    if (storedDensity && (storedDensity === "comfortable" || storedDensity === "compact")) setDensity(storedDensity)

    const rm = storedReducedMotion !== null ? storedReducedMotion === "true" : prefersReducedMotion
    setReducedMotion(rm)
  }, [])

  // Apply dark/light class + subscribe to system changes when theme="system"
  useEffect(() => {
    const apply = (resolved: "light" | "dark") => {
      setResolvedTheme(resolved)
      if (resolved === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      setMetaThemeColor(THEME_COLOR_MAP[resolved])
    }

    apply(resolveTheme(theme))
    localStorage.setItem(THEME_STORAGE_KEYS.theme, theme)

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light")
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, [theme, resolveTheme])

  // Apply font size via CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--font-base-size", FONT_SIZE_MAP[fontSize])
    localStorage.setItem(THEME_STORAGE_KEYS.fontSize, fontSize)
  }, [fontSize])

  // Apply density via CSS variable + class
  useEffect(() => {
    document.documentElement.style.setProperty("--density-scale", DENSITY_SCALE_MAP[density])
    if (density === "compact") {
      document.documentElement.classList.add("density-compact")
    } else {
      document.documentElement.classList.remove("density-compact")
    }
    localStorage.setItem(THEME_STORAGE_KEYS.density, density)
  }, [density])

  // Apply reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion")
    } else {
      document.documentElement.classList.remove("reduce-motion")
    }
    localStorage.setItem(THEME_STORAGE_KEYS.reducedMotion, String(reducedMotion))
  }, [reducedMotion])

  // Update CSS variables when accent color changes
  useEffect(() => {
    const colors = ACCENT_COLOR_MAP[accentColor] ?? ACCENT_COLOR_MAP.blue
    const primaryColor = resolvedTheme === "dark" ? colors.primaryDark : colors.primaryLight
    const primaryFgColor = (resolvedTheme === "dark" && colors.primaryForegroundDark) ? colors.primaryForegroundDark : colors.primaryForeground
    document.documentElement.style.setProperty("--primary", primaryColor)
    document.documentElement.style.setProperty("--primary-foreground", primaryFgColor)
    localStorage.setItem(THEME_STORAGE_KEYS.accentColor, accentColor)
  }, [accentColor, resolvedTheme])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const resetTheme = () => {
    setTheme("light")
    setAccentColor("blue")
    setFontSize("medium")
    setDensity("comfortable")
    setReducedMotion(false)
    Object.values(THEME_STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        accentColor,
        fontSize,
        density,
        reducedMotion,
        isColorLight,
        setTheme,
        setAccentColor,
        setFontSize,
        setDensity,
        setReducedMotion,
        toggleTheme,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
