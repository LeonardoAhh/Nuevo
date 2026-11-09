AGENTS.md
Guía operativa para agentes de código (Claude Code, Cursor, Copilot, etc.) que trabajen en el proyecto ViñoPlastic. Léela completa antes de generar o modificar código. El documento de referencia visual completo vive en design.md.

1. Contexto del proyecto
ViñoPlastic es una aplicación web construida sobre el sistema de diseño Mona Sans / Vercel-like documentado en design.md. Se compone de dos superficies:

Marketing (home, pricing, customers, AI Gateway): hero con mesh gradient, grids de cards con hairline, bandas CTA.

App autenticada (workspace): panel elevado con sidebar, header sticky, data grids, formularios y evaluaciones.

Marketing conserva la estética ink-on-white: casi todo es neutro, un solo gradiente decorativo, tipografía apretada y bordes de 1px. El workspace ofrece las paletas clara y oscura definidas abajo; conserva sus colores semánticos para acciones y estados.

Override aplicado en ViñoPlastic: la aplicación tiene paletas de tema claro y oscuro. El --primary es #1c3a9c en claro y #9ec1ff en oscuro; acciones, focus rings y estados seleccionados usan el token del tema. Los botones de marketing tipo pill conservan el color de tinta neutra del tema.

2. Stack esperado
Asume y respeta lo siguiente (verifica en package.json antes de introducir algo distinto):

Next.js (App Router) + React + TypeScript

Tailwind CSS con tokens mapeados en tailwind.config.ts / globals.css vía CSS variables

Mona Sans bundleada localmente (SIL OFL) — no la cargues desde Google Fonts

Componentes UI tipo shadcn/ui permitidos, pero re-estilizados con los tokens de este archivo

Iconografía: lucide-react (línea fina, coherente con el trazo "ink-on-white")

Si el proyecto difiere de esto, pregunta antes de añadir dependencias nuevas.

3. Tokens (valores canónicos)
3.1 Color
css
/* Tema claro */
--background:        #f4f5f7;
--foreground:        #14171c;
--card:              #ffffff;
--popover:           #ffffff;
--primary:           #1c3a9c;
--primary-foreground:#ffffff;
--secondary:         #e4e7ec;
--muted:             #eceef1;
--muted-foreground:  #3a4250;
--accent:            #dde6f7;
--accent-foreground: #122a6b;
--destructive:       #8f1d1d;
--border:            #c9ced6;
--input:             #7a8494;
--ring:              #1c3a9c;
--sidebar:           var(--background);
--chart-1:           #1c3a9c;
--chart-2:           #3b82f6;
--chart-3:           #475569;
--chart-4:           #0e7490;
--chart-5:           #64748b;
--sidebar-foreground:var(--foreground);
--sidebar-primary:   #1c3a9c;
--sidebar-primary-foreground: #ffffff;
--sidebar-accent:    #d5dff3;
--sidebar-accent-foreground: #122a6b;
--sidebar-border:    #c9ced6;
--sidebar-ring:      #1c3a9c;
--success:           #0070f3;
--warning:           #f5a623;

/* Tema oscuro */
--background:        #121418;
--foreground:        #eceff3;
--card:              #1a1d23;
--popover:           #1a1d23;
--primary:           #9ec1ff;
--primary-foreground:#0a1228;
--secondary:         #262b33;
--muted:             #20242b;
--muted-foreground:  #b8c0cc;
--accent:            #1f2f55;
--accent-foreground: #d3e2ff;
--destructive:       #ff9b9b;
--border:            #363c46;
--input:             #7d8798;
--ring:              #9ec1ff;
--sidebar:           var(--background);
--chart-1:           #9ec1ff;
--chart-2:           #60a5fa;
--chart-3:           #94a3b8;
--chart-4:           #22d3ee;
--chart-5:           #cbd5e1;
--sidebar-foreground:var(--foreground);
--sidebar-primary:   #9ec1ff;
--sidebar-primary-foreground: #0a1228;
--sidebar-accent:    #1b2a4d;
--sidebar-accent-foreground: #d3e2ff;
--sidebar-border:    #363c46;
--sidebar-ring:      #9ec1ff;

/* Links / acento */
--link:              #0070f3;
--link-deep:         #0761d1;
--link-soft:         #d3e5ff;

/* Acentos de ilustración (uso mínimo, nunca como chrome) */
--violet:            #7928ca;
--cyan:              #50e3c2;
--pink:              #ff0080;
--magenta:           #eb367f;

/* Semánticos */
--error:             #ee0000;
--error-deep:        #c50000;
--warning:           #f5a623;
--success:           #0070f3;   /* el azul dobla como positivo */

/* Gradiente de marca (solo hero / ilustraciones) */
--gradient-develop-start:  #007cf0;
--gradient-develop-end:    #00dfd8;
--gradient-preview-start:  #7928ca;
--gradient-preview-end:    #ff0080;
--gradient-ship-start:     #ff4d4d;
--gradient-ship-end:       #f9cb28;
3.2 Tipografía
Token	Size	Weight	Line Height	Letter Spacing	Uso
display-xl	48px	600	48px	-2.4px	Hero H1
heading-lg	32px	600	40px	-1.28px	Secciones mayores
heading-md	20px	600	28px	-0.4px	Subsecciones / card headings
label-sm	14px	500	20px	-0.28px	Labels fuertes, nav emphasis
eyebrow	12px	500	16px	0	Eyebrows uppercase en Mona Sans
body-lg	16px	400	24px	0	Párrafos lead
body-md	14px	400	20px	0	Body default, nav, tablas
body-sm	12px	400	16px	0	Captions, metadata
button-lg	16px	500	20px	0	Pills de marketing
button-md	14px	500	20px	0	Botones nav/app
code	14px	400	20px	0	Código en Mona Sans
Reglas tipográficas no negociables:

Display siempre en 600 con tracking negativo (más negativo cuanto más grande).

Body siempre 400, sin tracking.

No existe peso 300 ni 800/900, ni itálicas. No los uses.

Mona Sans es la única familia tipográfica para toda la interfaz, incluido el código.

3.3 Espaciado
Base 4px. Escala: 4 · 8 · 12 · 16 · 24 · 32 · 40 · 64 · 96 · 128.

Interiores de card: 24–32px.

Bandas de sección: 96–128px vertical.

Botones: solo padding horizontal, altura por line-height (nunca vertical padding).

3.4 Radios
Token	Valor	Uso
none	0	Bandas full-bleed, divisores
sm	6px	Botones nav/app, inputs
md	12px	Feature cards, code blocks
lg	16px	Pricing cards, paneles
pill-category	64px	Tabs de categoría
pill	100px	CTAs de marketing
full	9999px	Solo avatares circulares
Bimodal: 6px cuadrado para chrome funcional, pill para marketing y tabs, 12–16px para contenido. No uses full en botones, badges ni navegación; avatares son la única excepción. No inventes radios intermedios.

3.5 Elevación
Nivel	Tratamiento	Uso
0 — Flat	1px solid var(--hairline), sin sombra	Default en cards, inputs, divisores
1 — Whisper	Hairline + 0 1px 1px rgba(0,0,0,0.04)	Cards ligeramente elevadas
2 — Floating	0 2px 2px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.06) + inset hairline	Menús, modales, tooltips
Flat es el default. Una sombra pesada es un bug de diseño.

3.6 Layout
Contenedor centrado ~1200px con gutters.

Workspace autenticado: max-width: 1408px.

Resumen de evaluación pendiente: max-width: 960px, centrado dentro del workspace.

Gutters del workspace: 16px móvil → 24px tablet → 32px laptop+.

Frame del workspace (desktop): panel canvas-elevated, 1px hairline, radius 12px, inset 8px exterior, sin sombra. En móvil se vuelve full-bleed sin borde ni radio.

Sidebar: 44px mínimo de hit area; ruta activa con fondo blanco y borde visible. Sin grupos visibles ni divisores. En desktop, viewport-bound con scroll en el main; permite colapsar a rail de 72px con iconos centrados, nombres accesibles y preferencia persistida entre rutas. El encabezado desktop muestra “Capacitación Querétaro” y “ViñoPlastic” junto al control de colapso, dentro de un contenedor compartido con fondo blanco, borde y radio de 6px; en la rail colapsada oculta el texto y centra el control. El drawer móvil conserva su marca y permanece expandido. Usa radio de 6px en links y controles; no uses rounded-full.

Header: altura de 48px; comparte grid y gutters con el main; título a la izquierda, cuenta a la derecha. Controles con 44px mínimo.

Notices flotantes: bottom-right en desktop, top-center en móvil, respetando safe areas.

3.7 Breakpoints
Nombre	Ancho	Cambios
Mobile	≤ 640px	Stacks 1 col; nav → menú; hero type scaling down; pills full-width
Tablet	768px	Grids 2-up; nav condensada
Laptop	1024px	Grids 3–4-up; nav completa
Desktop	1200px+	Contenedor centrado max-width, grids completos
4. Componentes — API canónica
Al crear o modificar componentes, usa estos nombres y variantes. No inventes variantes nuevas sin justificarlas.

Botones
Componente	Apariencia	Cuándo
ButtonPrimary (pill)	Fondo var(--ink), texto blanco, radius: 100px, padding 0 14px, button-lg	CTAs de marketing ("Start Deploying", "Deploy")
ButtonSecondary (pill)	Fondo canvas-elevated, texto ink, hairline, radius: 100px, button-lg	CTA secundaria de marketing ("Get a Demo")
ButtonPrimarySm	Fondo --primary (azul del tema), texto de alto contraste, radius: 6px, button-md	CTA compacto de nav/app ("Sign Up")
ButtonGhostSm	Fondo canvas-elevated, texto ink, hairline, radius: 6px, button-md	Secundario en nav/app ("Log In", "Ask AI")
ButtonCategoryPill	Fondo canvas-elevated, texto ink, radius: 64px, button-md	Tabs de categoría
ButtonIcon	Fondo canvas-elevated, texto ink, hairline, radius: 6px	Controles de icono funcionales
Regla dura: marketing = pill neutro de tinta. Nav/app = cuadrado 6px azul (--primary). No mezcles las dos formas en el mismo contexto.

Inputs
TextInput: fondo canvas-elevated, texto ink, 1px solid var(--hairline), radius: 6px, padding 8px 12px, body-md.

Focus: outline: 2px solid var(--primary); outline-offset: 2px; — nunca box-shadow de glow.

Cards
FeatureCard: canvas-elevated, hairline, radius: 12px, padding 24px, body-md.

FeatureCardElevated: igual + sombra nivel 2.

PricingCard: canvas-elevated, hairline, radius: 16px, padding 32px.

CodeBlock: canvas-elevated, hairline, radius: 12px, padding 16px, Mona Sans code.

Bands
HeroBand: fondo canvas + mesh gradient (CSS/SVG), texto ink, display-xl, padding 128px 24px.

LogoStrip: fondo canvas, texto mute, padding 32px 24px, wordmarks en greyscale.

CtaBand: fondo canvas, texto ink, display-xl, padding 96px 24px, con ButtonPrimary.

Footer: fondo canvas, top hairline, texto body, padding 64px 24px, columnas de links.

Navegación
NavBar: fondo canvas, bottom hairline, texto body, padding 12px 24px. Wordmark negro + ghost links + ButtonPrimarySm / ButtonGhostSm.

NavLink: body, body-md, radius: 6px, padding 8px 12px, transparente hasta interacción.

5. Reglas de oro (Do / Don't)
✅ Haz
Canvas near-white + ink near-black. Todo el chrome neutro sale de la ladder ink → body → mute → faint.

Color solo en dos sitios: hero mesh gradient + acentos de ilustración. Nada más.

Reutiliza los dos shapes de botón por contexto (pill marketing / 6px app).

1px hairline antes que cualquier sombra. Flat por defecto.

Display con tracking negativo. Mona Sans 600.

Eyebrows en Mona Sans uppercase para introducir secciones.

Respeta la ladder de grises al elegir color de texto.

Usa tokens CSS variables (var(--ink), var(--primary), etc.) — nunca hardcodees hex en el JSX/servidor.

❌ No hagas
En marketing, no rellenes superficies grandes con violeta/cyan/pink/azul — viven en el gradiente y en ilustraciones. En el workspace, usa solo las superficies de la paleta activa y reserva el primario para acciones y estados seleccionados.

No mezcles shapes de botón en un mismo contexto.

No apiles sombras. Hairline + (como máximo) una sombra fina en capas.

En marketing, no uses #000000: la tinta es #171717 y el body es #4d4d4d. En el workspace, usa el foreground de la paleta activa.

No añadas un segundo sistema decorativo. El mesh gradient es el único flourish.

No aflojes el tracking de los headings grandes.

No declares ni cargues familias tipográficas distintas de Mona Sans.

No introduzcas pesos tipográficos nuevos (light/black/italic).

No cargues Mona Sans desde Google Fonts. Es local (SIL OFL).

No uses --primary para texto largo ni para fills decorativos. Solo acciones primarias y estados seleccionados.

6. Accesibilidad
Hit area mínimo 44×44px en todo control interactivo (botones, nav, icon buttons). En pills y 6px se consigue vía line-height + min-height, nunca con padding vertical que rompa la regla de "padding solo horizontal".

Focus visible siempre: outline: 2px solid var(--primary); outline-offset: 2px;. No elimines el outline sin reemplazo equivalente.

Contraste: usa los tokens foreground/muted-foreground del tema activo y verifica AA en cada superficie. muted-foreground se reserva para texto secundario.

Iconos decorativos: aria-hidden="true". Iconos con función: aria-label obligatorio.

Botones de solo icono: aria-label no negociable.

7. Convenciones de código
Estructura
text
/app                      → rutas Next.js (App Router)
  /(marketing)            → grupo de marketing
  /(app)                  → grupo autenticado
/components
  /ui                     → componentes base (Button, Input, Card, …)
  /marketing              → NavBar, HeroBand, CtaBand, Footer, …
  /app                    → WorkspaceFrame, Sidebar, Header, …
/lib
  /tokens                 → opcional: exporta constantes TS de los tokens
/styles
  globals.css             → CSS variables + base
Reglas de estilo
No hardcodees hex en componentes. Usa siempre var(--token) o la clase Tailwind mapeada (ej. bg-canvas, text-ink, border-hairline).

No crees clases utilitarias ad-hoc para colores; si falta un token, agrégalo en globals.css y en tailwind.config.ts, no lo inventes inline.

Componentes presentacionales no deben importar lógica de negocio; los datos llegan por props.

Server Components por defecto; "use client" solo cuando haya estado, efectos o handlers.

Tipado estricto: no any implícito. Si el tipo es desconocido, usa unknown y refina.

No introduzcas librerías de UI completas (MUI, Chakra, Ant, etc.) — romperían el sistema.

Naming
Componentes: PascalCase. Archivos de componente: PascalCase.tsx. Utilidades: kebab-case.ts.

Props: camelCase. Booleanos con prefijo is/has/should.

Variantes de componentes: prop variant con union literal ("primary" | "ghost" | …).

8. Antes de dar una tarea por terminada
Checklist rápida — el agente debe verificarla:

□ ¿Las superficies usan los tokens del tema activo (background, card, popover)?
□ ¿Los textos siguen la ladder ink → body → mute → faint?
□ ¿Los botones usan el shape correcto según contexto (pill vs 6px)?
□ ¿Las cards tienen hairline de 1px y, como mucho, sombra whisper/floating?
□ ¿Los headings usan Mona Sans 600 con tracking negativo?
□ ¿Los textos, etiquetas y código usan Mona Sans?
□ ¿Marketing reserva el color para el hero y las ilustraciones, y el workspace usa solo la paleta activa?
□ ¿Los controles interactivos tienen ≥44px de hit area?
□ ¿El focus es visible y usa --primary del tema activo?
□ ¿Los colores salen de var(--token), no de hex hardcodeado?
□ ¿Compila (pnpm build / npm run build) y pasa lint?
9. Cuándo preguntar en vez de asumir
Detente y pregunta al humano si:

El cambio requiere una nueva variante de componente no listada en la sección 4.

El cambio requiere un color, peso tipográfico o radio nuevo no documentado.

El cambio pide una sombra más fuerte que "floating".

El cambio sugiere un segundo sistema decorativo (ilustraciones raster, glows, blur decorativo).

El cambio va a introducir una dependencia de UI (MUI, Chakra, Ant, etc.).

El cambio contradice alguna regla de la sección 5.

En caso de duda: menos es más. El sistema Mona Sans es un ejercicio de resta. El agente debe restar antes que añadir.