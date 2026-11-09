/**
 * Single source of truth for theme tokens shared by:
 * - app/layout.tsx (pre-hydration display settings and status-bar color)
 * - components/theme-context.tsx (client-side display preferences)
 *
 * This module must stay framework-free (no "use client", no React) so it can
 * be imported from both server and client code.
 */

export type FontSize = "small" | "medium" | "large"
export type Density = "comfortable" | "compact"
export type ThemeMode = "light" | "dark"

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
  colorMode: "theme",
  legacyAccentColor: "accentColor",
  fontSize: "fontSize",
  density: "density",
  reducedMotion: "reducedMotion",
} as const

export const APP_THEME_COLORS: Record<ThemeMode, string> = {
  light: "#f4f5f7",
  dark: "#121418",
}

/**
 * Inline script injected into <head> so persisted theme preferences apply
 * synchronously before React hydrates (prevents FOUC). Keep the logic here
 * in sync with the effects in ThemeProvider — both read the same constants,
 * so token changes propagate automatically.
 */
export function buildThemeBootstrapScript(): string {
  const fontSizes = JSON.stringify(FONT_SIZE_MAP)
  const themeColors = JSON.stringify(APP_THEME_COLORS)
  const compactScale = DENSITY_SCALE_MAP.compact
  const k = JSON.stringify(THEME_STORAGE_KEYS)

  return `(function(){try{
  var d=document.documentElement;
  var fs=${fontSizes};
  var tc=${themeColors};
  var k=${k};
  var t=localStorage.getItem(k.colorMode)==="dark"?"dark":"light";
  d.classList.toggle("dark",t==="dark");
  var m=document.querySelector('meta[name="theme-color"]');
  if(m)m.setAttribute("content",tc[t]);
  localStorage.removeItem(k.legacyAccentColor);
  d.style.removeProperty("--brand-accent");
  d.style.removeProperty("--brand-accent-text");
  d.style.removeProperty("--brand-accent-foreground");
  d.style.removeProperty("--ring");
  var f=localStorage.getItem(k.fontSize);
  if(f&&fs[f])d.style.setProperty("--font-base-size",fs[f]);
  var dn=localStorage.getItem(k.density);
  if(dn==="compact"){d.classList.add("density-compact");d.style.setProperty("--density-scale","${compactScale}");}
  if(localStorage.getItem(k.reducedMotion)==="true")d.classList.add("reduce-motion");
  localStorage.setItem(k.colorMode,t);
}catch(e){}})();`
}
