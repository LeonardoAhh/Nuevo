# Auditoría y mejoras del sistema de tema + limpieza general

## Contexto

La pestaña **Apariencia** en [components/content/settings.tsx](components/content/settings.tsx) tiene varios defectos de UX (botón "Save Preferences" no-op, mensaje en inglés, colores hardcodeados en la preview de modo claro/oscuro) y el sistema de tema más amplio tiene dead code, `any` types, y colores sueltos que rompen el diseño por tokens.

Este plan:
1. Corrige los defectos actuales de la página de preferencias.
2. Añade tokens semánticos (`success`, `warning`, `info`) al sistema CSS + Tailwind.
3. Añade 3 features: opción **Sistema** en modo de color, botón **Restablecer**, control de **Densidad**.
4. Persiste preferencias de tema en Supabase (tabla `profiles`).
5. Elimina dead code y `any` types.
6. Centraliza `STATUS_META` de [capacitacion.tsx](components/content/capacitacion.tsx) y limpia colores hardcodeados en charts.

---

## Qué está bien (no tocar)

- `globals.css` + `tailwind.config.ts` ya usan variables CSS (`--primary`, `--background`, etc.) correctamente. Solo se **extienden** con nuevos tokens.
- `ThemeProvider` ya detecta `prefers-color-scheme` y `prefers-reduced-motion` del sistema al inicializar.
- El acento custom (hex → HSL + luminancia) funciona bien.
- El formulario de perfil ya usa `react-hook-form` + `zod` con estados de carga/error.

## Qué está mal (a corregir)

### Página de preferencias

- **`saveThemePreferences()` es un no-op** ([settings.tsx:145-157](components/content/settings.tsx#L145-L157)) — solo muestra un toast; los cambios ya se auto-persisten en el contexto. Botón + texto confunden.
- **"Theme preferences saved" sin traducir** ([settings.tsx:500](components/content/settings.tsx#L500)).
- **Colores hardcodeados en la preview de modo**: `bg-white`, `text-yellow-500`, `bg-gray-900`, `text-blue-400` ([settings.tsx:374-386](components/content/settings.tsx#L374-L386)).
- **Alertas con `emerald-*` hardcodeado** ([settings.tsx:194-199](components/content/settings.tsx#L194-L199)) — no hay token `success`.

### Contexto de tema ([components/theme-context.tsx](components/theme-context.tsx))

- **Dependencia innecesaria `theme`** en el `useEffect` de acento ([theme-context.tsx:253](components/theme-context.tsx#L253)).
- **`FONT_SIZE_MAP` aplica `fontSize` directo al `documentElement`** ([theme-context.tsx:197](components/theme-context.tsx#L197)) con literales `"14px"/"16px"/"18px"`. Mejor: setear variable CSS `--font-base-size`.
- **Try/catch defensivos excesivos** alrededor de APIs confiables (`localStorage`, `matchMedia`). Simplificar.

### Dead code

- [components/theme-test.tsx](components/theme-test.tsx) — nunca importado.
- [components/themed-button.tsx](components/themed-button.tsx) — nunca importado.
- [components/content/flayers.tsx.bak](components/content/flayers.tsx.bak) — backup obsoleto.

### `any` types a eliminar

- [components/auth-form.tsx:42](components/auth-form.tsx#L42) — `catch (err: any)`
- [components/login-form.tsx:44](components/login-form.tsx#L44) — `catch (err: any)`
- [components/capacitacion-chart.tsx:57](components/capacitacion-chart.tsx#L57) — `CustomTooltip({...}: any)` → tipar con `TooltipProps` de recharts
- [components/rg-cumplimiento-chart.tsx:72](components/rg-cumplimiento-chart.tsx#L72) — idem
- [lib/hooks/useCapacitacion.ts:618](lib/hooks/useCapacitacion.ts#L618) — `(rc.course as any)?.name`

### Colores hardcodeados

- **`STATUS_META` en [capacitacion.tsx:61-65](components/content/capacitacion.tsx#L61-L65)** — 4 entradas (`text-green-600`, `bg-yellow-50`, `border-red-200`, etc.) repetidas >60 veces en 2000 LOC. Centralizar con nuevos tokens.
- **[capacitacion-chart.tsx:265-270](components/capacitacion-chart.tsx#L265-L270)** — `rgba(156,163,175,0.15)`, `#9ca3af`. Usar `hsl(var(--muted-foreground))`.
- **[rg-cumplimiento-chart.tsx](components/rg-cumplimiento-chart.tsx)** — mismo patrón.

---

## Implementación paso a paso

### Paso 1 — Tokens semánticos

**Archivo:** [app/globals.css](app/globals.css)
Añadir dentro de `:root` y `.dark` (ajustar valores para cada modo):
```css
--success: 142 76% 36%;
--success-foreground: 356 100% 97%;
--warning: 38 92% 50%;
--warning-foreground: 48 96% 10%;
--info: 199 89% 48%;
--info-foreground: 210 40% 98%;
--font-base-size: 16px;
--density-scale: 1;
```
Añadir al final:
```css
html { font-size: var(--font-base-size); }
```

**Archivo:** [tailwind.config.ts](tailwind.config.ts)
En `theme.extend.colors`, añadir (siguiendo el patrón de `destructive`):
```ts
success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
info: { DEFAULT: "hsl(var(--info))", foreground: "hsl(var(--info-foreground))" },
```

### Paso 2 — Ampliar `ThemeContext`

**Archivo:** [components/theme-context.tsx](components/theme-context.tsx)

- `Theme = "light" | "dark" | "system"` — cuando es `"system"`, aplicar/quitar `.dark` según `matchMedia("(prefers-color-scheme: dark)")` y suscribirse a cambios (`addEventListener("change", ...)`) con cleanup.
- `Density = "comfortable" | "compact"` — nuevo estado. Setear `document.documentElement.style.setProperty("--density-scale", "1" | "0.875")` y persistir.
- Cambiar efecto de font-size para setear `--font-base-size` vía `style.setProperty` en vez de `style.fontSize`.
- Añadir `resetTheme()`: vuelve a defaults (`light`, `blue`, `medium`, `comfortable`, `reducedMotion=false`) y limpia las claves de `localStorage`.
- Eliminar dependencia `theme` innecesaria del useEffect de acento ([theme-context.tsx:253](components/theme-context.tsx#L253)).
- Simplificar try/catch (dejarlos solo en el `useEffect` de init por `matchMedia`/localStorage).

### Paso 3 — Persistencia en Supabase

**Migración nueva:** `supabase/migrations/011_theme_preferences.sql`
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme_preferences JSONB DEFAULT '{}'::jsonb;
```

**Archivo:** [lib/hooks/useProfile.ts](lib/hooks/useProfile.ts)
- Añadir `themePreferences?: ThemePreferences` al `UserProfile`.
- Mapear `data.theme_preferences` en `fetchProfile`.
- Añadir método `updateThemePreferences(prefs)` que hace `update` en `profiles` con `theme_preferences = prefs`.

**Archivo:** [components/theme-context.tsx](components/theme-context.tsx)
- Al montar con usuario: si `profile.themePreferences` existe, cargar (prioridad DB > localStorage).
- Al cambiar cualquier preferencia: debounce 500ms → `updateThemePreferences()`.
- Cuando no hay usuario: seguir con solo `localStorage`.

Esto requiere que `ThemeProvider` tenga acceso al hook `useProfile`, que ya depende de `useUser`. Ambos ya existen — inyectar el sync como un hook hijo del provider o usar un `ThemeSyncBridge` montado dentro del provider.

### Paso 4 — Refactor de `SettingsContent` (Apariencia)

**Archivo:** [components/content/settings.tsx](components/content/settings.tsx)

- **Eliminar** `saveThemePreferences`, el estado `showSavedMessage` asociado al tema y el botón "Save Preferences" ([settings.tsx:145-157, 490-510](components/content/settings.tsx#L490-L510)). Reemplazar por:
  - Botón secundario **"Restablecer valores por defecto"** que llama a `resetTheme()`.
- Añadir **tercera tarjeta "Sistema"** en Modo de color (icono `Monitor` de lucide) junto a Claro/Oscuro.
- Reemplazar `bg-white`/`bg-gray-900`/`text-yellow-500`/`text-blue-400` de los cards de preview por clases tematicas: usar `bg-background border-border` y dejar que el icono use `text-foreground` o `text-primary`.
- Alertas de éxito (Perfil): cambiar `border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400` por `border-success/30 bg-success/10 text-success` ([settings.tsx:194-199](components/content/settings.tsx#L194-L199)).
- Añadir nuevo `Select` **"Densidad"** con opciones Cómoda/Compacta debajo de Tamaño de fuente.

### Paso 5 — Centralizar `STATUS_META`

**Archivo nuevo:** `lib/constants/status.ts`
```ts
export const STATUS_META = {
  exact:       { color: "text-success",     bg: "bg-success/10",     border: "border-success/30",     label: "Exacto" },
  alias:       { color: "text-info",        bg: "bg-info/10",        border: "border-info/30",        label: "Alias" },
  approximate: { color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     label: "Aproximado" },
  unknown:     { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Desconocido" },
} as const
```

**Archivo:** [components/content/capacitacion.tsx](components/content/capacitacion.tsx)
- Borrar `STATUS_META` inline ([capacitacion.tsx:61-65](components/content/capacitacion.tsx#L61-L65)); importar de `@/lib/constants/status`.
- Buscar y reemplazar las instancias sueltas de `border-green-200 bg-green-50 dark:border-green-800` y similares (hay ~60) por las utilidades del `STATUS_META` o las clases semánticas directas. Hacer replace por familia (green → success, blue → info, yellow → warning, red → destructive).
- Tipar el `any[]` en [capacitacion.tsx:334](components/content/capacitacion.tsx#L334) con un type `ImportedRow`.

### Paso 6 — Limpieza final

- Borrar [components/theme-test.tsx](components/theme-test.tsx), [components/themed-button.tsx](components/themed-button.tsx), [components/content/flayers.tsx.bak](components/content/flayers.tsx.bak).
- Reemplazar `catch (err: any)` por `catch (err)` con narrowing (`err instanceof Error`) en [auth-form.tsx:42](components/auth-form.tsx#L42) y [login-form.tsx:44](components/login-form.tsx#L44).
- Tipar `CustomTooltip` en [capacitacion-chart.tsx:57](components/capacitacion-chart.tsx#L57) y [rg-cumplimiento-chart.tsx:72](components/rg-cumplimiento-chart.tsx#L72) con `TooltipProps<ValueType, NameType>` de `recharts`.
- Reemplazar `rgba(156,163,175,0.15)`/`#9ca3af` en ambos charts por `hsl(var(--muted-foreground) / 0.15)` y `hsl(var(--muted-foreground))`.
- Tipar `(rc.course as any)?.name` en [useCapacitacion.ts:618](lib/hooks/useCapacitacion.ts#L618).

---

## Archivos críticos

| Archivo | Cambios |
|---|---|
| [app/globals.css](app/globals.css) | Tokens `--success`/`--warning`/`--info`/`--font-base-size`/`--density-scale` (light + dark); `html { font-size: var(--font-base-size) }` |
| [tailwind.config.ts](tailwind.config.ts) | Registrar `success`/`warning`/`info` en `theme.extend.colors` |
| [components/theme-context.tsx](components/theme-context.tsx) | Modo `"system"`, densidad, `resetTheme()`, suscripción a `matchMedia`, variable CSS para font-size, limpieza de efectos |
| [components/content/settings.tsx](components/content/settings.tsx) | Eliminar botón/toast no-op, añadir Sistema, Restablecer, Densidad, quitar colores hardcodeados |
| `supabase/migrations/011_theme_preferences.sql` *(nuevo)* | `ALTER TABLE profiles ADD COLUMN theme_preferences jsonb` |
| [lib/hooks/useProfile.ts](lib/hooks/useProfile.ts) | Exponer y actualizar `theme_preferences` |
| `lib/constants/status.ts` *(nuevo)* | `STATUS_META` con tokens semánticos |
| [components/content/capacitacion.tsx](components/content/capacitacion.tsx) | Importar `STATUS_META`; reemplazar `text-green-*/bg-yellow-*/border-red-*` por tokens |
| [components/capacitacion-chart.tsx](components/capacitacion-chart.tsx), [components/rg-cumplimiento-chart.tsx](components/rg-cumplimiento-chart.tsx) | Tipar `CustomTooltip`; reemplazar `rgba/#hex` por `hsl(var(--muted-foreground))` |
| [components/auth-form.tsx](components/auth-form.tsx), [components/login-form.tsx](components/login-form.tsx) | Quitar `any` en catches |
| [lib/hooks/useCapacitacion.ts](lib/hooks/useCapacitacion.ts) | Tipar `rc.course` correctamente |
| Borrar: [components/theme-test.tsx](components/theme-test.tsx), [components/themed-button.tsx](components/themed-button.tsx), [components/content/flayers.tsx.bak](components/content/flayers.tsx.bak) | — |

## Funciones y utilidades existentes a reutilizar

- [components/theme-context.tsx](components/theme-context.tsx) `ACCENT_COLOR_MAP`, `hexToHSL`, `isColorLight` — ya existen, reutilizar tal cual.
- [lib/hooks/useProfile.ts](lib/hooks/useProfile.ts) `updateProfile` — extender con un método paralelo `updateThemePreferences` o reutilizar el mismo patrón de `update`.
- Componentes `Alert`, `Badge`, `Button`, `Card`, `Switch` de [components/ui](components/ui) — ya soportan variantes; solo hay que añadir variante `success` al `Alert` (o usar clases directas `bg-success/10`).
- [lib/supabase/client.ts](lib/supabase/client.ts) — cliente ya configurado para el `update` en `profiles`.

---

## Verificación

1. **Migración DB:** aplicar `011_theme_preferences.sql` en Supabase local (`supabase db reset` o `psql`). Confirmar columna con `\d profiles`.
2. **Build:** `npm run build` — cero errores TS, cero warnings nuevos.
3. **Dev server + `/settings` → Apariencia:**
   - Alternar Claro/Oscuro/**Sistema**; con Sistema activo, cambiar el tema del SO y confirmar que la app sigue el cambio en vivo.
   - Probar los 6 presets + color custom; confirmar que el acento se aplica en `/` (Dashboard) y `/capacitacion`.
   - Cambiar tamaño de fuente → el texto global escala; inspeccionar `html { font-size: 14px/16px/18px }` vía devtools.
   - Cambiar Densidad a Compacta → paddings reducidos en tarjetas.
   - Activar Movimiento reducido → animaciones detenidas.
   - **Restablecer** → vuelve todo a defaults.
   - **No debe existir** el botón "Save Preferences" ni el toast "Theme preferences saved".
4. **Persistencia Supabase:** recargar la página en otro navegador con el mismo usuario — las preferencias deben reaparecer idénticas (probar tras 500ms+ para que el debounce escriba).
5. **`/capacitacion`:** verificar badges `STATUS_META` en importación de catálogo (exact/alias/approximate/unknown) — siguen visibles con los nuevos tokens `success`/`info`/`warning`/`destructive`.
6. **Charts:** `/` Dashboard y `/capacitacion` — las grids/ejes ya no usan hex; verificar modo oscuro para asegurar contraste.
7. **Grep final:**
   ```
   grep -RIn "text-green-[0-9]\|bg-yellow-[0-9]\|border-red-[0-9]\|text-emerald-[0-9]\|#[0-9a-fA-F]\{6\}\|rgba(" components/ app/ lib/
   ```
   Los únicos hits aceptables deben estar en `lib/flayer/templates.ts` (plantillas de flyers — fuera de alcance).

## Fuera de alcance

- Refactor de [lib/flayer/templates.ts](lib/flayer/templates.ts) — son plantillas visuales deliberadas.
- Atajo de teclado para alternar tema (descartado por el usuario).
- Cambios en la estructura general de `flayers.tsx` / `flayers-new.tsx` más allá del backup.
