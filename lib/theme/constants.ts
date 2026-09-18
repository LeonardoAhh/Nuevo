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
  | "blue"
  | "violet"
  | "pink"
  | "magenta"
  | "cyan"
  | "monochrome"

export type FontSize = "small" | "medium" | "large"
export type Density = "comfortable" | "compact"

export const ACCENT_COLOR_MAP: Record<
  AccentColor,
  { accentLight: string; accentDark: string; accentTextLight: string; accentTextDark: string; accentForeground: string; accentForegroundDark?: string; label: string }
> = {
  blue: { accentLight: "212.35 100% 47.65%", accentDark: "212.35 100% 47.65%", accentTextLight: "212.02 100% 43.73%", accentTextDark: "212.2 100% 59.8%", accentForeground: "0 0% 100%", label: "Azul" },
  violet: { accentLight: "270 66.94% 47.45%", accentDark: "270 66.94% 47.45%", accentTextLight: "270 66.94% 47.45%", accentTextDark: "262.39 89.33% 70.59%", accentForeground: "0 0% 100%", label: "Violeta" },
  pink: { accentLight: "329.88 100% 50%", accentDark: "329.88 100% 50%", accentTextLight: "330 100% 38.82%", accentTextDark: "330 100% 65.1%", accentForeground: "0 0% 9%", label: "Rosa" },
  magenta: { accentLight: "335.8 81.9% 56.67%", accentDark: "335.8 81.9% 56.67%", accentTextLight: "336.44 70.56% 45.29%", accentTextDark: "336.27 81.71% 67.84%", accentForeground: "0 0% 9%", label: "Magenta" },
  cyan: { accentLight: "166.53 72.41% 60.2%", accentDark: "166.53 72.41% 60.2%", accentTextLight: "169.92 88.15% 26.47%", accentTextDark: "166.53 72.41% 60.2%", accentForeground: "0 0% 9%", label: "Cian" },
  monochrome: { accentLight: "0 0% 9.02%", accentDark: "0 0% 100%", accentTextLight: "0 0% 9.02%", accentTextDark: "0 0% 100%", accentForeground: "0 0% 100%", accentForegroundDark: "0 0% 9%", label: "Tinta" },
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
 * Resolved values of the `--background` tokens in app/globals.css.
 * Used only for the very first paint
 * of <meta name="theme-color"> before hydration, since CSS variables cannot
 * be referenced there. After mount, ThemeProvider overrides it dynamically
 * with APP_THEME_COLOR.
 */
export const OS_THEME_COLOR_FALLBACK: Record<"light" | "dark", string> = {
  light: "#fafafa",
  dark: "#0a0a0a",
}

/** Post-hydration status-bar colors (match the app canvas). */
export const APP_THEME_COLOR: Record<"light" | "dark", string> = {
  light: "#fafafa",
  dark: "#0a0a0a",
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
  var followsSystem=t!=="light"&&t!=="dark";
  var isDark=t==="dark"||(followsSystem&&window.matchMedia("(prefers-color-scheme: dark)").matches);
  if(isDark)d.classList.add("dark");
  var f=localStorage.getItem(k.fontSize);
  if(f&&fs[f])d.style.setProperty("--font-base-size",fs[f]);
  var dn=localStorage.getItem(k.density);
  if(dn==="compact"){d.classList.add("density-compact");d.style.setProperty("--density-scale","${compactScale}");}
  var a=localStorage.getItem(k.accentColor);
  if(a&&c[a]){
    d.style.setProperty("--brand-accent", isDark ? c[a].accentDark : c[a].accentLight);
    d.style.setProperty("--brand-accent-text", isDark ? c[a].accentTextDark : c[a].accentTextLight);
    d.style.setProperty("--brand-accent-foreground", (isDark && c[a].accentForegroundDark) ? c[a].accentForegroundDark : c[a].accentForeground);
    d.style.setProperty("--ring", isDark ? c[a].accentDark : c[a].accentLight);
  }
  if(localStorage.getItem(k.reducedMotion)==="true")d.classList.add("reduce-motion");
}catch(e){}})();`
}
