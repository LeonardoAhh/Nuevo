"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  ACCENT_COLOR_MAP,
  DENSITY_SCALE_MAP,
  FONT_SIZE_MAP,
  THEME_STORAGE_KEYS,
  type AccentColor,
  type Density,
  type FontSize,
} from "@/lib/theme/constants"

// Re-exported so existing consumers keep importing from this module.
export type { AccentColor, FontSize, Density }
export { ACCENT_COLOR_MAP }

type ThemeContextType = {
  accentColor: AccentColor
  fontSize: FontSize
  density: Density
  reducedMotion: boolean
  isColorLight: (hex?: string) => boolean
  setAccentColor: (color: AccentColor) => void
  setFontSize: (size: FontSize) => void
  setDensity: (d: Density) => void
  setReducedMotion: (v: boolean) => void
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
  const [initialized, setInitialized] = useState(false)
  const [accentColor, setAccentColorRaw] = useState<AccentColor>("blue")
  const setAccentColor = useCallback((c: AccentColor) => {
    setAccentColorRaw(c in ACCENT_COLOR_MAP ? c : "blue")
  }, [])
  const [fontSize, setFontSize] = useState<FontSize>("medium")
  const [density, setDensity] = useState<Density>("comfortable")
  const [reducedMotion, setReducedMotion] = useState<boolean>(false)

  // Initialize display preferences; discard the retired color-mode preference.
  useEffect(() => {
    localStorage.removeItem(THEME_STORAGE_KEYS.legacyColorMode)
    document.documentElement.classList.remove("dark")
    const storedAccentColor = localStorage.getItem(THEME_STORAGE_KEYS.accentColor) as AccentColor | null
    const storedFontSize = localStorage.getItem(THEME_STORAGE_KEYS.fontSize) as FontSize | null
    const storedDensity = localStorage.getItem(THEME_STORAGE_KEYS.density) as Density | null
    const storedReducedMotion = localStorage.getItem(THEME_STORAGE_KEYS.reducedMotion)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (storedAccentColor && storedAccentColor in ACCENT_COLOR_MAP) setAccentColor(storedAccentColor)
    if (storedFontSize && storedFontSize in FONT_SIZE_MAP) setFontSize(storedFontSize)
    if (storedDensity && (storedDensity === "comfortable" || storedDensity === "compact")) setDensity(storedDensity)

    const rm = storedReducedMotion !== null ? storedReducedMotion === "true" : prefersReducedMotion
    setReducedMotion(rm)
    setInitialized(true)
  }, [setAccentColor])

  // Apply font size via CSS variable
  useEffect(() => {
    if (!initialized) return
    document.documentElement.style.setProperty("--font-base-size", FONT_SIZE_MAP[fontSize])
    localStorage.setItem(THEME_STORAGE_KEYS.fontSize, fontSize)
  }, [fontSize, initialized])

  // Apply density via CSS variable + class
  useEffect(() => {
    if (!initialized) return
    document.documentElement.style.setProperty("--density-scale", DENSITY_SCALE_MAP[density])
    if (density === "compact") {
      document.documentElement.classList.add("density-compact")
    } else {
      document.documentElement.classList.remove("density-compact")
    }
    localStorage.setItem(THEME_STORAGE_KEYS.density, density)
  }, [density, initialized])

  // Apply reduced motion
  useEffect(() => {
    if (!initialized) return
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion")
    } else {
      document.documentElement.classList.remove("reduce-motion")
    }
    localStorage.setItem(THEME_STORAGE_KEYS.reducedMotion, String(reducedMotion))
  }, [reducedMotion, initialized])

  // Update CSS variables when accent color changes
  useEffect(() => {
    if (!initialized) return
    const colors = ACCENT_COLOR_MAP[accentColor] ?? ACCENT_COLOR_MAP.blue
    // Clear legacy inline overrides from the previous implementation, where
    // choosing an accent replaced the semantic primary button color.
    document.documentElement.style.removeProperty("--primary")
    document.documentElement.style.removeProperty("--primary-foreground")
    document.documentElement.style.setProperty("--brand-accent", colors.accent)
    document.documentElement.style.setProperty("--brand-accent-text", colors.accentText)
    document.documentElement.style.setProperty("--brand-accent-foreground", colors.accentForeground)
    document.documentElement.style.setProperty("--ring", colors.accent)
    localStorage.setItem(THEME_STORAGE_KEYS.accentColor, accentColor)
  }, [accentColor, initialized])

  const resetTheme = () => {
    setAccentColor("blue")
    setFontSize("medium")
    setDensity("comfortable")
    setReducedMotion(false)
    Object.values(THEME_STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
  }

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        fontSize,
        density,
        reducedMotion,
        isColorLight,
        setAccentColor,
        setFontSize,
        setDensity,
        setReducedMotion,
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
