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
export type FontSize = "small" | "medium" | "large"
export type Density = "comfortable" | "compact"

export const ACCENT_COLOR_MAP: Record<
  AccentColor,
  { primary: string; primaryForeground: string; label: string }
> = {
  slate: { primary: "220 14% 46%", primaryForeground: "0 0% 98%", label: "Slate" },
  blue: { primary: "221 62% 55%", primaryForeground: "0 0% 98%", label: "Blue" },
  indigo: { primary: "234 56% 58%", primaryForeground: "0 0% 98%", label: "Indigo" },
  purple: { primary: "262 52% 56%", primaryForeground: "0 0% 98%", label: "Purple" },
  violet: { primary: "271 58% 55%", primaryForeground: "0 0% 98%", label: "Violet" },
  rose: { primary: "350 55% 52%", primaryForeground: "0 0% 98%", label: "Rose" },
  pink: { primary: "330 50% 55%", primaryForeground: "0 0% 98%", label: "Pink" },
  orange: { primary: "25 68% 50%", primaryForeground: "0 0% 98%", label: "Copper" },
  amber: { primary: "40 62% 44%", primaryForeground: "0 0% 98%", label: "Amber" },
  green: { primary: "152 48% 38%", primaryForeground: "0 0% 98%", label: "Sage" },
  teal: { primary: "172 50% 36%", primaryForeground: "0 0% 98%", label: "Teal" },
  cyan: { primary: "192 55% 42%", primaryForeground: "0 0% 98%", label: "Cyan" },
}

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "16px",
  medium: "18px",
  large: "20px",
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
  light: "#ffffff",
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
      Object.entries(ACCENT_COLOR_MAP).map(([key, value]) => [key, value.primary])
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
  if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");
  var f=localStorage.getItem(k.fontSize);
  if(f&&fs[f])d.style.setProperty("--font-base-size",fs[f]);
  var dn=localStorage.getItem(k.density);
  if(dn==="compact"){d.classList.add("density-compact");d.style.setProperty("--density-scale","${compactScale}");}
  var a=localStorage.getItem(k.accentColor);
  if(a&&c[a]){
    d.style.setProperty("--primary",c[a]);
    d.style.setProperty("--primary-foreground",${JSON.stringify(ACCENT_COLOR_MAP[DEFAULT_ACCENT].primaryForeground)});
  }
  if(localStorage.getItem(k.reducedMotion)==="true")d.classList.add("reduce-motion");
}catch(e){}})();`
}
