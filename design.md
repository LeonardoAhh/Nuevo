## Overview

The marketing surface follows the Mona Sans system's near-white canvas and near-black ink, with color reserved for the hero mesh gradient and illustration accents. The ViñoPlastic workspace supports the explicit light and dark palettes below; its theme changes colors only, preserving Mona Sans, geometry, spacing, and elevation.

Typography does the heavy lifting. **Mona Sans** is the only typeface throughout the interface, from tightly-tracked display headlines to labels and code. Buttons split into two shapes by context: the marketing CTAs are fully rounded black **pills** (`{rounded.pill}` — 100px, "Start Deploying" / "Get a Demo"), while nav and in-app controls use a tight 6px square (`{rounded.sm}`, "Sign Up" / "Log In"). The contrast between the rounded marketing pill and the square app button is itself a deliberate signal of which surface you're on.

Surfaces barely lift. Marketing cards are white (`{colors.canvas-elevated}`) on the near-white canvas, separated by a 1px hairline and, at most, a whisper-soft layered shadow. Workspace surfaces use the active theme's card and border tokens. Feature sections are built from precise grids of hairline cards, often holding thin node-graph or code-editor illustrations rendered in the same restrained palette.

**Key Characteristics:**
- Marketing uses a neutral ink ladder on a near-white canvas; workspace colors resolve from the selected light or dark palette.
- The multi-stop mesh gradient (cyan → blue → violet → magenta → amber) is the entire decorative system, confined to the hero.
- Two button shapes by context: rounded black **pills** (`{rounded.pill}`) for marketing CTAs, tight 6px squares (`{rounded.sm}`) for nav/app controls.
- Mona Sans for all text, including tightly-tracked display type (`{typography.display-xl}` at -2.4px), uppercase technical eyebrows, and code.
- Hairline-bordered cards in precise grids; depth via 1px border + whisper shadow, never heavy elevation.
- The classic Vercel gradient trio (develop/preview/ship) survives as a named accent system: `{colors.gradient-develop-start}`→end, preview, ship.
- Color-block page rhythm: white hero with mesh gradient → logo strip → hairline feature-card grid → code-editor band → template cards → black-text CTA band → grey footer.

## Colors

> Source pages analyzed: the home page, the AI Gateway page, the customers page, and the pricing page. The ink/canvas/hairline trio recurs on every page; the accent blue (`{colors.link}`) surfaces on pricing, and the mesh-gradient stops live in the hero.

**ViñoPlastic application themes:** The app supports persistent light and dark modes. The light palette uses grafito claro surfaces and `--primary` #1c3a9c; dark mode uses grafito oscuro surfaces and `--primary` #9ec1ff. Typography (local Mona Sans), geometry, spacing, and elevation remain the same in both modes. The mode is selected in Settings and applied before hydration.

| UI token | Light | Dark |
|---|---|---|
| Background | `#f4f5f7` | `#121418` |
| Foreground | `#14171c` | `#eceff3` |
| Card / popover | `#ffffff` | `#1a1d23` |
| Primary / ring | `#1c3a9c` | `#9ec1ff` |
| Secondary | `#e4e7ec` | `#262b33` |
| Muted | `#eceef1` | `#20242b` |
| Accent | `#dde6f7` | `#1f2f55` |
| Destructive | `#8f1d1d` | `#ff9b9b` |
| Border | `#c9ced6` | `#363c46` |
| Input | `#7a8494` | `#7d8798` |
| Sidebar | Same as background (`#f4f5f7`) | Same as background (`#121418`) |
| Success | `#0070f3` | `#0070f3` |
| Warning | `#f5a623` | `#f5a623` |

Chart and sidebar semantic colors are defined as theme tokens in `app/globals.css`. The sidebar surface and text follow the active theme's background and foreground; its hover, selected, and border tokens remain distinct. The app keeps Mona Sans, its current radii, spacing scale, and elevation treatments. Accent customization is not available.

### Brand & Accent
- **Ink** (`{colors.primary}` / `{colors.ink}` — #171717): the brand's defining near-black. Headings, primary CTA fill, logo, and the darkest text tier. Paired with `{colors.on-primary}` (white).
- **Vercel Blue** (`{colors.link}` — #0070f3): the link and accent blue — inline links, pricing highlights, focus signals. Darker press tone `{colors.link-deep}` (#0761d1), pale wash `{colors.link-soft}` (#d3e5ff).
- **Violet** (`{colors.violet}` — #7928ca), **Cyan** (`{colors.cyan}` — #50e3c2), **Pink** (`{colors.pink}` — #ff0080), **Magenta** (`{colors.magenta}` — #eb367f): the chromatic accent family, used sparingly for illustration accents and as mesh-gradient stops, never as chrome fills.

### Surface
- **Canvas** (`{colors.canvas}`): the default page background; authenticated app values are `#f4f5f7` in light mode and `#121418` in dark mode.
- **Elevated** (`{colors.canvas-elevated}` — #ffffff): pure white for cards, buttons, inputs, and code blocks lifted off the canvas.
- **Hairline-Soft Surface** (`{colors.hairline-soft}` — #f2f2f2): the faintest grey fill for subtle alternating panels and inset wells.

### Text
- **Ink** (`{colors.ink}`): primary headings and high-emphasis text, resolved through the active theme's foreground token.
- **Body** (`{colors.body}`): standard paragraph and secondary copy, resolved through the active theme's muted-foreground token.
- **Mute** (`{colors.mute}`): lower-emphasis captions and metadata, resolved through the active theme's muted-foreground token.
- **Faint** (`{colors.faint}` — #a1a1a1): the lowest tier — placeholders, disabled labels.

### Borders
- **Hairline** (`{colors.hairline}`): the 1px border on every card, input, and divider; `#c9ced6` in light mode and `#363c46` in dark mode.

### Semantic
- **Error** (`{colors.error}` — #ee0000): validation / destructive, with a deep press tier `{colors.error-deep}` (#c50000).
- **Warning** (`{colors.warning}` — #f5a623): caution states, with soft `{colors.warning-soft}` and deep `{colors.warning-deep}` tiers.
- **Success** maps to `{colors.link}` (#0070f3) — the blue doubles as the positive/active signal.

### Brand Gradient
Three named two-stop gradients form the legacy Vercel gradient identity, surviving as illustration and accent washes:
- **Develop**: `{colors.gradient-develop-start}` (#007cf0) → `{colors.gradient-develop-end}` (#00dfd8) — blue to cyan.
- **Preview**: `{colors.gradient-preview-start}` (#7928ca) → `{colors.gradient-preview-end}` (#ff0080) — violet to pink.
- **Ship**: `{colors.gradient-ship-start}` (#ff4d4d) → `{colors.gradient-ship-end}` (#f9cb28) — red to amber.
These, blended together, form the hero's multi-stop mesh.

## Typography

### Font Family
The system uses locally bundled **Mona Sans** as its only typeface for UI, prose, labels, and code. The same local font asset is reused by application error surfaces.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 48px | 600 | 48px | -2.4px | Hero headline |
| `{typography.heading-lg}` | 32px | 600 | 40px | -1.28px | Major section headings |
| `{typography.heading-md}` | 20px | 600 | 28px | -0.4px | Sub-section / card headings |
| `{typography.label-sm}` | 14px | 500 | 20px | -0.28px | Strong labels, nav emphasis |
| `{typography.eyebrow}` | 12px | 500 | 16px | 0 | Uppercase Mona Sans section labels |
| `{typography.body-lg}` | 16px | 400 | 24px | 0 | Lead paragraphs, large body |
| `{typography.body-md}` | 14px | 400 | 20px | 0 | Default body, nav links, table cells |
| `{typography.body-sm}` | 12px | 400 | 16px | 0 | Captions, footnotes, metadata |
| `{typography.button-lg}` | 16px | 500 | 20px | 0 | Marketing pill button labels |
| `{typography.button-md}` | 14px | 500 | 20px | 0 | Nav / app button labels |
| `{typography.code}` | 14px | 400 | 20px | 0 | Code blocks and inline code (Mona Sans) |

### Principles
- Display type is defined by tight negative tracking — the larger the heading, the tighter (-2.4px at hero scale, -1.28px at section scale). Body type sits at neutral spacing.
- Weight is binary: 600 for headings and 500 for buttons/labels; everything else is 400. There is no light or black weight, and no italic.
- Mona Sans is used consistently for headings, body copy, labels, and code; no secondary typeface is loaded.

### Note on Font Substitutes
Mona Sans is bundled locally under the SIL Open Font License and loaded through `next/font/local`; keep heading weight at 600 and preserve the negative display tracking.

## Layout

### Spacing System
- **Base unit**: 4px. The scale steps 4 → 8 → 12 → 16 → 24 → 32 → 40 → 64 → 96 → 128px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.2xl}` 40px · `{spacing.3xl}` 64px · `{spacing.4xl}` 96px · `{spacing.section}` 128px.
- **Card interiors** sit at `{spacing.lg}`–`{spacing.xl}` (24–32px); **section bands** run `{spacing.4xl}`–`{spacing.section}` (96–128px) of vertical rhythm.
- **Button padding** is horizontal-only — marketing pills run `0px 14px`, nav buttons `0px 6px` — with height set by line-height rather than vertical padding.

### Grid & Container
- Centered max-width container (~1200px) with comfortable gutters; the hero and CTA bands center their content.
- **Authenticated workspace** (`{layout.workspace-max}` — 1408px): shared maximum width for the application header and main content. It gives data grids and three-column layouts more room without returning to a full-bleed canvas.
- **Evaluation pending summary** (`{layout.evaluation-summary-max}` — 960px): centered within the authenticated workspace; the search and evaluation form keep the workspace width.
- **Workspace gutters** (`{layout.workspace-gutter}`): 16px on mobile, 24px from tablet, and 32px from laptop upward. Header and main content must use the same gutter values and centered grid.
- **Workspace frame** (`{components.workspace-frame}`): on desktop, the authenticated header and main content share one elevated-canvas panel (`{colors.canvas-elevated}`) with a 1px hairline, 12px radius, and an 8px outer inset on all four sides. It has no shadow. The sidebar stays on the base canvas and uses the same 8px vertical inset. On mobile, the frame becomes full-bleed with no outer border or radius.
- **Workspace sidebar**: desktop and mobile navigation share a flat link list; every route has a unique icon, without visible group headings or dividers. Rows have a 44px minimum hit area; the current route uses a white surface and visible border. Desktop sidebar collapses to a 72px icon rail; icon-only links retain accessible names and tooltips, and the preference persists across routes. The expanded desktop header shows “Capacitación Querétaro” and “ViñoPlastic” beside the collapse control, grouped in a shared white, bordered container with a 6px radius; the collapsed rail hides the text and centers the control in the same container. The mobile drawer retains its brand and always remains expanded. Use 6px radius for sidebar links and controls, never full/pill radius. On desktop, the sidebar stays viewport-bound while the workspace main region owns vertical scrolling, keeping the frame border visible.
- **Workspace header**: 48px high and shares the content grid and gutter tokens; its desktop sticky inset is defined by the workspace tokens. The page title stays on the left; the account control stays on the right. Menu controls have a 44px minimum hit area and use the same neutral focus treatment as the sidebar.
- **Floating notices**: toasts and update notices sit at the bottom right on desktop and top center on mobile. Their edge inset respects mobile safe areas, and their width stays within the shared notice token.
- Feature sections use 2-up, 3-up, and 4-up hairline-card grids that collapse toward 1-up on narrow widths.
- The pricing page uses a multi-column tier grid; the customers page a logo / case-study grid.

### Whitespace Philosophy
Whitespace is structural. The near-white canvas and generous section padding do the separating work; cards are grouped by thin hairlines rather than heavy backgrounds. The page breathes — large vertical gaps between bands, tight internal rhythm inside cards.

### Responsive Strategy

#### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Mobile | ≤ 640px | Single-column stacks; nav → menu trigger; hero type scales down; pill CTAs go full-width |
| Tablet | 768px | 2-up card grids; condensed nav |
| Laptop | 1024px | 3–4-up grids; full nav row |
| Desktop | 1200px+ | Centered max-width container, full multi-column grids |

#### Touch Targets
Marketing pill CTAs (`{components.button-primary}`) and nav buttons clear the 44px WCAG-AAA target via line-height-driven height. Functional icon buttons keep a 44px hit area and 6px radius.

#### Collapsing Strategy
The workspace sidebar collapses to a 72px icon rail on desktop and remains expanded inside the mobile drawer. The marketing nav row collapses behind a menu trigger; multi-column hairline-card grids reflow to a single column; code-editor and node-graph illustrations scale or scroll rather than shrink illegibly; the pricing tier grid stacks vertically.

#### Image Behavior
The hero mesh gradient is a CSS/SVG composition that scales fluidly. Feature illustrations (node graphs, code editors) are vector/HTML, ink-on-white, scaling crisply. Customer logos sit in a greyscale strip. No heavy raster photography.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | 1px hairline (`{colors.hairline}`), no shadow | Default feature cards, inputs, dividers, the canvas |
| 1 — Whisper | Border + `0px 1px 1px rgba(0,0,0,0.04)` micro-shadow | Lightly-raised cards |
| 2 — Floating | Layered soft shadow (`0px 2px 2px` + `0px 8px 16px -4px` low-alpha black) + inset hairline | Menus, modals, tooltips |

Depth is deliberately minimal. The system prefers a crisp 1px hairline plus the near-white-on-white surface step to a shadow; when a surface floats, it uses a finely-layered, very-low-alpha shadow stack rather than a single heavy drop.

### Decorative Depth
The hero **mesh gradient** is the only atmospheric element — a soft multi-stop bloom of the brand accent colors against the white canvas. Feature illustrations (ink node-graphs, code editors) add a sense of product depth without color. No glows, no heavy gradients elsewhere.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed bands, dividers |
| `{rounded.sm}` | 6px | Nav / app buttons, inputs |
| `{rounded.md}` | 12px | Feature cards, code blocks |
| `{rounded.lg}` | 16px | Pricing cards, larger panels |
| `{rounded.pill-category}` | 64px | Category-tab pills (AI Apps / Web Apps) |
| `{rounded.pill}` | 100px | Marketing CTA pills |
| `{rounded.full}` | 9999px | Circular avatars only |

The radius language is bimodal: tight 6px squares for functional chrome, full pills for marketing CTAs and category tabs, with 12–16px on content cards in between. Do not use full/pill radius for app buttons, badges, or navigation; circular avatars are the only exception.

### Geometry
Cards are rectangles at 12–16px radius; marketing buttons and category tabs are full pills; functional icon buttons use 6px radius; only avatars are circular. Illustrations are line-weight vector graphics in ink on white.

## Components

> No hover states are documented. Each spec covers Default and (where extracted) pressed/active states. Variants live as separate `components:` entries.

### Navigation

**`nav-bar`** — top navigation
- Background `{colors.canvas}`, bottom hairline `{colors.hairline}`, text `{colors.body}`, type `{typography.body-md}`, padding `{spacing.sm} {spacing.lg}`. Holds the black wordmark, ghost nav links, and the Sign Up / Log In buttons at right.

**`nav-link`** — individual nav item
- Body-grey text `{colors.body}`, type `{typography.body-md}`, 6px radius `{rounded.sm}`, padding `{spacing.xs} {spacing.sm}`. Transparent until interacted.

### Buttons

**`button-primary`** — the black marketing pill ("Start Deploying", "Deploy")
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-lg}`, fully rounded `{rounded.pill}` (100px), padding `0px 14px`.

**`button-secondary`** — the white marketing pill ("Get a Demo")
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, type `{typography.button-lg}`, rounded `{rounded.pill}`, padding `0px 14px`. Same pill shape as primary, inverted fill.

**`button-primary-sm`** — the compact black nav CTA ("Sign Up")
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}`, tight square `{rounded.sm}` (6px), padding `0px 6px`.

**`button-ghost-sm`** — the white nav/app button ("Log In", "Ask AI")
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, 1px hairline `{colors.hairline}`, type `{typography.button-md}`, rounded `{rounded.sm}`, padding `0px 6px`.

**`button-category-pill`** — the category-tab pill ("AI Apps", "Web Apps", "Ecommerce")
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, type `{typography.button-md}`, rounded `{rounded.pill-category}` (64px), padding `0px 16px`.

**`button-icon`** — functional icon control
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, 1px hairline `{colors.hairline}`, type `{typography.body-lg}`, rounded `{rounded.sm}`, no padding. Circular avatar is the only use of `{rounded.full}`.

### Inputs & Forms

**`text-input`** — default form field
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px hairline `{colors.hairline}`, type `{typography.body-md}`, rounded `{rounded.sm}`, padding `{spacing.xs} {spacing.sm}`.

### Cards & Containers

**`feature-card`** — flat hairline content card
- Background `{colors.canvas-elevated}`, 1px hairline `{colors.hairline}`, ink text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}`, padding `{spacing.lg}`. The workhorse grid tile, often holding a node-graph or code illustration.

**`feature-card-elevated`** — lifted card variant
- Same chrome as `feature-card` with the Level-2 floating shadow for menus / featured tiles.

**`pricing-card`** — pricing tier card
- Background `{colors.canvas-elevated}`, 1px hairline `{colors.hairline}`, ink text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.lg}`, padding `{spacing.xl}`.

**`code-block`** — code / terminal surface
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px hairline `{colors.hairline}`, Mona Sans code `{typography.code}`, rounded `{rounded.md}`, padding `{spacing.md}`. Syntax rendered in the ink-and-accent palette.

### Bands

**`logo-strip`** — customer logo band
- Background `{colors.canvas}`, mute text `{colors.mute}`, type `{typography.body-md}`, padding `{spacing.xl} {spacing.lg}`. A greyscale row of customer wordmarks.

**`hero-band`** — full-width hero section
- Background `{colors.canvas}` with the mesh gradient, ink text `{colors.ink}`, display type `{typography.display-xl}`, padding `{spacing.section} {spacing.lg}`.

**`cta-band`** — end-of-page call-to-action band ("Start Deploying")
- Background `{colors.canvas}`, ink text `{colors.ink}`, display type `{typography.display-xl}`, padding `{spacing.4xl} {spacing.lg}`, with a `{components.button-primary}` pill.

### Footer

**`footer`** — site footer
- Background `{colors.canvas}`, top hairline `{colors.hairline}`, body-grey text `{colors.body}`, type `{typography.body-md}`, padding `{spacing.3xl} {spacing.lg}`. Multi-column link groups under the wordmark.

## Do's and Don'ts

### Do
- Keep the canvas near-white (`{colors.canvas}`) and let near-black ink (`{colors.ink}`) carry headings, CTAs, and borders.
- In marketing, confine color to the hero mesh gradient and small illustration accents; in the workspace, use the active theme palette and reserve its primary for actions and selected states.
- Use the two button shapes by context: black pill (`{components.button-primary}`) for marketing CTAs, 6px square (`{components.button-primary-sm}`) for nav/app.
- Define cards and inputs with a 1px hairline (`{colors.hairline}`) before any shadow — flat is the default.
- Use Mona Sans for all typography. Set display headings at weight 600 with tight negative tracking; keep section labels uppercase.
- Step the grey text ladder deliberately: `{colors.ink}` → `{colors.body}` → `{colors.mute}` → `{colors.faint}`.

### Don't
- Don't fill large surfaces with the accent colors — violet/cyan/pink/blue live in the gradient and illustrations, not as chrome.
- Don't mix the button shapes within one context — marketing CTAs stay pills, app/nav controls stay 6px squares.
- Don't pile on shadows — depth is a 1px hairline plus, at most, a finely-layered low-alpha shadow stack.
- Don't set marketing body copy in pure black (`#000000`) — the brand's ink is #171717 and body steps to `{colors.body}`. Workspace text uses the active theme's foreground tokens.
- Don't add a second decorative system — the mesh gradient is the only flourish; everything else is ink on white.
- Don't loosen the display tracking — large Mona Sans headings carry tight negative letter-spacing by design.
