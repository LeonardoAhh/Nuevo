"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

export type Theme = "light" | "dark" | "system"
export type AccentColor = "blue" | "purple" | "green" | "orange" | "pink" | "yellow" | "custom"
export type FontSize = "small" | "medium" | "large"
export type Density = "comfortable" | "compact"

export const DEFAULT_CUSTOM_COLOR = "#3b82f6"

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
}

const DENSITY_SCALE_MAP: Record<Density, string> = {
  comfortable: "1",
  compact: "0.875",
}

type ThemeContextType = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  accentColor: AccentColor
  customColor: string
  fontSize: FontSize
  density: Density
  reducedMotion: boolean
  isColorLight: (hex?: string) => boolean
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  setCustomColor: (color: string) => void
  setFontSize: (size: FontSize) => void
  setDensity: (d: Density) => void
  setReducedMotion: (v: boolean) => void
  toggleTheme: () => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ACCENT_COLOR_MAP: Record<Exclude<AccentColor, "custom">, { primary: string; primaryForeground: string }> = {
  blue: {
    primary: "221.2 83.2% 53.3%",
    primaryForeground: "210 40% 98%",
  },
  purple: {
    primary: "262.1 83.3% 57.8%",
    primaryForeground: "210 40% 98%",
  },
  green: {
    primary: "142.1 76.2% 36.3%",
    primaryForeground: "355.7 100% 97.3%",
  },
  orange: {
    primary: "24.6 95% 53.1%",
    primaryForeground: "355.7 100% 97.3%",
  },
  pink: {
    primary: "339 90.6% 51.8%",
    primaryForeground: "355.7 100% 97.3%",
  },
  yellow: {
    primary: "47.9 95.8% 53.1%",
    primaryForeground: "26 83.3% 14.1%",
  },
}

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
  const [accentColor, setAccentColor] = useState<AccentColor>("blue")
  const [customColor, setCustomColor] = useState<string>(DEFAULT_CUSTOM_COLOR)
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
    const storedTheme = localStorage.getItem("theme") as Theme | null
    const storedAccentColor = localStorage.getItem("accentColor") as AccentColor | null
    const storedCustomColor = localStorage.getItem("customColor") as string | null
    const storedFontSize = localStorage.getItem("fontSize") as FontSize | null
    const storedDensity = localStorage.getItem("density") as Density | null
    const storedReducedMotion = localStorage.getItem("reducedMotion")
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system")) {
      setTheme(storedTheme)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    }

    if (storedAccentColor) setAccentColor(storedAccentColor)
    if (storedCustomColor && /^#[0-9A-Fa-f]{6}$/.test(storedCustomColor)) setCustomColor(storedCustomColor)
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
    }

    apply(resolveTheme(theme))
    localStorage.setItem("theme", theme)

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
    localStorage.setItem("fontSize", fontSize)
  }, [fontSize])

  // Apply density via CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--density-scale", DENSITY_SCALE_MAP[density])
    localStorage.setItem("density", density)
  }, [density])

  // Apply reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion")
    } else {
      document.documentElement.classList.remove("reduce-motion")
    }
    localStorage.setItem("reducedMotion", String(reducedMotion))
  }, [reducedMotion])

  // Update CSS variables when accent color or custom color changes
  useEffect(() => {
    let primaryValue: string
    let primaryForeground: string

    if (accentColor === "custom") {
      const hsl = hexToHSL(customColor)
      const light = isColorLight(customColor)
      primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`
      primaryForeground = light ? "222.2 84% 4.9%" : "210 40% 98%"
      localStorage.setItem("customColor", customColor)
    } else {
      const colors = ACCENT_COLOR_MAP[accentColor]
      primaryValue = colors.primary
      primaryForeground = colors.primaryForeground
    }

    document.documentElement.style.setProperty("--primary", primaryValue)
    document.documentElement.style.setProperty("--primary-foreground", primaryForeground)
    localStorage.setItem("accentColor", accentColor)
  }, [accentColor, customColor])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const resetTheme = () => {
    setTheme("light")
    setAccentColor("blue")
    setCustomColor(DEFAULT_CUSTOM_COLOR)
    setFontSize("medium")
    setDensity("comfortable")
    setReducedMotion(false)
    const keys = ["theme", "accentColor", "customColor", "fontSize", "density", "reducedMotion"]
    keys.forEach(k => localStorage.removeItem(k))
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        accentColor,
        customColor,
        fontSize,
        density,
        reducedMotion,
        isColorLight,
        setTheme,
        setAccentColor,
        setCustomColor,
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
