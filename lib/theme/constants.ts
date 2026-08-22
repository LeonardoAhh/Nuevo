/**
 * Single source of truth for theme tokens shared by:
 * - app/layout.tsx (pre-hydration bootstrap script, OS status-bar fallback)
 * - components/theme-context.tsx (client-side theme state)
 *
 * This module must stay framework-free (no "use client", no React) so it can
 * be imported from both server and client code.
 */

export type Theme = "light" | "dark" | "system"
export type AccentColor =
  | "slate"
  | "blue"
  | "indigo"
  | "purple"
  | "violet"
  | "rose"
  | "pink"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "cyan"
  | "monochrome"

export type FontSize = "small" | "medium" | "large"
export type Density = "comfortable" | "compact"

export const ACCENT_COLOR_MAP: Record<
  AccentColor,
  { primaryLight: string; primaryDark: string; primaryForeground: string; primaryForegroundDark?: string; label: string }
> = {
  slate: { primaryLight: "220 14% 36%", primaryDark: "220 14% 60%", primaryForeground: "0 0% 98%", label: "Slate" },
  blue: { primaryLight: "221 62% 45%", primaryDark: "221 72% 65%", primaryForeground: "0 0% 98%", label: "Blue" },
  indigo: { primaryLight: "234 56% 48%", primaryDark: "234 66% 68%", primaryForeground: "0 0% 98%", label: "Indigo" },
  purple: { primaryLight: "262 52% 46%", primaryDark: "262 62% 66%", primaryForeground: "0 0% 98%", label: "Purple" },
  violet: { primaryLight: "271 58% 45%", primaryDark: "271 68% 65%", primaryForeground: "0 0% 98%", label: "Violet" },
  rose: { primaryLight: "350 55% 42%", primaryDark: "350 65% 62%", primaryForeground: "0 0% 98%", label: "Rose" },
  pink: { primaryLight: "330 50% 45%", primaryDark: "330 60% 65%", primaryForeground: "0 0% 98%", label: "Pink" },
  orange: { primaryLight: "25 68% 45%", primaryDark: "25 78% 60%", primaryForeground: "0 0% 98%", label: "Copper" },
  amber: { primaryLight: "40 62% 38%", primaryDark: "40 72% 54%", primaryForeground: "0 0% 98%", label: "Amber" },
  green: { primaryLight: "152 48% 34%", primaryDark: "152 58% 48%", primaryForeground: "0 0% 98%", label: "Sage" },
  teal: { primaryLight: "172 50% 32%", primaryDark: "172 60% 46%", primaryForeground: "0 0% 98%", label: "Teal" },
  cyan: { primaryLight: "192 55% 38%", primaryDark: "192 65% 52%", primaryForeground: "0 0% 98%", label: "Cyan" },
  monochrome: { primaryLight: "220 14% 12%", primaryDark: "0 0% 100%", primaryForeground: "0 0% 100%", primaryForegroundDark: "220 14% 12%", label: "Monochrome" },
}

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
}

export const DENSITY_SCALE_MAP: Record<Density, string> = {
  comfortable: "1",
  compact: "0.875",
}

// localStorage persistence keys. Written/read by both the bootstrap script
// (before hydration) and ThemeProvider effects — change together via this map.
export const THEME_STORAGE_KEYS = {
  theme: "theme",
  accentColor: "accentColor",
  fontSize: "fontSize",
  density: "density",
  reducedMotion: "reducedMotion",
} as const

/**
 * Resolved values of the `--background` tokens in app/globals.css
 * (light: 220 14% 96%, dark: 225 12% 7%). Used only for the very first paint
 * of <meta name="theme-color"> before hydration, since CSS variables cannot
 * be referenced there. After mount, ThemeProvider overrides it dynamically
 * with APP_THEME_COLOR.
 */
export const OS_THEME_COLOR_FALLBACK: Record<"light" | "dark", string> = {
  light: "#f3f4f6",
  dark: "#101114",
}

/** Post-hydration status-bar colors (match --card in app/globals.css). */
export const APP_THEME_COLOR: Record<"light" | "dark", string> = {
  light: "#f8f9fa",
  dark: "#161619",
}

const DEFAULT_ACCENT: AccentColor = "blue"

/**
 * Inline script injected into <head> so persisted theme preferences apply
 * synchronously before React hydrates (prevents FOUC). Keep the logic here
 * in sync with the effects in ThemeProvider — both read the same constants,
 * so token changes propagate automatically.
 */
export function buildThemeBootstrapScript(): string {
  const accents = JSON.stringify(
    Object.fromEntries(
      Object.entries(ACCENT_COLOR_MAP).map(([key, value]) => [key, value])
    )
  )
  const fontSizes = JSON.stringify(FONT_SIZE_MAP)
  const compactScale = DENSITY_SCALE_MAP.compact
  const k = JSON.stringify(THEME_STORAGE_KEYS)

  return `(function(){try{
  var d=document.documentElement;
  var c=${accents};
  var fs=${fontSizes};
  var k=${k};
  var t=localStorage.getItem(k.theme);
  var isDark = t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
  if(isDark)d.classList.add("dark");
  var f=localStorage.getItem(k.fontSize);
  if(f&&fs[f])d.style.setProperty("--font-base-size",fs[f]);
  var dn=localStorage.getItem(k.density);
  if(dn==="compact"){d.classList.add("density-compact");d.style.setProperty("--density-scale","${compactScale}");}
  var a=localStorage.getItem(k.accentColor);
  if(a&&c[a]){
    d.style.setProperty("--primary", isDark ? c[a].primaryDark : c[a].primaryLight);
    d.style.setProperty("--primary-foreground", (isDark && c[a].primaryForegroundDark) ? c[a].primaryForegroundDark : c[a].primaryForeground);
  }
  if(localStorage.getItem(k.reducedMotion)==="true")d.classList.add("reduce-motion");
}catch(e){}})();`
}
