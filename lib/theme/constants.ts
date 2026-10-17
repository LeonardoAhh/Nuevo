/**
 * Single source of truth for theme tokens shared by:
 * - app/layout.tsx (pre-hydration display settings and status-bar color)
 * - components/theme-context.tsx (client-side display preferences)
 *
 * This module must stay framework-free (no "use client", no React) so it can
 * be imported from both server and client code.
 */

export type AccentColor =
  | "blue"
  | "violet"
  | "pink"
  | "magenta"
  | "green"
  | "monochrome"

export type FontSize = "small" | "medium" | "large"
export type Density = "comfortable" | "compact"

export const ACCENT_COLOR_MAP: Record<
  AccentColor,
  { accent: string; accentText: string; accentForeground: string; label: string }
> = {
  blue: { accent: "212.35 100% 47.65%", accentText: "212.02 100% 43.73%", accentForeground: "0 0% 100%", label: "Azul" },
  violet: { accent: "270 66.94% 47.45%", accentText: "270 66.94% 47.45%", accentForeground: "0 0% 100%", label: "Violeta" },
  pink: { accent: "329.88 100% 50%", accentText: "330 100% 38.82%", accentForeground: "0 0% 9%", label: "Rosa" },
  magenta: { accent: "335.8 81.9% 56.67%", accentText: "336.44 70.56% 45.29%", accentForeground: "0 0% 9%", label: "Magenta" },
  green: { accent: "152 48% 38%", accentText: "152 48% 38%", accentForeground: "0 0% 100%", label: "Verde" },
  monochrome: { accent: "0 0% 9.02%", accentText: "0 0% 9.02%", accentForeground: "0 0% 100%", label: "Tinta" },
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
  legacyColorMode: "theme",
  accentColor: "accentColor",
  fontSize: "fontSize",
  density: "density",
  reducedMotion: "reducedMotion",
} as const

/** Matches the light canvas and the browser status bar. */
export const APP_THEME_COLOR = "#fafafa"

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
  d.classList.remove("dark");
  localStorage.removeItem(k.legacyColorMode);
  var f=localStorage.getItem(k.fontSize);
  if(f&&fs[f])d.style.setProperty("--font-base-size",fs[f]);
  var dn=localStorage.getItem(k.density);
  if(dn==="compact"){d.classList.add("density-compact");d.style.setProperty("--density-scale","${compactScale}");}
  var a=localStorage.getItem(k.accentColor);
  if(a&&c[a]){
    d.style.setProperty("--brand-accent", c[a].accent);
    d.style.setProperty("--brand-accent-text", c[a].accentText);
    d.style.setProperty("--brand-accent-foreground", c[a].accentForeground);
    d.style.setProperty("--ring", c[a].accent);
  }
  if(localStorage.getItem(k.reducedMotion)==="true")d.classList.add("reduce-motion");
}catch(e){}})();`
}
