# Plan: Paleta shadcn UI global + eliminar hardcoding de colores/fonts

## Contexto

El proyecto ya tiene el sistema shadcn UI **parcialmente** implementado: [app/globals.css](app/globals.css), [tailwind.config.ts](tailwind.config.ts) y [components.json](components.json) usan variables CSS HSL correctas en light/dark. Sin embargo, hay problemas graves:

- **418 ocurrencias** de clases hardcodeadas (`dark:bg-gray-800`, `dark:border-gray-700`, `dark:text-gray-400`, etc.) en 10 componentes.
- Colores **hex hardcodeados** en charts ([capacitacion-chart.tsx](components/capacitacion-chart.tsx), [rg-cumplimiento-chart.tsx](components/rg-cumplimiento-chart.tsx)), [color-picker.tsx](components/color-picker.tsx) y [flayers.tsx](components/content/flayers.tsx).
- Colores hex en efectos decorativos CSS ([app/globals.css:141,149,157](app/globals.css#L141) — hero orbs).
- **Font-family hardcodeado**: `Arial, Helvetica, sans-serif` en [styles/globals.css:6](styles/globals.css#L6).
- **Código muerto**: [styles/globals.css](styles/globals.css) (no se importa) y [components/theme-provider.tsx](components/theme-provider.tsx) (reemplazado por [theme-context.tsx](components/theme-context.tsx)).
- [settings.tsx](components/content/settings.tsx) usa `bg-blue-500`, `bg-purple-500`, etc. para el selector de acento en vez de valores de `ACCENT_COLOR_MAP` ([theme-context.tsx:33-58](components/theme-context.tsx#L33-L58)).

El objetivo es consolidar todo el sistema en la paleta shadcn ya definida, añadir tokens de charts, y eliminar el hardcoding — **sin romper** el sistema de personalización de usuario (theme light/dark, color de acento + custom, tamaño de fuente, reduced motion) que vive en [components/theme-context.tsx](components/theme-context.tsx).

## Paleta actual (shadcn UI estándar — se mantiene)

Ya está definida en [app/globals.css](app/globals.css):

**Light mode**
| Token | Valor HSL | Uso |
|---|---|---|
| `--background` | `0 0% 100%` | Fondo base |
| `--foreground` | `222.2 84% 4.9%` | Texto base |
| `--card` | `0 0% 100%` | Fondo tarjetas |
| `--card-foreground` | `222.2 84% 4.9%` | Texto tarjetas |
| `--popover` / `--popover-foreground` | igual card | Popovers |
| `--primary` | `221.2 83.2% 53.3%` | Azul (dinámico por settings) |
| `--primary-foreground` | `210 40% 98%` | Texto sobre primary |
| `--secondary` / `--accent` / `--muted` | `210 40% 96.1%` | Superficies suaves |
| `--secondary-foreground` / `--accent-foreground` | `222.2 47.4% 11.2%` | |
| `--muted-foreground` | `215.4 16.3% 46.9%` | Texto secundario |
| `--destructive` | `0 84.2% 60.2%` | Rojo errores |
| `--destructive-foreground` | `210 40% 98%` | |
| `--border` / `--input` | `214.3 31.8% 91.4%` | Bordes y inputs |
| `--ring` | `221.2 83.2% 53.3%` | Focus ring |
| `--radius` | `0.5rem` | Border radius base |

**Dark mode**
| Token | Valor HSL |
|---|---|
| `--background` / `--card` / `--popover` | `222.2 84% 4.9%` |
| `--foreground` / `--card-foreground` / `--popover-foreground` | `210 40% 98%` |
| `--primary` | `217.2 91.2% 59.8%` |
| `--primary-foreground` | `222.2 47.4% 11.2%` |
| `--secondary` / `--muted` / `--accent` / `--border` / `--input` | `217.2 32.6% 17.5%` |
| `--secondary-foreground` / `--accent-foreground` | `210 40% 98%` |
| `--muted-foreground` | `215 20.2% 65.1%` |
| `--destructive` | `0 62.8% 30.6%` |
| `--ring` | `212.7 26.8% 83.9%` |

**Tokens nuevos a añadir** (para charts):
- Light: `--chart-1: 221 83% 53%`, `--chart-2: 142 76% 36%`, `--chart-3: 24 95% 53%`, `--chart-4: 262 83% 58%`, `--chart-5: 339 91% 52%`
- Dark: `--chart-1: 217 91% 60%`, `--chart-2: 160 60% 45%`, `--chart-3: 30 80% 55%`, `--chart-4: 280 65% 60%`, `--chart-5: 340 75% 55%`

## Pasos de implementación

### 1. Limpieza de código muerto
- Eliminar [styles/globals.css](styles/globals.css) (no importado en ningún lado; contiene paleta grayscale distinta que confunde).
- Eliminar [components/theme-provider.tsx](components/theme-provider.tsx) (reemplazado por [theme-context.tsx](components/theme-context.tsx); verificado sin imports).

### 2. Extender [app/globals.css](app/globals.css)
- Añadir `--chart-1` a `--chart-5` en `:root` y `.dark`.
- Reemplazar colores hex en `.hero-orb-*` (líneas 141, 149, 157) por `hsl(var(--primary))`, `hsl(var(--primary) / 0.8)`, `hsl(var(--accent))` — que los orbs se adapten al acento del usuario.
- Reemplazar `rgba(155,155,155,0.5)` y `rgba(75,75,75,0.5)` del scrollbar (líneas 217, 223, 227, 231) por `hsl(var(--muted-foreground) / 0.5)` (funciona en light y dark, el foreground mute ya cambia por tema).
- Reemplazar `rgba(255,255,255,0.15)` del grid overlay (líneas 168-169, 309-310) por `hsl(var(--foreground) / 0.08)`.

### 3. Extender [tailwind.config.ts](tailwind.config.ts)
Añadir en `theme.extend.colors`:
```ts
chart: {
  "1": "hsl(var(--chart-1))",
  "2": "hsl(var(--chart-2))",
  "3": "hsl(var(--chart-3))",
  "4": "hsl(var(--chart-4))",
  "5": "hsl(var(--chart-5))",
},
```

### 4. Refactor masivo de los 10 archivos con clases dark:gray hardcodeadas

**Mapa de reemplazo** (aplicar en todos):

| Hardcoded | Token semántico |
|---|---|
| `bg-white dark:bg-gray-800` | `bg-card` |
| `bg-white dark:bg-gray-900` | `bg-background` |
| `dark:bg-gray-700` (inputs/selects) | `bg-muted` o quitar `dark:bg-*` si ya usa `bg-background` |
| `border dark:border-gray-700` | `border-border` (o solo `border` — toma el `border` default del `@layer base`) |
| `dark:border-gray-600` | `border-border` |
| `text-gray-500 dark:text-gray-400` | `text-muted-foreground` |
| `text-gray-600 dark:text-gray-300` | `text-muted-foreground` |
| `dark:text-gray-200` | `text-foreground` (quitar variante dark) |
| `dark:text-white` | `text-foreground` |
| `bg-red-50 dark:bg-red-900/20` | `bg-destructive/10` |
| `border-red-200 dark:border-red-800` | `border-destructive/30` |
| `text-red-600 dark:text-red-400` | `text-destructive` |
| `text-red-500` | `text-destructive` |
| `bg-green-50 dark:bg-green-900/20` | `bg-[hsl(var(--chart-2)/0.1)]` o `bg-emerald-500/10` (semántico de éxito — aceptable mantener) |
| `bg-yellow-50 dark:bg-yellow-900/20` | `bg-amber-500/10` (aceptable como warning) |
| `bg-blue-50 dark:bg-blue-900/20` | `bg-primary/10` |

Archivos afectados (conteo de ocurrencias):
- [components/content/settings.tsx](components/content/settings.tsx) — 42
- [components/content/capacitacion.tsx](components/content/capacitacion.tsx) — 176
- [components/Dashboard.tsx](components/Dashboard.tsx) — 9 (revisar, el grep cuenta por línea)
- [components/capacitacion-chart.tsx](components/capacitacion-chart.tsx) — 9
- [components/content/examenes.tsx](components/content/examenes.tsx) — 2
- [components/content/nuevo-ingreso.tsx](components/content/nuevo-ingreso.tsx) — 74
- [components/content/promociones.tsx](components/content/promociones.tsx) — 71
- [components/auth-form.tsx](components/auth-form.tsx) — 1
- [components/dashboard-alertas.tsx](components/dashboard-alertas.tsx) — 18
- [components/rg-cumplimiento-chart.tsx](components/rg-cumplimiento-chart.tsx) — 16

**Nota importante sobre semántica de success/warning**: shadcn vanilla no tiene tokens `--success` ni `--warning`. Para alertas de éxito/advertencia mantendremos clases Tailwind neutrales tipo `bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`, que son aceptables como colores de estado (no dependen del acento del usuario). Alternativa: añadir `--success` y `--warning` a globals.css si el usuario quiere pureza total — proponerlo si surge.

### 5. Refactor de charts ([capacitacion-chart.tsx](components/capacitacion-chart.tsx), [rg-cumplimiento-chart.tsx](components/rg-cumplimiento-chart.tsx))
Reemplazar los hex hardcodeados (#f59e0b, #ef4444, #3b82f6, #10b981, #6366f1) por funciones helper que lean las CSS vars en runtime:

```ts
// En el componente
const getChartColor = (n: 1|2|3|4|5) =>
  `hsl(${getComputedStyle(document.documentElement).getPropertyValue(`--chart-${n}`).trim()})`
```

O más simple, usar las clases Tailwind generadas (`text-chart-1`, etc.) donde sea posible y pasar strings `"hsl(var(--chart-1))"` a recharts.

### 6. Refactor de [components/color-picker.tsx](components/color-picker.tsx)
- Línea 44: `"#3b82f6"` → extraer a constante `DEFAULT_CUSTOM_COLOR` (queda como hex porque el input `type="color"` necesita hex literal, pero centralizada).
- Líneas 94, 102: reemplazar `"#000000" : "#ffffff"` por tokens: usar `color: isColorLight(tempColor) ? "hsl(var(--foreground))" : "hsl(var(--primary-foreground))"`.
- Exportar `DEFAULT_CUSTOM_COLOR` y reusar en [theme-context.tsx:138](components/theme-context.tsx#L138).

### 7. Refactor del selector de acento en [components/content/settings.tsx:42-49](components/content/settings.tsx#L42-L49)
Reemplazar el array `colorOptions` que usa `bg-blue-500`, `bg-purple-500`, etc. por uno que referencie los valores HSL del `ACCENT_COLOR_MAP` en [theme-context.tsx:33-58](components/theme-context.tsx#L33-L58):

```tsx
const colorOptions: Array<{ name: AccentColor; hsl: string; isLight: boolean }> = [
  { name: "blue",   hsl: "221.2 83.2% 53.3%", isLight: false },
  { name: "purple", hsl: "262.1 83.3% 57.8%", isLight: false },
  { name: "green",  hsl: "142.1 76.2% 36.3%", isLight: false },
  { name: "orange", hsl: "24.6 95% 53.1%",    isLight: false },
  { name: "pink",   hsl: "339 90.6% 51.8%",   isLight: false },
  { name: "yellow", hsl: "47.9 95.8% 53.1%",  isLight: true  },
]
```

Y en el render: `style={{ backgroundColor: 'hsl(' + color.hsl + ')' }}`. Esto mantiene una sola fuente de verdad (los valores ya están en `theme-context.tsx`); idealmente exportar el `ACCENT_COLOR_MAP` de [theme-context.tsx](components/theme-context.tsx) y consumirlo en [settings.tsx](components/content/settings.tsx) (mejor aún).

### 8. Refactor de [components/content/flayers.tsx](components/content/flayers.tsx)
- Línea 226 (canvas background `#ffffff`): mantener — es para exportar imagen, el canvas debe ser blanco literal.
- Líneas 462, 477 (`#3b82f6`, `#0f172a` para shapes/text defaults en el generador de flyers): mantener como constantes exportadas porque el usuario los cambia manualmente en el editor (no son del tema del sistema).
- Extraer a constantes nombradas (`DEFAULT_SHAPE_COLOR`, `DEFAULT_TEXT_COLOR`) para que sean inspeccionables y no "mágicas".

### 9. Fonts: quitar hardcoding y centralizar
- Eliminar [styles/globals.css](styles/globals.css) (paso 1) resuelve el `font-family: Arial` hardcodeado.
- Mantener la estrategia actual: no forzar font-family en CSS → usa el default del browser (system-ui stack). Esto respeta el `document.documentElement.style.fontSize` que aplica [theme-context.tsx](components/theme-context.tsx) para el tamaño.
- **No** añadir selector de familia tipográfica en settings (confirmado: el usuario solo quiere tamaño).
- Verificar que [app/layout.tsx](app/layout.tsx) no esté aplicando una font de `next/font` — ya confirmado que no lo hace.

### 10. Verificación del sistema de personalización (no debe romperse)
Confirmar que siguen funcionando:
- `theme` (light/dark) — controlado por `.dark` en `<html>`, que activa el bloque `.dark` de [app/globals.css](app/globals.css).
- `accentColor` + `customColor` — [theme-context.tsx:217-251](components/theme-context.tsx#L217-L251) setea `--primary` y `--primary-foreground` via `document.documentElement.style.setProperty`. Esto sobrescribe los valores base de globals.css en runtime. **No tocar este mecanismo.**
- `fontSize` — [theme-context.tsx:193-200](components/theme-context.tsx#L193-L200) setea `document.documentElement.style.fontSize`. No tocar.
- `reducedMotion` — clase `reduce-motion` en `<html>`. Ya usa `!important` en globals.css, no tocar.
- Script anti-FOUC en [app/layout.tsx:37-61](app/layout.tsx#L37-L61) — no tocar, ya funciona correctamente con las variables que vamos a mantener.

## Archivos críticos a modificar

1. [app/globals.css](app/globals.css) — añadir chart vars, refactor hero orbs/scrollbar/grid
2. [tailwind.config.ts](tailwind.config.ts) — añadir `colors.chart`
3. [components/theme-context.tsx](components/theme-context.tsx) — exportar `ACCENT_COLOR_MAP` para reusar en settings
4. [components/content/settings.tsx](components/content/settings.tsx) — refactor colorOptions + tokens
5. [components/content/capacitacion.tsx](components/content/capacitacion.tsx) — mayor refactor (176 ocurrencias)
6. [components/content/nuevo-ingreso.tsx](components/content/nuevo-ingreso.tsx) — 74
7. [components/content/promociones.tsx](components/content/promociones.tsx) — 71
8. [components/content/examenes.tsx](components/content/examenes.tsx) — tokens
9. [components/Dashboard.tsx](components/Dashboard.tsx) — tokens
10. [components/dashboard-alertas.tsx](components/dashboard-alertas.tsx) — 18
11. [components/capacitacion-chart.tsx](components/capacitacion-chart.tsx) — tokens + chart vars
12. [components/rg-cumplimiento-chart.tsx](components/rg-cumplimiento-chart.tsx) — tokens + chart vars
13. [components/auth-form.tsx](components/auth-form.tsx) — tokens
14. [components/color-picker.tsx](components/color-picker.tsx) — centralizar default, tokens
15. [components/content/flayers.tsx](components/content/flayers.tsx) — extraer constantes (mantener hex donde es semánticamente necesario)

## Archivos a eliminar
- [styles/globals.css](styles/globals.css)
- [components/theme-provider.tsx](components/theme-provider.tsx)

## Verificación

1. **Type check**: `npx tsc --noEmit` — no debe haber errores.
2. **Dev server**: `npm run dev`, abrir en navegador y probar:
   - **Navegación completa**: dashboard, capacitación, exámenes, nuevo ingreso, promociones, flayers, settings — todos deben verse correctamente en light y dark.
   - **Toggle light/dark en settings**: todos los componentes deben cambiar de tema sin "islas" de gris viejo.
   - **Cambiar color de acento** a los 6 presets + custom: verificar que botones, bordes activos, focus rings, charts (chart-1) se actualicen.
   - **Cambiar tamaño de fuente** small/medium/large: verificar que escala todo el sistema.
   - **Reduced motion**: verificar que las animaciones se desactivan.
   - **Charts**: capacitación (barras), RG cumplimiento — verificar que los colores de los datos siguen siendo distinguibles en ambos temas.
   - **Login page** ([components/auth-form.tsx](components/auth-form.tsx)): hero aurora y orbs deben seguir animando con el color primary del usuario.
3. **Grep de control** (debe quedar en 0 o muy cerca):
   - `dark:bg-gray-` en `components/` → 0
   - `dark:border-gray-` en `components/` → 0
   - `dark:text-gray-` en `components/` → 0
   - `#[0-9a-f]{6}` en `components/` → solo en color-picker (input type=color), flayers (canvas export), theme-context (default custom).
4. **Build de producción**: `npm run build` — debe compilar sin warnings nuevos.
