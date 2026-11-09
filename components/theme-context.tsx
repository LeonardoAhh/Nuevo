"use client"

import type React from "react"
import { createContext, startTransition, useCallback, useContext, useEffect, useState } from "react"
import {
  DENSITY_SCALE_MAP,
  FONT_SIZE_MAP,
  APP_THEME_COLORS,
  THEME_STORAGE_KEYS,
  type Density,
  type FontSize,
  type ThemeMode,
} from "@/lib/theme/constants"

export type { Density, FontSize, ThemeMode }

type ThemeContextType = {
  themeMode: ThemeMode
  fontSize: FontSize
  density: Density
  reducedMotion: boolean
  setThemeMode: (mode: ThemeMode) => void
  setFontSize: (size: FontSize) => void
  setDensity: (density: Density) => void
  setReducedMotion: (reduced: boolean) => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light")
  const [fontSize, setFontSizeState] = useState<FontSize>("medium")
  const [density, setDensityState] = useState<Density>("comfortable")
  const [reducedMotion, setReducedMotionState] = useState(false)

  const setThemeMode = useCallback((mode: ThemeMode) => setThemeModeState(mode), [])
  const setFontSize = useCallback((size: FontSize) => setFontSizeState(size), [])
  const setDensity = useCallback((value: Density) => setDensityState(value), [])
  const setReducedMotion = useCallback((value: boolean) => setReducedMotionState(value), [])

  useEffect(() => {
    const storedThemeMode = localStorage.getItem(THEME_STORAGE_KEYS.colorMode)
    localStorage.removeItem(THEME_STORAGE_KEYS.legacyAccentColor)
    document.documentElement.style.removeProperty("--brand-accent")
    document.documentElement.style.removeProperty("--brand-accent-text")
    document.documentElement.style.removeProperty("--brand-accent-foreground")
    document.documentElement.style.removeProperty("--ring")

    const storedFontSize = localStorage.getItem(THEME_STORAGE_KEYS.fontSize)
    const storedDensity = localStorage.getItem(THEME_STORAGE_KEYS.density)
    const storedReducedMotion = localStorage.getItem(THEME_STORAGE_KEYS.reducedMotion)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    startTransition(() => {
      setThemeMode(storedThemeMode === "dark" ? "dark" : "light")
      if (storedFontSize === "small" || storedFontSize === "medium" || storedFontSize === "large") {
        setFontSize(storedFontSize)
      }
      if (storedDensity === "comfortable" || storedDensity === "compact") {
        setDensity(storedDensity)
      }
      setReducedMotion(
        storedReducedMotion !== null ? storedReducedMotion === "true" : prefersReducedMotion,
      )
      setInitialized(true)
    })
  }, [setDensity, setFontSize, setReducedMotion, setThemeMode])

  useEffect(() => {
    if (!initialized) return
    document.documentElement.classList.toggle("dark", themeMode === "dark")
    localStorage.setItem(THEME_STORAGE_KEYS.colorMode, themeMode)
    const themeColor = document.querySelector('meta[name="theme-color"]')
    themeColor?.setAttribute("content", APP_THEME_COLORS[themeMode])
  }, [initialized, themeMode])

  useEffect(() => {
    if (!initialized) return
    document.documentElement.style.setProperty("--font-base-size", FONT_SIZE_MAP[fontSize])
    localStorage.setItem(THEME_STORAGE_KEYS.fontSize, fontSize)
  }, [fontSize, initialized])

  useEffect(() => {
    if (!initialized) return
    document.documentElement.style.setProperty("--density-scale", DENSITY_SCALE_MAP[density])
    document.documentElement.classList.toggle("density-compact", density === "compact")
    localStorage.setItem(THEME_STORAGE_KEYS.density, density)
  }, [density, initialized])

  useEffect(() => {
    if (!initialized) return
    document.documentElement.classList.toggle("reduce-motion", reducedMotion)
    localStorage.setItem(THEME_STORAGE_KEYS.reducedMotion, String(reducedMotion))
  }, [initialized, reducedMotion])

  const resetTheme = useCallback(() => {
    setThemeMode("light")
    setFontSize("medium")
    setDensity("comfortable")
    setReducedMotion(false)
    Object.values(THEME_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  }, [setDensity, setFontSize, setReducedMotion, setThemeMode])

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        fontSize,
        density,
        reducedMotion,
        setThemeMode,
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
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
