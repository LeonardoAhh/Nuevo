"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"
type AccentColor = "blue" | "purple" | "green" | "orange" | "pink" | "yellow" | "custom"

type ThemeContextType = {
  theme: Theme
  accentColor: AccentColor
  customColor: string
  isColorLight: (hex?: string) => boolean
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  setCustomColor: (color: string) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const ACCENT_COLOR_MAP = {
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
  const [accentColor, setAccentColor] = useState<AccentColor>("blue")
  const [customColor, setCustomColor] = useState<string>("#3b82f6") // Default to a blue color

  // Initialize theme and accent color from localStorage or system preference
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("theme") as Theme | null
      const storedAccentColor = localStorage.getItem("accentColor") as AccentColor | null
      const storedCustomColor = localStorage.getItem("customColor") as string | null
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

      if (storedTheme) {
        setTheme(storedTheme)
      } else if (prefersDark) {
        setTheme("dark")
      }

      if (storedAccentColor) {
        setAccentColor(storedAccentColor)
      }

      if (storedCustomColor && /^#[0-9A-Fa-f]{6}$/.test(storedCustomColor)) {
        setCustomColor(storedCustomColor)
      }
    } catch (error) {
      console.error("Error initializing theme from localStorage:", error)
    }
  }, [])

  // Update document class and localStorage when theme changes
  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      localStorage.setItem("theme", theme)
    } catch (error) {
      console.error("Error updating theme:", error)
    }
  }, [theme])

  // Update CSS variables when accent color or custom color changes
  useEffect(() => {
    try {
      let primaryValue: string
      let primaryForeground: string

      if (accentColor === "custom") {
        // Convert custom color to HSL for CSS variables
        const hsl = hexToHSL(customColor)
        const isLight = isColorLight(customColor)

        // Set the primary color to the custom color
        primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`

        // Choose text color based on the brightness of the background
        primaryForeground = isLight ? "222.2 84% 4.9%" : "210 40% 98%"

        // Save custom color to localStorage
        localStorage.setItem("customColor", customColor)
      } else {
        // Use predefined colors
        const colors = ACCENT_COLOR_MAP[accentColor]
        primaryValue = colors.primary
        primaryForeground = colors.primaryForeground
      }

      // Apply the colors to CSS variables
      document.documentElement.style.setProperty("--primary", primaryValue)
      document.documentElement.style.setProperty("--primary-foreground", primaryForeground)

      // Save accent color to localStorage
      localStorage.setItem("accentColor", accentColor)
    } catch (error) {
      console.error("Error updating accent color:", error)
    }
  }, [accentColor, customColor, theme])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        customColor,
        isColorLight,
        setTheme,
        setAccentColor,
        setCustomColor,
        toggleTheme,
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
