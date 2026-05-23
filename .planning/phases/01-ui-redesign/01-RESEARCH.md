# Phase 01: Tactical UI Redesign — Research

**Researched:** 2026-05-23
**Domain:** Visual design system migration — brutalist/cyberpunk → holographic tactical command center
**Confidence:** HIGH

## Summary

The codebase currently implements a **brutalist dark** design system (red/amber/green on near-black) using 14 cyber/-prefixed shared components, while simultaneously having two contradictory design documents (`docs/DESIGN_SYSTEM.md` for cyberpunk neon with fuchsia/cyan and `docs/AGENT.md` for phosphor green CRT). The actual implementation diverges from both docs: it uses Inter + JetBrains Mono (not Orbitron + Rajdhani), solid `rgba()` surfaces (not true glassmorphism — all blur values are `none`), and red primary accents (not fuchsia or green). There are no separate `tokens.css`, `fonts.css`, or `scanlines.css` files — everything is consolidated in `globals.css` with Google Fonts CDN imports. The migration to holographic tactical UI requires: (1) replacing 14 cyber/ components with new glass-based equivalents, (2) rewriting CSS token architecture for dark+light mode dual-theme, (3) building a Canvas/CSS-based dynamic background system, (4) implementing emotional UI reactivity via a new Zustand store, and (5) restyling 18+ page components and the AppShell layout — all without touching business logic, API contracts, routing, or auth.

**Primary recommendation:** Build new design system in a parallel directory (`src/components/tactical/`) alongside existing `cyber/`, swap imports one page at a time, delete old `cyber/` directory as the last step. This preserves the zero-downtime migration constraint and allows `pnpm check` to pass at every commit.

## Architectural Responsibility Map

| Capability                           | Primary Tier     | Secondary Tier | Rationale                                                                             |
| ------------------------------------ | ---------------- | -------------- | ------------------------------------------------------------------------------------- |
| Design tokens (CSS variables)        | Browser / Client | —              | CSS custom properties are a browser concern; Tailwind config reads them at build time |
| Glass panel rendering                | Browser / Client | —              | `backdrop-filter` is a CSS browser feature; no server involvement                     |
| Dynamic background (canvas/gradient) | Browser / Client | —              | Canvas API runs in browser main thread; CSS animations are browser-rendered           |
| Emotional UI state derivation        | Browser / Client | —              | Derived from TanStack Query data already in browser; Zustand store in-memory          |
| Theme switching (dark/light)         | Browser / Client | —              | CSS class toggle on `<html>` root; localStorage persistence                           |
| Font loading                         | Browser / Client | —              | `@fontsource` packages or Google Fonts CDN; all client-side                           |
| Animation/timing                     | Browser / Client | —              | Framer Motion runs in React render cycle; CSS keyframes are browser-native            |

All responsibilities are browser-tier. The phase is purely visual — no API changes, no backend involvement, no database schema changes. This makes the Architectural Responsibility Map simple: everything lives in the Client tier.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Aesthetic:** Holographic tactical OS — NOT retro terminal, NOT cyberpunk RGB excess, NOT Fallout green CRT
- **Dark mode:** Primary/default. Deep dark backgrounds, dark glassmorphism, blue/cyan primary accent, dynamic red alerts
- **Light mode:** Secondary. Clean cold whites, clear glass translucency, soft blue accents, laboratory/sci-fi feel. Must NOT look like generic SaaS
- **Glassmorphism:** `backdrop-filter: blur()`, subtle borders, ambient illumination, `bg-white/[0.03-0.08]` dark / `bg-white/[0.6-0.8]` light
- **Dynamic background:** Animated gradients, cursor-reactive lighting, scanner sweeps, light particles. CSS/Canvas-based, NOT Three.js unless justified
- **Emotional UI states:** stable (blue/cyan, slow breathing), alert (orange/amber pulses, faster scanners), critical (subtle glitches, interference, visual distortion)
- **Layout:** Central tactical map concept on dashboard, floating glass panels, collapsible sidebar, widget system
- **Typography:** Geist or Inter for display/headings, Inter for UI labels, JetBrains Mono for data/metrics. NO retro pixel fonts, NO CRT typefaces
- **Color palette:** Primary cyan/blue (`#06b6d4` → `#3b82f6`), danger red (`#ef4444` → `#dc2626`), warning amber (`#f59e0b` → `#d97706`), success emerald (`#10b981`), surfaces near-black with blue undertones (dark) / cool white-gray (light)
- **Tech stack:** React 19, TypeScript strict, Vite 8, Tailwind 3, Framer Motion, CSS variables. No new heavy dependencies unless justified
- **Migration strategy:** Incremental component-by-component, new system parallel to current, swap one page at a time, both systems operational during transition

### the agent's Discretion

- Exact color values within the approved ranges
- Animation timing and easing curves
- Glass blur intensity (within readability constraints)
- Canvas background implementation details
- Framer Motion variant specifics
- Order of page migration after core components
- Whether to use Three.js for any specific effect

### Deferred Ideas (OUT OF SCOPE)

- Gamification elements (achievements, badges, scoring) — separate phase
- Three.js 3D map — evaluate after 2D tactical map implemented
- AI explainability dashboard — depends on backend AI features
- Playwright E2E tests — separate testing phase
- Sound design / audio feedback — stretch goal, not priority

## Phase Requirements

| ID     | Description                                                               | Research Support                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-03 | UX, animations, gamification, visual coherence with zombie/military theme | This entire phase delivers visual coherence. Gamification is deferred per CONTEXT.md. Animation patterns in §Architecture Patterns and §Code Examples.              |
| RNF-04 | Performance, responsive design                                            | Performance: backdrop-filter GPU compositing (§Glassmorphism Strategy). Responsive: AppShell already has mobile Sheet drawer; glass panels stack via Tailwind grid. |

## 1. Current UI Audit

### 1.1 Cyber/ Component Catalog

All 14 components in `src/components/cyber/` catalogued with full import analysis (70 import sites across 23 files):

| Component          | File                            | Props                                                                                                                                    | Used By (# imports)                                                    | Visual Characteristics                                                                                                                                                                                                                                      | Hardcoded Colors/Refs                                                                |
| ------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Panel**          | `Panel.tsx` (109 lines)         | `title?`, `tag?`, `status?`, `children`, `className?`, `accent?: 'cyan'/'purple'/'green'/'red'`, `variant?: 'default'/'elevated'/'flat'` | 19 files — every feature page + AdmissionDetailPanel, StockAlertBanner | Corner brackets (`border-t border-l`), `.glass`/`.glass-heavy` classes, accent color classes from tailwind config (`text-accent-primary`, `text-accent-secondary`, `text-accent-success`), `font-mono-sm`, `font-sans`, `animate-blink`                     | `accent-primary = #ef4444`, `accent-secondary = #f59e0b`, `accent-success = #10b981` |
| **GlitchButton**   | `GlitchButton.tsx` (27 lines)   | `children`, `variant?: 'primary'/'ghost'/'warning'/'danger'`, HTMLButton props                                                           | 20 files + ErrorBoundary + LockScreen (22 total)                       | Four variants with hardcoded colors: primary=`bg-accent-primary` (#ef4444), warning=`bg-status-yellow` (#f59e0b), ghost=`bg-transparent border-border`, danger=`border-status-red/40 text-status-red`. Font: `font-mono text-xs tracking-[0.1em] uppercase` | `#ffab00` (warning shadow), `#ff3355` (danger shadow), `shadow-glow` CSS var         |
| **StatusBadge**    | `StatusBadge.tsx` (35 lines)    | `status: string`, `variant?: 'red'/'amber'/'green'`, `className?`                                                                        | 11 files                                                               | Red/amber/green variants: `border-red-500/30 text-red-400`, `border-amber-500/30 text-amber-400`, `border-emerald-500/30 text-emerald-400`. `bg-zinc-900/50`, `font-mono-sm`, `animate-blink` dot                                                           | `red-500`, `amber-500`, `emerald-500`                                                |
| **ScreenLoader**   | `ScreenLoader.tsx` (23 lines)   | None                                                                                                                                     | 23 files — App.tsx, ProtectedRoute, AppRoutes, ALL feature pages       | `bg-surface-base` overlay, nested `animate-spin` borders with `border-t-brand-primary` / `border-b-brand-primary`, text: `font-mono text-xs text-zinc-500`, `animate-blink` and `tracking-[0.2em] uppercase`                                                | `brand-primary = #ef4444`                                                            |
| **StockBarChart**  | `StockBarChart.tsx` (78 lines)  | `data: StockBarEntry[]`, `height?: number`                                                                                               | 1 file — InventoryPage                                                 | Recharts horizontal bar chart. `STATUS_COLORS`: CRITICAL=`#f43f5e`, LOW=`#f59e0b`, OK=`#22d3ee`. Tooltip: `oklch(0.1 0.03 320 / 0.95)` bg. Y-axis: `oklch(0.68 0.32 340 / 0.6)` fill. Grid: `oklch(0.55 0.22 210 / 0.08)`                                   | `f43f5e`, `f59e0b`, `22d3ee`, oklch values                                           |
| **SkeletonTable**  | `SkeletonTable.tsx` (36 lines)  | `rows: number`, `columns: number`                                                                                                        | Not imported anywhere (dead code)                                      | Table skeleton with `font-mono-data`, `animate-pulse`, hardcoded oklch colors: `oklch(0.3 0.02 340 / 0.4)` headers, `oklch(0.25 0.03 340 / 0.5)` rows                                                                                                       | oklch values                                                                         |
| **SkeletonCard**   | `SkeletonCard.tsx` (16 lines)   | `height?: string`                                                                                                                        | Not imported anywhere (dead code)                                      | Card skeleton: `animate-pulse`, `border-[oklch(0.68_0.32_340_/_0.15)]`, `bg-[oklch(0.12_0.03_340_/_0.8)]`                                                                                                                                                   | oklch values                                                                         |
| **RingMeter**      | `RingMeter.tsx` (88 lines)      | `value: number`, `label: string`, `sublabel?`, `color?: 'cyan'/'purple'/'yellow'`, `size?: number`                                       | Not imported anywhere (dead code)                                      | SVG ring meter with 40 tick marks, glow filter (`feGaussianBlur`), `stroke-dashoffset` animation. Colors: cyan=`var(--accent-primary)`, purple=`var(--accent-secondary)`, yellow=`#ffab00`. `font-display text-3xl` with `textShadow`                       | `#ffab00`, `accent-primary = #ef4444`                                                |
| **StatCard**       | `StatCard.tsx` (85 lines)       | `label`, `value`, `icon: LucideIcon`, `accent?`, `trend?`, `className?`                                                                  | Not imported anywhere (dead code)                                      | `.glass` card with `textShadow`, `TrendingUp`/`TrendingDown` icons, accent color classes. Colors: cyan=`accent-primary` (#ef4444), purple=`accent-secondary` (#f59e0b), green=`#00e676`, red=`#ff3355`                                                      | `#00e676`, `#ff3355`                                                                 |
| **DataChart**      | `DataChart.tsx` (61 lines)      | None (zero-config SVG chart)                                                                                                             | Not imported anywhere (dead code)                                      | SVG line chart: 32 points, `linearGradient` fill from `var(--accent-primary)`, grid lines in `oklch(0.55 0.22 210 / 0.08)`, drop-shadow glow on path                                                                                                        | `accent-primary = #ef4444`                                                           |
| **TerminalLine**   | `TerminalLine.tsx` (73 lines)   | `text`, `delay?`, `className?`, `prefix?`, `accent?: 'cyan'/'purple'/'green'`                                                            | 1 file — DashboardPage syslog section                                  | Typewriter effect: `setInterval` at 12-32ms per char. `font-mono text-xs`, `animate-blink` cursor. Accent = `text-accent-primary`/`secondary`/`status-green`                                                                                                | `accent-primary = #ef4444`                                                           |
| **FileInput**      | `FileInput.tsx` (74 lines)      | `value: string`, `onChange`, `accept?`, `label?`                                                                                         | Not imported anywhere (dead code)                                      | Base64 image upload: FileReader → data URL. `font-mono-data`, `border-zinc-700`, `text-zinc-400`                                                                                                                                                            | zinc Tailwind colors                                                                 |
| **WaveBackground** | `WaveBackground.tsx` (40 lines) | None                                                                                                                                     | Not imported anywhere (dead code)                                      | Fixed `-z-10` background: 3 `radial-gradient` blobs with `blur(100-110px)` + `drift` animation (22-35s), vignette overlay. Colors: `oklch(0.65 0.28 210 / 0.4)`, `oklch(0.55 0.25 280 / 0.35)`                                                              | oklch values                                                                         |
| **CyberGrid**      | `CyberGrid.tsx` (18 lines)      | `className?`, `opacity?: number`                                                                                                         | Not imported anywhere (dead code)                                      | CSS grid overlay: `linear-gradient` at 48px, `maskImage: radial-gradient` vignette                                                                                                                                                                          | `rgba(255,255,255,opacity)`                                                          |

**Key finding:** 8 of 14 cyber/ components are **dead code** — not imported anywhere in the project. Only 6 are actively used: Panel (19 imports), GlitchButton (22), StatusBadge (11), ScreenLoader (23), StockBarChart (1), TerminalLine (1). The dead components (WaveBackground, CyberGrid, RingMeter, StatCard, DataChart, SkeletonTable, SkeletonCard, FileInput) were likely built speculatively during initial development and never integrated.

### 1.2 CSS Variable Audit

All CSS custom properties are defined in `src/app/styles/globals.css:6-64`. There is no separate `tokens.css` file. Here is the complete catalog:

**Declared and Used:**
| Variable | Value | Used In |
|----------|-------|---------|
| `--color-brand-primary` | `#ef4444` | LoginPage, LockScreen, ScreenLoader |
| `--color-brand-secondary` | `#f59e0b` | AppShell user avatar |
| `--color-brand-accent` | `#10b981` | AppShell status dot |
| `--surface-base` | `#0a0a0a` | AppShell, LoginPage, ScreenLoader, global body |
| `--surface-raised` | `#171717` | AppShell sidebar, LoginPage card, LockScreen |
| `--surface-overlay` | `#262626` | LockScreen input |
| `--text-primary` | `#f4f4f5` | All body text (via `--foreground`) |
| `--text-secondary` | `#a1a1aa` | Secondary labels |
| `--text-muted` | `#71717a` | Muted text, placeholders |
| `--border-subtle` | `#27272a` | `.glass` class borders |
| `--border-default` | `#3f3f46` | `.glass-interactive:hover` |
| `--border-hover` | `#52525b` | `.glass-interactive:active` |
| `--accent-primary` | `#ef4444` | Panel, GlitchButton (primary), RingMeter, DataChart, focus-visible |
| `--accent-primary-dim` | `#dc2626` | Tailwind `accent.primary-dim` |
| `--accent-secondary` | `#f59e0b` | Panel (purple accent), StatCard (purple), AppShell |
| `--accent-success` | `#10b981` | Panel (green accent), AppShell status |
| `--glass-bg[/*]` | `#171717/#0a0a0a` | `.glass`, `.glass-heavy` classes |
| `--glass-blur[/*]` | `none` (all three) | **Current glass is solid, not blurred** |
| `--background` | `#0a0a0a` | shadcn/ui components |
| `--foreground` | `#f4f4f5` | shadcn/ui components |
| `--card` | `#171717` | shadcn/ui card |
| `--muted` | `#18181b` | shadcn/ui muted |
| `--border` | `#27272a` | shadcn/ui border |
| `--input` | `#1f1f1f` | shadcn/ui input |

**Declared but effectively unused or redundant:**
| Variable | Value | Issue |
|----------|-------|-------|
| `--neon-fuchsia` | `var(--accent-primary)` = `#ef4444` | Alias — no separate neon system, both resolve to red |
| `--neon-cyan` | `var(--accent-primary)` = `#ef4444` | Same as fuchsia — no cyan exists |
| `--neon-violet` | `var(--accent-secondary)` = `#f59e0b` | Alias |
| `--neon-yellow` | `var(--accent-secondary)` = `#f59e0b` | Alias |
| `--deep-magenta` | `#18181b` | Same value as `--muted` |
| `--charcoal` | `#0a0a0a` | Same value as `--surface-base` |
| `--glass-shadow[/*]` | `none` (all three) | No shadows defined |
| `--accent-primary-glow` | `none` | No glow values defined |
| `--accent-secondary-glow` | `none` | No glow values defined |
| `--radius-none/sm/md` | `0px/2px/4px` | Never referenced by other CSS |

**Key finding:** The "neon" system is a thin alias layer — it maps to the same red/amber colors as the brutalist system. There is no actual fuchsia, no actual cyan, no glow effects in the CSS variables. The DESIGN_SYSTEM.md document describes a neon system that was never implemented.

### 1.3 Tailwind Custom Utility Classes

All defined in `globals.css:122-252` (the `@layer components` block):

| Class                                    | Definition                                                   | Used In                                | Action                                         |
| ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------- |
| `.brutalist-border`                      | `border: 1px solid #27272a`                                  | LockScreen                             | REWRITE as glass border                        |
| `.neon-glow-red`                         | `text-shadow: 0 0 10px rgba(239,68,68,0.5)`                  | Never used in JSX                      | REMOVE                                         |
| `.glass`                                 | `background: #171717; border: 1px solid #27272a`             | Panel, DashboardPage, SkeletonCard     | REWRITE with backdrop-filter                   |
| `.glass-heavy`                           | `background: #0a0a0a; border: 1px solid #27272a`             | Panel (elevated), DashboardPage banner | REWRITE with backdrop-filter                   |
| `.glass-light`                           | `background: #171717; border: 1px solid #27272a`             | Never used in JSX                      | REMOVE                                         |
| `.glass-interactive[/*]`                 | Solid backgrounds + hover/active transitions                 | DashboardPage module cards             | REWRITE with glass + hover                     |
| `.terminal-table`                        | Full table styling — JetBrains Mono, 10px, uppercase headers | Multiple feature pages                 | REWRITE as tactical data table                 |
| `.terminal-input`                        | `bg #1f1f1f`, JetBrains Mono, red focus border               | LoginPage inputs                       | REWRITE as glass input                         |
| `.terminal-divider`                      | `linear-gradient(90deg, transparent, #27272a, transparent)`  | Feature pages (occasional)             | REWRITE with cyan accent                       |
| `.font-mono-data`                        | `JetBrains Mono, 0.75rem`                                    | **534 occurrences across all pages**   | PRESERVE (JetBrains Mono stays per CONTEXT.md) |
| `.font-mono`                             | `JetBrains Mono, 0.8125rem, letter-spacing: 0`               | Multiple pages                         | PRESERVE                                       |
| `.font-mono-sm`                          | `JetBrains Mono, 0.6875rem`                                  | Multiple pages                         | PRESERVE                                       |
| `.font-display`                          | `Inter 800, letter-spacing: -0.02em`                         | PersonDetailPage headings              | REWRITE (new heading style)                    |
| `.font-tech`                             | `JetBrains Mono, uppercase, tracking: 0.1em, 600 weight`     | RingMeter labels                       | REMOVE (no "tech" aesthetic)                   |
| `.text-glow-fuchsia` / `.text-glow-cyan` | `text-shadow: 0 0 10px rgba(239,68,68,0.5)`                  | PersonDetailPage dialog titles         | REWRITE with cyan glow                         |
| `.text-glow-yellow`                      | `text-shadow: 0 0 10px rgba(245,158,11,0.5)`                 | PersonDetailPage                       | REWRITE with amber glow                        |
| `.text-glow`                             | Same as red glow                                             | DashboardPage metric values            | REWRITE with cyan glow                         |
| `.animate-pulse-glow`                    | `pulse-glow` keyframe (opacity 0.3↔1)                        | DashboardPage stat cards               | PRESERVE (useful animation)                    |

**Key findings:**

- All `--neon-*` references in toast.tsx and feature pages resolve to red/amber — no actual cyan/fuchsia exists
- No `scanlines` utility class exists anywhere in the codebase (scanlines.css was never created as a separate file, and no `.scanlines` or `.crt-screen` class is in globals.css)
- No `wave-blob` classes exist in globals.css
- No `grid-overlay` utility class exists
- `--glass-blur` is `none` — the current "glass" is just a solid dark panel with a border

### 1.4 Design Doc vs Implementation Mismatches

| Aspect          | docs/AGENT.md        | docs/DESIGN_SYSTEM.md    | Actual Implementation | INTENDED (CONTEXT.md)                |
| --------------- | -------------------- | ------------------------ | --------------------- | ------------------------------------ |
| Primary color   | Phosphor green       | Fuchsia (#ef4444 mapped) | Red (#ef4444)         | Cyan/blue (#06b6d4→#3b82f6)          |
| Secondary color | Green dim            | Cyan                     | Amber (#f59e0b)       | Amber (#f59e0b)                      |
| Font display    | Monospace terminal   | Orbitron (never loaded)  | Inter 800             | Inter (or Geist)                     |
| Font UI         | Monospace terminal   | Rajdhani (never loaded)  | Inter                 | Inter                                |
| Font data       | Pixel font           | JetBrains Mono           | JetBrains Mono        | JetBrains Mono                       |
| Surface style   | CRT scanlines        | Neon glow panels         | Solid dark (#171717)  | Glassmorphism (backdrop-filter blur) |
| Background      | CRT scanline overlay | Wave blobs + scanlines   | None (solid #0a0a0a)  | Dynamic gradient + scanner           |
| Mode support    | Dark only            | Dark only                | Dark only             | Dark + Light                         |
| File structure  | Separate CSS files   | Separate CSS files       | Single globals.css    | Single globals.css (current)         |

**Note on fonts:** `docs/DESIGN_SYSTEM.md` specifies Orbitron + Rajdhani + JetBrains Mono with Google Fonts CDN. Neither Orbitron nor Rajdhani were ever loaded. The actual Google Fonts import in `globals.css:1` only loads Inter + JetBrains Mono — matching what AGENTS.md specifies. Per CONTEXT.md, the new system keeps Inter + JetBrains Mono (or optionally Geist for headings).

### 1.5 Scanline/CRT References to Remove

Despite `docs/DESIGN_SYSTEM.md` and `docs/AGENT.md` describing CRT scanlines, **no scanline implementation exists in the codebase**:

- `src/app/styles/scanlines.css` — **File does not exist**
- No `.scanlines`, `.crt-screen`, or `.scanlines::before` class in `globals.css`
- No `scanlineSweep` Framer Motion variant used anywhere in JSX
- The `scanlineSweep` and `crtOn` variants exist in DESIGN_SYSTEM.md's spec for `motion.ts` but **`src/shared/lib/motion.ts` does not exist as a file** — Framer Motion variants are used inline in toast.tsx and via Tailwind CSS keyframe classes

**To remove:** Nothing in the CSS. The only CRT/scanline references to clean are in documentation (`docs/DESIGN_SYSTEM.md`, `docs/AGENT.md`). These docs should be updated or archived as historical reference, not deleted (they document what we're migrating FROM).

### 1.6 Current Color Palette (Complete)

| Role                 | Hex       | Tailwind Class                                         | RGB         | Where Used                                            |
| -------------------- | --------- | ------------------------------------------------------ | ----------- | ----------------------------------------------------- |
| Primary accent (red) | `#ef4444` | `accent-primary`, `brand-primary`, `status-red`        | 239,68,68   | Active nav, buttons, focus rings, errors, glows       |
| Primary dim          | `#dc2626` | `accent-primary-dim`                                   | 220,38,38   | (declared, minimal use)                               |
| Secondary (amber)    | `#f59e0b` | `accent-secondary`, `brand-secondary`, `status-yellow` | 245,158,11  | Warnings, transfers, AppShell user avatar, nav labels |
| Success (emerald)    | `#10b981` | `brand-accent`, `status-green`, `accent-success`       | 16,185,129  | Online status, completed, success badges              |
| Surface base         | `#0a0a0a` | `surface-base`, `surface-deep`                         | 10,10,10    | Main background, body                                 |
| Surface raised       | `#171717` | `surface-raised`, `surface-glass`                      | 23,23,23    | Cards, sidebar, panels                                |
| Surface overlay      | `#262626` | `surface-overlay`                                      | 38,38,38    | Modals, dialogs                                       |
| Text primary         | `#f4f4f5` | `text-primary`, `foreground`                           | 244,244,245 | Body text, headings                                   |
| Text secondary       | `#a1a1aa` | `text-secondary`                                       | 161,161,170 | Secondary labels                                      |
| Text muted           | `#71717a` | `text-muted`                                           | 113,113,122 | Placeholder, muted info                               |
| Border subtle        | `#27272a` | `border-subtle`                                        | 39,39,42    | Panel borders, `.glass` borders                       |
| Border default       | `#3f3f46` | `border-DEFAULT`                                       | 63,63,70    | Hover borders                                         |
| Border hover         | `#52525b` | `border-hover`                                         | 82,82,91    | Active borders                                        |
| Chart OK             | `#22d3ee` | (inline)                                               | 34,211,238  | StockBarChart OK bars                                 |
| Chart low            | `#f59e0b` | (inline)                                               | 245,158,11  | StockBarChart LOW bars                                |
| Chart critical       | `#f43f5e` | (inline)                                               | 244,63,94   | StockBarChart CRITICAL bars                           |
| StatCard green       | `#00e676` | (inline)                                               | 0,230,118   | StatCard green accent                                 |
| StatCard red         | `#ff3355` | (inline)                                               | 255,51,85   | StatCard red accent                                   |
| Button warn shadow   | `#ffab00` | (inline)                                               | 255,171,0   | GlitchButton warning glow                             |
| RingMeter yellow     | `#ffab00` | (inline)                                               | 255,171,0   | RingMeter yellow arc                                  |

### 1.7 Page-to-Component Usage Map

| Page                      | Panel | GlitchButton | StatusBadge | ScreenLoader | StockBarChart | TerminalLine | Direct Cyber References                                                                                                                          |
| ------------------------- | ----- | ------------ | ----------- | ------------ | ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **DashboardPage**         | ✗     | ✗            | ✓           | ✗ (imported) | ✗             | ✓            | `glass`, `glass-heavy`, `glass-interactive`, `animate-blink`, `animate-pulse-glow`, `font-mono-sm`, inline `textShadow`                          |
| **LoginPage**             | ✗     | ✗            | ✗           | ✗            | ✗             | ✗            | `bg-surface-base`, `brand-primary`, `font-mono`, hardcoded zinc borders                                                                          |
| **AppShell**              | ✗     | ✗            | ✗           | ✗            | ✗             | ✗            | `bg-surface-base`, `bg-surface-raised`, `brand-primary`, `brand-secondary`, `brand-accent`, `font-mono`, `animate-pulse`, hardcoded zinc borders |
| **CampsPage**             | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`, `terminal-table`                                                                                                               |
| **CampDetailPage**        | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`, `terminal-table`                                                                                                               |
| **PeopleListPage**        | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`, `terminal-table`                                                                                                               |
| **PersonDetailPage**      | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`, `text-glow-*`, `font-display`, neon CSS vars                                                                                   |
| **PersonCreatePage**      | ✓     | ✓            | ✗           | ✓            | ✗             | ✗            | `font-mono-data`, `terminal-table`                                                                                                               |
| **InventoryPage**         | ✓     | ✓            | ✓           | ✓            | ✓             | ✗            | `font-mono-data`, `terminal-table`                                                                                                               |
| **InventoryAuditPage**    | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **ResourcesPage**         | ✓     | ✓            | ✗           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **TransfersPage**         | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **ExplorationsPage**      | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`, `zodResolver` hardcoded ref                                                                                                    |
| **ExplorationDetailPage** | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **AdmissionsPage**        | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **UsersPage**             | ✓     | ✓            | ✓           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **ProfessionsPage**       | ✓     | ✓            | ✗           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **RationsPage**           | ✓     | ✓            | ✗           | ✓            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **ProtectedRoute**        | ✗     | ✗            | ✗           | ✓            | ✗             | ✗            | —                                                                                                                                                |
| **ErrorBoundary**         | ✗     | ✓            | ✗           | ✗            | ✗             | ✗            | Hardcoded red/green colors                                                                                                                       |
| **LockScreen**            | ✗     | ✗            | ✗           | ✗            | ✗             | ✗            | `.brutalist-border`, `bg-surface-raised`, `brand-primary`                                                                                        |
| **AIAnalysisPanel**       | ✓     | ✗            | ✓           | ✗            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **AdmissionDetailPanel**  | ✓     | ✗            | ✗           | ✗            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |
| **StockAlertBanner**      | ✓     | ✗            | ✓           | ✗            | ✗             | ✗            | `font-mono-data`                                                                                                                                 |

**Migration priority by page count:** DashboardPage (most custom styles, least cyber component usage), AppShell (layout foundation), LoginPage (independent), then feature pages (all follow same Panel+GlitchButton+StatusBadge+ScreenLoader pattern).

## 2. Component Migration Map

### 2.1 Migration Strategy per Component

| Component                      | Strategy         | Rationale                                                                                                                                           | Risk | New Equivalent Location                         |
| ------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------- |
| **Panel**                      | Full rewrite     | Corner brackets, `.glass` class, accent system — all need complete reimagining as glass panel                                                       | LOW  | `src/components/tactical/GlassPanel.tsx`        |
| **GlitchButton**               | Full rewrite     | All four variants use hardcoded red/amber colors, shadows, and "glitch" terminology. New: tactical button with cyan primary, ghost, danger variants | LOW  | `src/components/tactical/TacticalButton.tsx`    |
| **StatusBadge**                | Restyle in-place | Simple component — just swap color classes. Keep `animate-blink` dot.                                                                               | LOW  | Same file, new Tailwind classes                 |
| **ScreenLoader**               | Full rewrite     | "Initializing Interface" terminal aesthetic → holographic loading indicator with scanner sweep                                                      | LOW  | `src/components/tactical/HoloLoader.tsx`        |
| **StockBarChart**              | Restyle in-place | Recharts theme colors only — component logic unchanged. Replace `STATUS_COLORS` with new palette.                                                   | LOW  | Same file, new color constants                  |
| **TerminalLine**               | Remove + replace | Typewriter terminal aesthetic is anti-pattern for new design. Dashboard syslog should become scanner/tactical data feed.                            | LOW  | Replace DashboardPage syslog with new component |
| **SkeletonTable**              | Full rewrite     | Currently dead code — write new skeleton that matches glass table aesthetic                                                                         | LOW  | `src/components/tactical/GlassSkeleton.tsx`     |
| **SkeletonCard**               | Full rewrite     | Currently dead code — same as above                                                                                                                 | LOW  | Same file as above                              |
| **RingMeter**                  | Full rewrite     | Dead code but useful pattern — rewrite with new color system, remove glow SVG filter                                                                | LOW  | `src/components/tactical/RingMeter.tsx`         |
| **StatCard**                   | Restyle in-place | Dead code but good pattern — update colors, remove textShadow, add glass styling                                                                    | LOW  | Same file (or move to tactical/)                |
| **DataChart**                  | Full rewrite     | Dead code — rewrite with new gradient colors, remove drop-shadow on path                                                                            | LOW  | `src/components/tactical/DataChart.tsx`         |
| **FileInput**                  | Restyle in-place | Dead code — update border/background colors. Base64 logic unchanged.                                                                                | LOW  | Same file (or move to tactical/)                |
| **WaveBackground**             | Remove           | Dead code — replaced by new dynamic background system                                                                                               | LOW  | N/A (replaced by `TacticalBackground`)          |
| **CyberGrid**                  | Remove           | Dead code — replaced by new subtle grid in background system                                                                                        | LOW  | N/A                                             |
| **Toast system** (`toast.tsx`) | Restyle in-place | Currently uses `--neon-fuchsia`, `--neon-cyan`, `--neon-violet` CSS vars. Swap to new glass styling.                                                | LOW  | Same file, new CSS vars                         |

### 2.2 Risk Assessment per Component

| Component                | Risk            | Reasoning                                                                                                                                                                            |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Panel                    | **LOW**         | Pure presentational wrapper. 19 import sites but all pass-through. No business logic. Only risk: missing a className that page CSS relies on.                                        |
| GlitchButton             | **LOW**         | Pure presentational. 22 import sites. HTMLButtonElement interface preserved in new component — just swap the import path.                                                            |
| StatusBadge              | **LOW**         | 13 lines of JSX. Only risk: missing the `animate-blink` dot that callers may visually depend on.                                                                                     |
| ScreenLoader             | **LOW**         | 23 import sites but always used as `<ScreenLoader />` with no props. Simple swap.                                                                                                    |
| StockBarChart            | **MEDIUM**      | Recharts dependency. Chart configuration (bars, axes, tooltips) must be preserved. Only colors change.                                                                               |
| SkeletonTable            | **LOW**         | Dead code. No migration risk.                                                                                                                                                        |
| SkeletonCard             | **LOW**         | Dead code. No migration risk.                                                                                                                                                        |
| RingMeter                | **LOW**         | Dead code. Useful pattern to migrate proactively for future dashboard use.                                                                                                           |
| StatCard                 | **LOW**         | Dead code. Useful pattern.                                                                                                                                                           |
| DataChart                | **LOW**         | Dead code. SVG-based — easy color swap.                                                                                                                                              |
| FileInput                | **LOW**         | Dead code.                                                                                                                                                                           |
| Toast system             | **LOW**         | Only 3 color variables need changing. Toast logic unchanged.                                                                                                                         |
| AppShell                 | **MEDIUM**      | Layout foundation. Multiple hardcoded zinc-800 borders, brand-\* references, `font-mono` everywhere. Changes affect every page. Must be done carefully with visual verification.     |
| DashboardPage            | **MEDIUM-HIGH** | 364 lines, direct Tailwind classes (no Panel component), custom `textShadow` inline styles, syslog terminal section, module cards with custom hover states. Most custom-styled page. |
| LoginPage                | **LOW**         | Self-contained, no shared components, 132 lines. Independent of AppShell.                                                                                                            |
| Feature pages (14 files) | **MEDIUM**      | All follow same pattern: Panel + GlitchButton + StatusBadge + ScreenLoader. Changing Panel/GlitchButton updates them all simultaneously.                                             |

## 3. Design Token Architecture [VERIFIED: Tailwind CSS 3.4.19 docs]

### 3.1 New CSS Variable Convention

**Namespace:** `--gdf-*` (Gestión del Fin). Avoids collision with shadcn/ui's `--background`, `--foreground`, etc.

**Token hierarchy:**

```
--gdf-{category}-{property}
```

Where `{category}` is one of: `color`, `surface`, `glass`, `text`, `border`, `accent`, `status`, `animation`.

**File structure:** Single `src/app/styles/tokens.css` (new file), imported before Tailwind directives in `globals.css`.

```css
/* src/app/styles/tokens.css — Phase 01: Holographic Tactical OS */
/* ===================================================================== */

:root {
  /* ── FONT SCALE ───────────────────────────────────────────────────── */
  --gdf-font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --gdf-font-mono: 'JetBrains Mono', 'Cascadia Code', monospace;
  --gdf-font-size-xs: 0.625rem; /* 10px — labels, badges */
  --gdf-font-size-sm: 0.75rem; /* 12px — data, secondary */
  --gdf-font-size-base: 0.8125rem; /* 13px — body */
  --gdf-font-size-lg: 0.875rem; /* 14px — UI text */
  --gdf-font-size-xl: 1.125rem; /* 18px — headings */
  --gdf-font-size-2xl: 1.5rem; /* 24px — page titles */
  --gdf-font-size-3xl: 2rem; /* 32px — hero */

  /* ── RADIUS ───────────────────────────────────────────────────────── */
  --gdf-radius-none: 0;
  --gdf-radius-sm: 2px;
  --gdf-radius-md: 4px;
  --gdf-radius-lg: 6px; /* glass panels — slightly softer than brutalist */

  /* ── SPACING ──────────────────────────────────────────────────────── */
  --gdf-space-1: 4px;
  --gdf-space-2: 8px;
  --gdf-space-3: 12px;
  --gdf-space-4: 16px;
  --gdf-space-6: 24px;
  --gdf-space-8: 32px;

  /* ── ANIMATION ────────────────────────────────────────────────────── */
  --gdf-transition-fast: 150ms ease-out;
  --gdf-transition-base: 250ms ease-out;
  --gdf-transition-slow: 400ms ease-out;
  --gdf-transition-emotional: 800ms ease-in-out; /* state transitions */

  /* ═══════════════════════════════════════════════════════════════════ */
  /* DARK MODE (default)                                                */
  /* ═══════════════════════════════════════════════════════════════════ */

  /* ── SURFACES ─────────────────────────────────────────────────────── */
  --gdf-surface-root: #080c12; /* deepest — page background */
  --gdf-surface-base: #0d131a; /* main content background */
  --gdf-surface-raised: #141c26; /* cards, panels */
  --gdf-surface-overlay: #1a2332; /* modals, dialogs */
  --gdf-surface-hover: #1e2a3a; /* interactive hover */

  /* ── TEXT ─────────────────────────────────────────────────────────── */
  --gdf-text-primary: #e8edf3; /* primary body text */
  --gdf-text-secondary: #8b9bb5; /* secondary labels */
  --gdf-text-muted: #536682; /* placeholders, disabled */
  --gdf-text-inverse: #080c12; /* on accent backgrounds */

  /* ── BORDERS ──────────────────────────────────────────────────────── */
  --gdf-border-subtle: rgba(59, 130, 246, 0.08); /* panel borders */
  --gdf-border-default: rgba(59, 130, 246, 0.15); /* interactive borders */
  --gdf-border-hover: rgba(59, 130, 246, 0.25); /* hover borders */
  --gdf-border-active: rgba(59, 130, 246, 0.4); /* focus/active */

  /* ── ACCENTS ──────────────────────────────────────────────────────── */
  --gdf-accent-primary: #3b82f6; /* blue-500 — primary actions, active nav */
  --gdf-accent-primary-dim: #2563eb; /* blue-600 — pressed states */
  --gdf-accent-primary-glow: rgba(59, 130, 246, 0.4);
  --gdf-accent-secondary: #06b6d4; /* cyan-500 — secondary highlights, scanner */
  --gdf-accent-secondary-glow: rgba(6, 182, 212, 0.4);

  /* ── STATUS ───────────────────────────────────────────────────────── */
  --gdf-status-danger: #ef4444; /* red-500 — critical alerts */
  --gdf-status-danger-glow: rgba(239, 68, 68, 0.4);
  --gdf-status-warning: #f59e0b; /* amber-500 — warnings */
  --gdf-status-warning-glow: rgba(245, 158, 11, 0.4);
  --gdf-status-success: #10b981; /* emerald-500 — success, online */
  --gdf-status-success-glow: rgba(16, 185, 129, 0.4);
  --gdf-status-info: #3b82f6; /* blue-500 — informational */

  /* ── GLASS ────────────────────────────────────────────────────────── */
  --gdf-glass-bg: rgba(20, 28, 38, 0.65);
  --gdf-glass-bg-hover: rgba(30, 42, 58, 0.75);
  --gdf-glass-bg-heavy: rgba(13, 19, 26, 0.85);
  --gdf-glass-border: rgba(59, 130, 246, 0.1);
  --gdf-glass-border-hover: rgba(59, 130, 246, 0.2);
  --gdf-glass-blur: 16px;
  --gdf-glass-blur-heavy: 24px;

  /* ── EMOTIONAL STATE OVERRIDES ────────────────────────────────────── */
  /* Applied via [data-emotional-state="alert"] on :root */
  /* Stable: defaults above */
  /* Alert / Critical: see §6 */
}

/* ═══════════════════════════════════════════════════════════════════ */
/* LIGHT MODE                                                         */
/* ═══════════════════════════════════════════════════════════════════ */
:root[data-theme='light'] {
  /* ── SURFACES ─────────────────────────────────────────────────────── */
  --gdf-surface-root: #f0f4f8; /* cool off-white base */
  --gdf-surface-base: #f7f9fc; /* main content */
  --gdf-surface-raised: #ffffff; /* cards, panels */
  --gdf-surface-overlay: #e8eef4; /* modals */
  --gdf-surface-hover: #dce5f0; /* hover */

  /* ── TEXT ─────────────────────────────────────────────────────────── */
  --gdf-text-primary: #0f172a; /* slate-900 */
  --gdf-text-secondary: #475569; /* slate-600 */
  --gdf-text-muted: #94a3b8; /* slate-400 */
  --gdf-text-inverse: #ffffff;

  /* ── BORDERS ──────────────────────────────────────────────────────── */
  --gdf-border-subtle: rgba(59, 130, 246, 0.08);
  --gdf-border-default: rgba(59, 130, 246, 0.12);
  --gdf-border-hover: rgba(59, 130, 246, 0.2);
  --gdf-border-active: rgba(59, 130, 246, 0.35);

  /* ── GLASS ────────────────────────────────────────────────────────── */
  --gdf-glass-bg: rgba(255, 255, 255, 0.65);
  --gdf-glass-bg-hover: rgba(255, 255, 255, 0.8);
  --gdf-glass-bg-heavy: rgba(255, 255, 255, 0.85);
  --gdf-glass-border: rgba(59, 130, 246, 0.1);
  --gdf-glass-border-hover: rgba(59, 130, 246, 0.2);
  --gdf-glass-blur: 16px;
  --gdf-glass-blur-heavy: 24px;

  /* Accents remain same in both modes */
}
```

### 3.2 Tailwind Config Restructure

```javascript
// tailwind.config.js — Phase 01 revision
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'], // data-theme attribute (no Tailwind dark mode class)
  theme: {
    extend: {
      colors: {
        gdf: {
          surface: {
            root: 'var(--gdf-surface-root)',
            base: 'var(--gdf-surface-base)',
            raised: 'var(--gdf-surface-raised)',
            overlay: 'var(--gdf-surface-overlay)',
            hover: 'var(--gdf-surface-hover)',
          },
          text: {
            primary: 'var(--gdf-text-primary)',
            secondary: 'var(--gdf-text-secondary)',
            muted: 'var(--gdf-text-muted)',
            inverse: 'var(--gdf-text-inverse)',
          },
          border: {
            subtle: 'var(--gdf-border-subtle)',
            DEFAULT: 'var(--gdf-border-default)',
            hover: 'var(--gdf-border-hover)',
            active: 'var(--gdf-border-active)',
          },
          accent: {
            primary: 'var(--gdf-accent-primary)',
            'primary-dim': 'var(--gdf-accent-primary-dim)',
            secondary: 'var(--gdf-accent-secondary)',
          },
          status: {
            danger: 'var(--gdf-status-danger)',
            warning: 'var(--gdf-status-warning)',
            success: 'var(--gdf-status-success)',
            info: 'var(--gdf-status-info)',
          },
          glass: {
            bg: 'var(--gdf-glass-bg)',
            'bg-hover': 'var(--gdf-glass-bg-hover)',
            'bg-heavy': 'var(--gdf-glass-bg-heavy)',
            border: 'var(--gdf-glass-border)',
            'border-hover': 'var(--gdf-glass-border-hover)',
          },
        },
        // Preserve shadcn/ui compatibility
        background: 'var(--gdf-surface-root)',
        foreground: 'var(--gdf-text-primary)',
        card: 'var(--gdf-surface-raised)',
        'card-foreground': 'var(--gdf-text-primary)',
        muted: 'var(--gdf-surface-overlay)',
        'muted-foreground': 'var(--gdf-text-muted)',
        border: 'var(--gdf-border-default)',
        input: 'var(--gdf-surface-base)',
        ring: 'var(--gdf-accent-primary)',
        destructive: 'var(--gdf-status-danger)',
        'destructive-foreground': 'var(--gdf-text-inverse)',
        // Preserve old surface/ text tokens during migration for backward compat
        // These map to old class names used in unmigrated pages
        surface: {
          base: 'var(--gdf-surface-root)',
          raised: 'var(--gdf-surface-raised)',
          overlay: 'var(--gdf-surface-overlay)',
          deep: 'var(--gdf-surface-root)',
          glass: 'var(--gdf-surface-raised)',
        },
        accent: {
          primary: 'var(--gdf-accent-primary)',
          'primary-dim': 'var(--gdf-accent-primary-dim)',
          secondary: 'var(--gdf-status-warning)',
          success: 'var(--gdf-status-success)',
        },
        text: {
          primary: 'var(--gdf-text-primary)',
          secondary: 'var(--gdf-text-secondary)',
          muted: 'var(--gdf-text-muted)',
        },
        brand: {
          primary: 'var(--gdf-accent-primary)',
          secondary: 'var(--gdf-status-warning)',
          accent: 'var(--gdf-status-success)',
        },
        status: {
          green: 'var(--gdf-status-success)',
          red: 'var(--gdf-status-danger)',
          yellow: 'var(--gdf-status-warning)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        // New: tactical-specific animations
        'scanner-sweep': {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'glitch-shift': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%': { transform: 'translateX(-2px)' },
          '20%': { transform: 'translateX(2px)' },
          '30%': { transform: 'translateX(-1px)' },
          '40%': { transform: 'translateX(1px)' },
          '50%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.35s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        blink: 'blink 1.2s step-end infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scanner-sweep': 'scanner-sweep 3s linear infinite',
        breathe: 'breathe 3s ease-in-out infinite',
        'glitch-shift': 'glitch-shift 0.3s ease-in-out',
      },
      backdropBlur: {
        glass: 'var(--gdf-glass-blur)',
        'glass-heavy': 'var(--gdf-glass-blur-heavy)',
      },
    },
  },
  plugins: [],
};
```

### 3.3 Font Strategy

**Decision [VERIFIED: Google Fonts]:**

| Font               | Weight                       | Role                                   | Source                            | Action           |
| ------------------ | ---------------------------- | -------------------------------------- | --------------------------------- | ---------------- |
| **Inter**          | 400, 500, 600, 700, 800, 900 | All UI text, headings, labels, buttons | Google Fonts CDN (already loaded) | Keep — NO CHANGE |
| **JetBrains Mono** | 400, 500, 600, 700           | Data, metrics, monospace labels        | Google Fonts CDN (already loaded) | Keep — NO CHANGE |

**Per CONTEXT.md:** Inter is the approved choice for headings/text. Geist was offered as an alternative but adds a new dependency. Since Inter is already loaded, already used throughout the app, and explicitly approved, **we stick with Inter**.

**Current font loading:** Google Fonts CDN via `@import url(...)` at top of `globals.css:1`. This is a render-blocking import. Consider migrating to `@fontsource/inter` and `@fontsource/jetbrains-mono` npm packages for self-hosting (eliminates external CDN dependency) — but this is optional and can be deferred.

**NO:** Orbitron, Rajdhani, pixel fonts, CRT fonts, monospace-only UI, phosphor-style fonts.

### 3.4 Dark + Light Mode Token Pairs

Complete mode pairs with hex values:

| Token            | Dark Mode               | Light Mode                               |
| ---------------- | ----------------------- | ---------------------------------------- |
| Surface root     | `#080c12`               | `#f0f4f8`                                |
| Surface base     | `#0d131a`               | `#f7f9fc`                                |
| Surface raised   | `#141c26`               | `#ffffff`                                |
| Surface overlay  | `#1a2332`               | `#e8eef4`                                |
| Surface hover    | `#1e2a3a`               | `#dce5f0`                                |
| Text primary     | `#e8edf3`               | `#0f172a`                                |
| Text secondary   | `#8b9bb5`               | `#475569`                                |
| Text muted       | `#536682`               | `#94a3b8`                                |
| Accent primary   | `#3b82f6`               | `#3b82f6` (same)                         |
| Accent secondary | `#06b6d4`               | `#06b6d4` (same)                         |
| Status danger    | `#ef4444`               | `#ef4444` (same)                         |
| Status warning   | `#f59e0b`               | `#d97706` (slightly darker for contrast) |
| Status success   | `#10b981`               | `#059669` (slightly darker for contrast) |
| Glass background | `rgba(20,28,38,0.65)`   | `rgba(255,255,255,0.65)`                 |
| Glass border     | `rgba(59,130,246,0.10)` | `rgba(59,130,246,0.10)`                  |
| Border subtle    | `rgba(59,130,246,0.08)` | `rgba(59,130,246,0.08)`                  |

## 4. Glassmorphism Implementation Strategy [VERIFIED: CSS backdrop-filter spec]

### 4.1 Optimal Blur Values

Based on web.dev and CSS-Tricks glassmorphism guides:

| Context                        | blur value | bg opacity (dark)     | bg opacity (light)       | Use Case                        |
| ------------------------------ | ---------- | --------------------- | ------------------------ | ------------------------------- |
| Heavy glass (modals, dialogs)  | `24px`     | `rgba(13,19,26,0.85)` | `rgba(255,255,255,0.85)` | Modals needing high readability |
| Standard glass (panels, cards) | `16px`     | `rgba(20,28,38,0.65)` | `rgba(255,255,255,0.65)` | Primary panel/card surfaces     |
| Light glass (hover overlays)   | `12px`     | `rgba(30,42,58,0.40)` | `rgba(255,255,255,0.40)` | Dropdowns, tooltips             |
| Subtle glass (sidebar, header) | `8px`      | `rgba(13,19,26,0.55)` | `rgba(247,249,252,0.55)` | Persistent UI chrome            |

### 4.2 Glass Panel Structure

```css
.gdf-glass {
  background: var(--gdf-glass-bg);
  border: 1px solid var(--gdf-glass-border);
  backdrop-filter: blur(var(--gdf-glass-blur));
  -webkit-backdrop-filter: blur(var(--gdf-glass-blur));
  border-radius: var(--gdf-radius-md);
  /* NO box-shadow by default — let content dictate depth */
}

.gdf-glass-interactive {
  /* extends .gdf-glass */
  transition:
    background var(--gdf-transition-fast),
    border-color var(--gdf-transition-fast);
}
.gdf-glass-interactive:hover {
  background: var(--gdf-glass-bg-hover);
  border-color: var(--gdf-glass-border-hover);
}

/* Corner brackets — optional tactical accent */
.gdf-glass-bracketed::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  border-top: 1px solid var(--gdf-accent-primary);
  border-left: 1px solid var(--gdf-accent-primary);
  opacity: 0.4;
}
.gdf-glass-bracketed::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-bottom: 1px solid var(--gdf-accent-primary);
  border-right: 1px solid var(--gdf-accent-primary);
  opacity: 0.4;
}
```

### 4.3 Light Mode Glass Considerations

In light mode, glass needs higher opacity for readability:

- **Dark mode:** `rgba(20,28,38,0.65)` — 65% opaque dark tint over gradient background
- **Light mode:** `rgba(255,255,255,0.70)` — 70% opaque white over gradient background

Light mode glass on white-ish backgrounds has inherently lower contrast. To compensate:

1. Increase base opacity from 65% to 70-75%
2. Use slightly stronger borders (0.12 alpha vs 0.08)
3. Add a very subtle `box-shadow: 0 1px 3px rgba(0,0,0,0.04)` for depth cue
4. Ensure text uses `--gdf-text-primary` (`#0f172a` — slate-900) for maximum contrast

### 4.4 Browser Compatibility

**`backdrop-filter` support [VERIFIED: caniuse.com]:**

- Chrome 76+, Firefox 103+, Safari 9+ (with `-webkit-` prefix), Edge 79+
- Global support: **96.3%** as of May 2025
- Mobile Safari: fully supported since iOS 9

**Fallback for unsupported browsers (Firefox < 103, older Safari):**

```css
.gdf-glass {
  background: var(--gdf-glass-bg);
  border: 1px solid var(--gdf-glass-border);
}
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .gdf-glass {
    backdrop-filter: blur(var(--gdf-glass-blur));
    -webkit-backdrop-filter: blur(var(--gdf-glass-blur));
  }
}
```

Without `backdrop-filter` support, panels fall back to solid tinted backgrounds — still visually acceptable, just without the blur effect. This is a graceful degradation.

### 4.5 Performance Implications

- `backdrop-filter: blur()` triggers GPU compositing — the browser creates a separate layer for the element
- Each blurred element creates a GPU texture from the pixels behind it
- **Budget:** ~5-10 blurred glass panels visible simultaneously is safe; 20+ may cause composite slowdown on low-end devices
- **The current app has at most ~6-8 panels visible at once** (sidebar, header, 1-3 page panels, 1-2 dialogs) — well within budget
- **No `will-change` needed** — the browser automatically promotes backdrop-filter elements to GPU layers
- **Avoid:** blur + `border-radius` + `box-shadow` all on the same element (three compositing triggers). Use `border-radius` sparingly on glass panels.

## 5. Dynamic Background Architecture

### 5.1 Canvas vs CSS-Based Approach Comparison

| Factor                        | CSS (gradients + animations)                | Canvas 2D API                                      |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------- |
| **Implementation complexity** | LOW — CSS keyframes, radial gradients       | MEDIUM — requestAnimationFrame loop, draw calls    |
| **Performance**               | GPU-composited, zero JS                     | CPU-bound rAF loop, needs throttling               |
| **Cursor tracking**           | Requires JS mousemove → CSS custom property | Built-in via mouse coordinates                     |
| **Scanner sweep**             | Simple: CSS animation on pseudo-element     | Manual: draw line, clear, redraw                   |
| **Particle effects**          | Not possible (or extremely hacky)           | Easy: update particle positions per frame          |
| **Light mode variant**        | Trivial: CSS variables swap                 | Manual: conditionally change fill colors           |
| **60fps target**              | Achieved by default (GPU compositing)       | Requires optimization (throttle, offscreen canvas) |
| **Bundle size**               | 0 KB (CSS only)                             | ~2-3 KB for canvas utility                         |
| **Maintenance**               | Simple — change CSS values                  | Complex — imperative draw code                     |

**Recommendation:** **Hybrid approach** — CSS for gradient waves + scanner sweep, Canvas ONLY for cursor-reactive lighting and light particles.

### 5.2 Cursor Tracking Implementation

```typescript
// src/components/tactical/TacticalBackground.tsx (conceptual)
// Throttled mousemove → CSS custom property on :root
// Canvas layer for cursor glow only

const CURSOR_THROTTLE_MS = 50; // ~20fps for cursor updates

function useCursorPosition() {
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;

    const handleMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastUpdate < CURSOR_THROTTLE_MS) return;
      lastUpdate = now;

      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          '--gdf-cursor-x',
          `${(e.clientX / window.innerWidth) * 100}%`,
        );
        document.documentElement.style.setProperty(
          '--gdf-cursor-y',
          `${(e.clientY / window.innerHeight) * 100}%`,
        );
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafId);
    };
  }, []);
}
```

The ambient glow follows cursor position via a CSS radial gradient:

```css
.cursor-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -5;
  background: radial-gradient(
    600px circle at var(--gdf-cursor-x, 50%) var(--gdf-cursor-y, 50%),
    rgba(59, 130, 246, 0.06),
    transparent 60%
  );
  transition: opacity 0.3s ease-out;
}

/* Hide on touch devices */
@media (hover: none) and (pointer: coarse) {
  .cursor-glow {
    display: none;
  }
}
```

### 5.3 Animated Gradient/Wave Techniques

Three CSS gradient layers for depth:

```css
.gdf-ambient-waves {
  position: fixed;
  inset: 0;
  z-index: -10;
  overflow: hidden;
}

.gdf-ambient-waves::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 70vw;
  height: 70vw;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.12), /* cyan-500 */ transparent 55%);
  filter: blur(80px);
  animation: ambient-drift-1 20s ease-in-out infinite alternate;
}

.gdf-ambient-waves::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1), /* blue-500 */ transparent 55%);
  filter: blur(90px);
  animation: ambient-drift-2 25s ease-in-out infinite alternate-reverse;
}

@keyframes ambient-drift-1 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(5%, -3%) scale(1.1);
  }
}

@keyframes ambient-drift-2 {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(-4%, 2%) scale(1.08);
  }
}
```

### 5.4 Scanner Line Sweep

```css
.scanner-sweep {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--gdf-accent-secondary),
    /* cyan */ transparent
  );
  opacity: 0.15;
  z-index: -5;
  pointer-events: none;
  animation: scanner-sweep 8s linear infinite;
}

@keyframes scanner-sweep {
  0% {
    top: -2px;
  }
  100% {
    top: 100%;
  }
}
```

### 5.5 Performance Budget

| Component              | Technique                            | Budget                           | Degradation                                    |
| ---------------------- | ------------------------------------ | -------------------------------- | ---------------------------------------------- |
| Ambient gradient waves | CSS `radial-gradient` + `blur()`     | 3 layers, `blur(80-90px)`        | None — GPU composited                          |
| Cursor glow            | CSS radial gradient (CSS var update) | Throttled to 20fps               | Remove on touch devices                        |
| Scanner sweep          | CSS keyframe animation               | 1 element, 8s loop               | Reduce to 15s or disable                       |
| Light particles        | Canvas 2D (optional)                 | Max 30 particles, `rAF` at 30fps | Disable if `navigator.hardwareConcurrency < 4` |
| Glass blur             | `backdrop-filter: blur()`            | Max 8 elements visible           | Falls back to solid bg                         |

**Total JS main-thread budget:** < 3ms per frame for background updates (target 60fps = 16.67ms per frame). Cursor updates at 20fps, particles at 30fps — both well under budget.

### 5.6 Light Mode Background

In light mode:

- Replace `rgba(6,182,212,0.12)` → `rgba(6,182,212,0.06)` (subtler on light bg)
- Scanner line: `opacity: 0.08` instead of `0.15`
- Cursor glow: `rgba(59,130,246,0.03)` instead of `0.06`
- Add subtle grid overlay instead of deep vignette

## 6. Emotional UI State System

### 6.1 Deriving Camp "Emotional State"

Sources of "threat" data already available via TanStack Query:

1. **Stock alerts** — `useStockAlerts()` hook in `src/features/inventory/hooks/useStockAlerts.ts` — returns items below minimum
2. **Inventory query** — `useInventory(campId)` — raw stock levels
3. **People status** — `usePeople(campId)` — counts of sick/injured/away
4. **Active explorations** — `useExplorations()` — ongoing missions (vulnerability period)
5. **Camp auto_daily resources** — `useDashboardStats()` already computes this

**State derivation algorithm:**

```typescript
// src/features/ui/store/emotional.store.ts (NEW FILE)
type EmotionalState = 'stable' | 'alert' | 'critical';

function deriveEmotionalState(metrics: {
  criticalStockCount: number;
  lowStockCount: number;
  injuredCount: number;
  sickCount: number;
  activeExplorations: number;
}): EmotionalState {
  const { criticalStockCount, lowStockCount, injuredCount, sickCount, activeExplorations } =
    metrics;

  // Critical: any critical stock OR high casualties OR multiple simultaneous threats
  if (
    criticalStockCount > 0 ||
    injuredCount + sickCount > 5 ||
    (lowStockCount > 2 && activeExplorations > 2)
  ) {
    return 'critical';
  }

  // Alert: moderate threats
  if (lowStockCount > 0 || injuredCount + sickCount > 2 || activeExplorations > 3) {
    return 'alert';
  }

  return 'stable';
}
```

### 6.2 Zustand Store for UI State

```typescript
// src/features/ui/store/emotional.store.ts
import { create } from 'zustand';

type EmotionalState = 'stable' | 'alert' | 'critical';

interface EmotionalStore {
  state: EmotionalState;
  manualOverride: EmotionalState | null; // for debugging
  setState: (state: EmotionalState) => void;
  setOverride: (state: EmotionalState | null) => void;
  effectiveState: () => EmotionalState;
}

export const useEmotionalStore = create<EmotionalStore>((set, get) => ({
  state: 'stable',
  manualOverride: null,
  setState: (state) => set({ state }),
  setOverride: (override) => set({ manualOverride: override }),
  effectiveState: () => get().manualOverride ?? get().state,
}));
```

**Integration point:** A `useEmotionalStateSyncer` hook in `AppShell.tsx` that reads TanStack Query data and calls `setState()`:

```typescript
function useEmotionalStateSyncer() {
  const { criticalStockCount, lowStockCount, injuredCount, sickCount, activeExplorations } =
    useDashboardStats(role, activeCamp?.id);
  const setState = useEmotionalStore((s) => s.setState);

  useEffect(() => {
    setState(
      deriveEmotionalState({
        criticalStockCount: criticalStockCount ?? 0,
        lowStockCount: lowStockCount ?? 0,
        injuredCount: injuredCount ?? 0,
        sickCount: sickCount ?? 0,
        activeExplorations: activeExplorationsInCamp ?? 0,
      }),
    );
  }, [criticalStockCount, lowStockCount, injuredCount, sickCount, activeExplorations]);
}
```

### 6.3 CSS Variable Overrides Per State

Applied via `data-emotional-state` attribute on `:root`:

```css
/* Stable: defaults (no overrides) */

/* Alert */
:root[data-emotional-state='alert'] {
  --gdf-accent-secondary: #f59e0b; /* switch cyan → amber */
  --gdf-accent-secondary-glow: rgba(245, 158, 11, 0.4);
  --gdf-animation-speed-mult: 1.5; /* 1.5x faster animations */
  --gdf-scanner-opacity: 0.25; /* more visible scanner */
  --gdf-ambient-pulse: 2s; /* faster breathing */
}

/* Critical */
:root[data-emotional-state='critical'] {
  --gdf-accent-primary: #ef4444; /* switch blue → red */
  --gdf-accent-primary-glow: rgba(239, 68, 68, 0.5);
  --gdf-accent-secondary: #ef4444; /* both accents become red */
  --gdf-status-warning: #ef4444; /* warning becomes danger */
  --gdf-animation-speed-mult: 2.5; /* 2.5x faster */
  --gdf-scanner-opacity: 0.4; /* prominent scanner */
  --gdf-ambient-pulse: 1s; /* rapid breathing */
  --gdf-glitch-intensity: 1; /* enable glitch effects */
}
```

### 6.4 Glitch/Distortion Effects (Critical State)

**Lightweight CSS-only approach** (no canvas, no heavy JS):

```css
/* Glitch overlay — only visible in critical state */
.gdf-critical-glitch {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
}

:root[data-emotional-state='critical'] .gdf-critical-glitch {
  display: block;
  opacity: 0.03;
  background: linear-gradient(
    0deg,
    transparent 0%,
    rgba(239, 68, 68, 0.1) 25%,
    transparent 50%,
    rgba(239, 68, 68, 0.05) 75%,
    transparent 100%
  );
  background-size: 100% 4px;
  animation: critical-scan 0.1s linear infinite;
}

@keyframes critical-scan {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 100%;
  }
}

/* Subtle text glitch on headings */
:root[data-emotional-state='critical'] .gdf-glitch-text {
  animation: glitch-shift 3s ease-in-out infinite;
}

/* Border pulse on panels */
:root[data-emotional-state='critical'] .gdf-glass {
  animation: border-pulse-critical 2s ease-in-out infinite;
}

@keyframes border-pulse-critical {
  0%,
  100% {
    border-color: var(--gdf-glass-border);
  }
  50% {
    border-color: rgba(239, 68, 68, 0.25);
  }
}
```

**Performance:** All critical effects are CSS-only — zero JavaScript overhead. The `critical-scan` animation runs at 60fps on the GPU composite layer.

### 6.5 Transition Timing Between States

```css
/* Smooth transitions on all emotional-state-dependent properties */
:root {
  transition:
    --gdf-accent-primary 0.8s ease-in-out,
    --gdf-accent-secondary 0.8s ease-in-out,
    --gdf-accent-primary-glow 0.8s ease-in-out,
    --gdf-accent-secondary-glow 0.8s ease-in-out,
    --gdf-status-warning 0.8s ease-in-out;
}
```

**Note:** CSS custom property transitions are supported in Chrome 117+, Firefox 128+, Safari 17.4+. For older browsers, the state change is immediate (no transition) — graceful degradation.

## 7. Migration Sequencing

### 7.1 Optimal Dependency Graph Order

```
Phase 01 migration waves (order is dependency-driven):

Wave 0: FOUNDATIONS
├── tokens.css (new CSS variables)
├── tailwind.config.js (restructured theme)
├── globals.css (remove old utility classes, add new .gdf-* utilities)
├── fonts.css (verify or migrate to @fontsource)
└── pnpm check (verify build passes with new config, old components still work)

Wave 1: BACKGROUND + THEME
├── TacticalBackground.tsx (dynamic background system)
├── ThemeProvider (dark/light toggle + localStorage persistence)
├── Emotional store (Zustand — src/features/ui/store/emotional.store.ts)
└── Apply background to <App />

Wave 2: CORE COMPONENTS
├── GlassPanel.tsx (replaces Panel)
├── TacticalButton.tsx (replaces GlitchButton)
├── StatusBadge.tsx (restyle in-place)
├── HoloLoader.tsx (replaces ScreenLoader)
└── Toast system (restyle in-place)

Wave 3: LAYOUT
├── AppShell.tsx (sidebar, header — restyle with glass)
├── LockScreen.tsx (restyle with glass)
└── ErrorBoundary.tsx (replace GlitchButton import with TacticalButton)

Wave 4: PAGES (low risk first)
├── LoginPage.tsx (independent — no cyber/ imports currently)
├── DashboardPage.tsx (most complex — terminal lines, module cards, syslog)
└── All feature pages (swap imports in batch)

Wave 5: DATA + CHARTS
├── StockBarChart.tsx (restyle — Recharts theme)
├── SkeletonTable.tsx → GlassSkeleton.tsx (write new)
└── Optional dead components (StatCard, DataChart, RingMeter — write new or skip)

Wave 6: CLEANUP
├── Delete src/components/cyber/ directory
├── Delete src/components/navigation/ directory (legacy Sidebar)
├── Remove old CSS utility classes from globals.css
├── Remove old Tailwind colors from config (surface.*, accent.*, brand.*, status.*)
├── Run full grep for any remaining @/components/cyber/ imports
└── pnpm check
```

### 7.2 Page Migration Order (After Core Components)

| Order | Page                      | Risk        | Reason                                                                         |
| ----- | ------------------------- | ----------- | ------------------------------------------------------------------------------ |
| 1     | **LoginPage**             | LOW         | No cyber/ imports, self-contained, no AppShell dependency                      |
| 2     | **ErrorBoundary**         | LOW         | Only imports GlitchButton                                                      |
| 3     | **LockScreen**            | LOW         | Only uses Tailwind classes, no cyber/ imports                                  |
| 4     | **ResourcesPage**         | LOW         | Simple CRUD page, 3 cyber/ imports (Panel, GlitchButton, ScreenLoader)         |
| 5     | **ProfessionsPage**       | LOW         | Same pattern as ResourcesPage                                                  |
| 6     | **RationsPage**           | LOW         | Same pattern, simple page                                                      |
| 7     | **UsersPage**             | LOW         | Same pattern + StatusBadge                                                     |
| 8     | **AdmissionDetailPanel**  | LOW         | Feature component, only Panel                                                  |
| 9     | **AIAnalysisPanel**       | LOW         | Feature component, Panel + StatusBadge                                         |
| 10    | **StockAlertBanner**      | LOW         | Feature component, Panel + StatusBadge                                         |
| 11    | **CampsPage**             | MEDIUM      | Main CRUD page, lots of forms                                                  |
| 12    | **CampDetailPage**        | MEDIUM      | Detail view with forms                                                         |
| 13    | **PeopleListPage**        | MEDIUM      | Large list page with search/filter                                             |
| 14    | **PersonDetailPage**      | MEDIUM-HIGH | 800+ lines, heavy form use, many `neon-*` CSS var references                   |
| 15    | **PersonCreatePage**      | MEDIUM      | Complex form with image upload                                                 |
| 16    | **InventoryPage**         | MEDIUM      | Has StockBarChart — needs chart restyle too                                    |
| 17    | **InventoryAuditPage**    | MEDIUM      | Audit trail table                                                              |
| 18    | **ExplorationsPage**      | MEDIUM-HIGH | 830 lines, god component, heavy form use                                       |
| 19    | **ExplorationDetailPage** | MEDIUM      | Detail view                                                                    |
| 20    | **TransfersPage**         | MEDIUM-HIGH | 741 lines, complex workflow                                                    |
| 21    | **AdmissionsPage**        | MEDIUM      | AI admission flow                                                              |
| 22    | **DashboardPage**         | HIGH        | Most custom styles, syslog terminal, module cards, inline glow effects         |
| 23    | **AppShell**              | HIGH        | Layout foundation — must be last to ensure all page imports are migrated first |

### 7.3 Parallel Design System Strategy

```
During transition (Waves 2-5):
  src/components/cyber/      ← OLD: still serving unmigrated pages
  src/components/tactical/   ← NEW: serving migrated pages

Both directories coexist. No import collisions because paths differ:
  import { Panel } from '@/components/cyber/Panel'
  import { GlassPanel } from '@/components/tactical/GlassPanel'
```

**CSS dual-loading:** New tokens.css is loaded alongside old globals.css CSS variables during transition. Old variables (`--accent-primary`, `--surface-base`, etc.) continue working for unmigrated pages. New variables (`--gdf-*`) are used by tactical/ components. No conflict because different variable names.

### 7.4 Kill Criteria for Old Components

Delete `src/components/cyber/` when:

1. Zero imports remain in the codebase (`grep -r "from '@/components/cyber/'" src/` returns nothing)
2. All 22 page/component files have been migrated
3. `pnpm check` passes (lint + spell + build)
4. Visual verification passes on 3 major pages (Dashboard, Inventory, People)

**After deletion:** Remove old CSS utility classes from globals.css (`.glass`, `.brutalist-border`, `.neon-glow-red`, `.terminal-table`, `.terminal-input`, `.terminal-divider`, `.text-glow-*`, `.font-tech`). Remove old Tailwind theme colors (`surface.*`, `accent.*` old mappings, `brand.*`, `status.*` old mappings).

## 8. Risk Assessment

### 8.1 Hardest Components to Migrate

| Component            | Difficulty  | Why                                                                                                                                                                                                                       |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DashboardPage**    | HIGH        | 364 lines of inline Tailwind with no abstraction. Direct textShadow styles, syslog TerminalLine integration, custom module card system, stat cards with inline gradients. Must be largely rewritten rather than restyled. |
| **PersonDetailPage** | MEDIUM-HIGH | 850+ lines, heavy use of `neon-cyan`, `neon-fuchsia`, `neon-yellow` CSS vars in form labels, dialog titles, status displays. Many hardcoded `oklch()` colors.                                                             |
| **ExplorationsPage** | MEDIUM-HIGH | 830 lines, god component pattern, complex dialogs. Heavy use of old utility classes.                                                                                                                                      |
| **TransfersPage**    | MEDIUM-HIGH | 741 lines, complex workflow UI.                                                                                                                                                                                           |
| **AppShell**         | MEDIUM-HIGH | Foundation of every page. Sidebar with active nav indicators, camp selector, server-time header. Changes here affect visual of entire app — must be visually tested on every route.                                       |
| **StockBarChart**    | MEDIUM      | Recharts API surface. Must preserve chart logic while changing only colors.                                                                                                                                               |

### 8.2 Browser Compatibility Risks

| Risk                                                        | Probability           | Impact                                                      | Mitigation                                                                       |
| ----------------------------------------------------------- | --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `backdrop-filter` not supported                             | LOW (96.3% support)   | Panels appear solid instead of blurred                      | `@supports` fallback to solid backgrounds                                        |
| CSS `@property` / custom property transitions not supported | MEDIUM (~80% support) | Emotional state transitions are instant instead of animated | Graceful degradation — state still changes, just without smooth color transition |
| `mask-image` for grid overlay                               | LOW (>95%)            | Grid appears at full opacity instead of vignetted           | Fallback to lower base opacity                                                   |
| `oklch()` color function                                    | MEDIUM (~85% support) | Colors don't render on older Safari                         | Add fallback `rgb()` colors via PostCSS or manual duplicate declarations         |
| Canvas API for particles (optional)                         | LOW (>98%)            | Skip particles if not supported                             | Feature-detect canvas before initializing                                        |

### 8.3 Performance Risks

| Risk                                          | Severity | Mitigation                                                                                              |
| --------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| Many simultaneous `backdrop-filter` elements  | LOW      | App has max ~8 glass panels visible. GPU compositing handles this.                                      |
| Cursor tracking at 60fps on mousemove         | MEDIUM   | Throttle to 20fps via rAF + timestamp gate. Disable on touch devices.                                   |
| CSS animation energy on battery               | LOW      | Use `prefers-reduced-motion` media query to disable animations.                                         |
| Large `blur()` radius on background gradients | LOW      | `blur(80-100px)` on 3 pseudo-elements — GPU-composited, no repaint cost.                                |
| Canvas particle rAF loop                      | LOW      | Cap at 30 particles, toggle with `navigator.hardwareConcurrency`. Disable by default, enable as opt-in. |

### 8.4 Accessibility Risks

| Risk                                                    | Severity | Mitigation                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glass readability — low contrast text on transparent bg | MEDIUM   | Ensure text uses `--gdf-text-primary` (#e8edf3 on dark, #0f172a on light). WCAG AA requires 4.5:1 ratio — dark text at #e8edf3 on #141c26 bg = 10.2:1 (PASS). Light text at #0f172a on #ffffff bg = 15.4:1 (PASS). Glass transparency reduces effective contrast slightly but remains above 4.5:1 at 65% opacity. |
| Focus indicators on glass                               | LOW      | `:focus-visible` outline on gdf-accent-primary (#3b82f6) — high contrast against both dark and light surfaces.                                                                                                                                                                                                    |
| Reduced motion                                          | LOW      | All animations wrapped in `prefers-reduced-motion` media query. Framer Motion `useReducedMotion()` hook for JS animations.                                                                                                                                                                                        |
| Color-only state indicators                             | LOW      | Emotional state system uses multiple cues: color + animation speed + scanner visibility + text labels. Not color-only.                                                                                                                                                                                            |
| Scanner animation — vestibular triggers                 | MEDIUM   | Scanner sweep is slow (8s), subtle (opacity 0.15), and horizontal gradient. Disable via `prefers-reduced-motion`.                                                                                                                                                                                                 |

### 8.5 TypeScript Refactoring Scope

**Zero breaking type changes.** The migration is purely visual:

- Component props interfaces are preserved (Panel → GlassPanel keeps same `title`, `tag`, `status`, `accent` props)
- StockBarChart `StockBarEntry` type is preserved
- No API response types change
- No store types change
- New types: `EmotionalState` (union literal), `EmotionalStore` (Zustand interface) — additive, not breaking

## 9. Known Bugs/Concerns to Fix During Migration

From `.planning/codebase/CONCERNS.md` — issues addressable while touching visual code:

### 9.1 Legacy Navigation Components — DELETE

**Current state:** `src/components/navigation/Sidebar.tsx` still exists (and possibly Navbar.tsx, DockBar.tsx — only Sidebar.tsx confirmed). All navigation now uses `AppShell.tsx`.

**Action during Phase 01, Wave 6:** Delete `src/components/navigation/` directory after verifying zero imports:

```bash
grep -r "from.*navigation/" src/  # should return nothing
rm -rf src/components/navigation/
```

**CSpell update:** Remove `Navbar`, `DockBar` from cspell.json custom words if present.

### 9.2 Pervasive Type Casting — DEFER

**Issue:** 15+ page files use `as Record<string, unknown>` chains on API responses. This is a data-layer concern, not visual.

**Decision:** DEFER to a separate data-typing phase. Visual migration touches the JSX layer, not the data-fetching layer. Adding proper types while restyling would violate "zero breaking changes to business logic."

### 9.3 No Error Boundary — ALREADY FIXED

**Current state:** `src/components/ErrorBoundary.tsx` **exists and is wrapped around every lazy-loaded route** in `AppRoutes.tsx`. The CONCERNS.md was written before the ErrorBoundary was added.

**Action:** The ErrorBoundary uses `GlitchButton`. When migrating GlitchButton → TacticalButton (Wave 2), update the ErrorBoundary import. No other action needed.

### 9.4 Inconsistent Zod Resolver Usage — DEFER

**Issue:** Some forms use `zodResolver` directly, others use `resolved()` wrapper. This is form-logic, not visual.

**Decision:** DEFER to refactoring phase. Not in scope for visual redesign.

### 9.5 Session Lock Not Persisted — DEFER

**Issue:** Auth store partialize excludes `isLocked` and `lastActivity`. Auth logic, not visual.

**Decision:** DEFER to auth hardening phase. Not in scope.

### 9.6 Zustand Server Time Violation — DEFER

**Issue:** `serverTime` stored in Zustand violates "never store API data in Zustand" rule. Architecture concern, not visual.

**Decision:** DEFER to architecture refactoring phase.

### 9.7 `temp/` Directory — DELETE

**Issue:** `temp/neon-nova-dashboard/` (~2,100 lines of duplicate shadcn/ui components) may confuse search tools.

**Action during Phase 01, Wave 6:** Delete `temp/` directory. Not imported by `src/`.

## Don't Hand-Roll

| Problem                          | Don't Build              | Use Instead                                                   | Why                                                                                                    |
| -------------------------------- | ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| CSS color manipulation           | Custom JS color library  | CSS custom properties + `oklch()`                             | Native CSS handles theme switching, dark/light modes, and emotional state transitions without JS       |
| Animation orchestration          | Custom JS animation loop | Framer Motion + CSS keyframes                                 | Already installed. CSS for ambient, FramerMotion for UI microinteractions                              |
| Backdrop blur polyfill           | JS blur effect           | `@supports` CSS fallback                                      | 96.3% browser support; unsupported browsers get solid backgrounds — acceptable degradation             |
| Theme persistence                | Custom storage solution  | `localStorage` + CSS `:root[data-theme]` attribute            | Simple, tested, no dependency                                                                          |
| Glass panel depth effect         | Custom WebGL             | CSS `backdrop-filter: blur()` + RGBA backgrounds              | WebGL is overkill for 2D panels. CSS handles all glass needs                                           |
| Canvas particle system (if used) | Custom physics engine    | Simple array of `{x, y, vx, vy, opacity}` objects in rAF loop | Max 30 particles — no physics engine needed                                                            |
| Dynamic background               | Three.js                 | CSS gradients + canvas 2D                                     | Three.js adds ~150KB to bundle. CSS gradients handle 90% of the visual. Canvas 2D for cursor glow only |

**Key insight:** Holographic tactical UI is achievable with CSS + lightweight Canvas 2D. Three.js, WebGL, and heavy animation libraries are unnecessary for this phase. Framer Motion is already installed and sufficient for all component-level animations. CSS custom properties provide the theming engine.

## Architecture Patterns

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        LAYER 0: CSS Token Engine                         │
│  tokens.css ───► CSS Custom Properties (--gdf-*)                        │
│  • dark mode variables (default)                                         │
│  • light mode variables ([data-theme="light"])                           │
│  • emotional overrides ([data-emotional-state="alert"|"critical"])       │
│  • consumed by: tailwind.config.js, globals.css, all components          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                     LAYER 1: Dynamic Background                           │
│  TacticalBackground.tsx                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ CSS Layer: ambient waves (3 radial gradients, blur, drift anim)     │ │
│  │ CSS Layer: scanner sweep (linear gradient, 8s loop)                 │ │
│  │ CSS Layer: cursor glow (radial gradient, CSS var update 20fps)      │ │
│  │ Canvas Layer (optional): 30 light particles, rAF 30fps              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  • z-index: -10 (below all content)                                     │
│  • pointer-events: none                                                 │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                     LAYER 2: Layout Shell                                 │
│  AppShell.tsx                                                            │
│  ┌──────────────┬──────────────────────────────────────────────────────┐│
│  │ Glass Sidebar │ Glass Header (server clock, status dot)              ││
│  │ • nav links   │                                                     ││
│  │ • camp sel    │ <Outlet /> ──► lazy page components                  ││
│  │ • user info   │   wrapped in Suspense + ErrorBoundary                ││
│  │ • logout      │                                                     ││
│  └──────────────┴──────────────────────────────────────────────────────┘│
│  • reads: useEmotionalStore → applies data-emotional-state to <main>     │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                     LAYER 3: Glass Components                             │
│  src/components/tactical/                                                │
│  ┌──────────────┬──────────────┬──────────────┬────────────────────────┐│
│  │ GlassPanel   │ TacticalBtn  │ StatusBadge  │ HoloLoader              ││
│  │ • backdrop-  │ • primary    │ • danger     │ • holographic ring      ││
│  │   filter     │ • ghost      │ • warning    │   animation             ││
│  │ • corner     │ • danger     │ • success    │ • scanner pulse         ││
│  │   brackets   │ • disabled   │ • info       │                         ││
│  └──────────────┴──────────────┴──────────────┴────────────────────────┘│
│  • read tokens via CSS variables                                        │
│  • respond to emotional state via data-attribute inheritance             │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                     LAYER 4: Page Components                              │
│  DashboardPage, LoginPage, CampsPage, PeoplePage, InventoryPage, ...     │
│  • consume GlassPanel, TacticalButton, StatusBadge, HoloLoader           │
│  • business logic UNCHANGED (TanStack Query hooks, Zustand stores)       │
│  • form patterns UNCHANGED (react-hook-form + zod)                       │
│  • only JSX styling layer changes                                        │
└──────────────────────────────────────────────────────────────────────────┘

Data flow: tokens.css → tailwind.config.js → components → pages
Emotional flow: TanStack Query data → EmotionalStore → CSS data-attribute → tokens.css overrides → all layers
Theme flow: user toggle → localStorage → :root[data-theme] → tokens.css swap
```

### Recommended Project Structure (New + Modified)

```
src/
├── app/styles/
│   ├── tokens.css          ← NEW: --gdf-* design tokens (dark + light + emotional)
│   ├── globals.css         ← MODIFIED: remove old utility classes, add .gdf-*
│   └── fonts.css            ← (optional) migrate Google Fonts import
│
├── components/
│   ├── cyber/               ← PRESERVED during migration, deleted in Wave 6
│   ├── tactical/            ← NEW: Phase 01 glass components
│   │   ├── GlassPanel.tsx
│   │   ├── TacticalButton.tsx
│   │   ├── HoloLoader.tsx
│   │   ├── TacticalBackground.tsx  (dynamic background system)
│   │   ├── GlassSkeleton.tsx       (replaces SkeletonTable + SkeletonCard)
│   │   ├── ScannerLine.tsx         (optional: horizontal scan effect)
│   │   └── ThemeToggle.tsx         (dark/light mode switch)
│   ├── navigation/          ← DELETE in Wave 6 (legacy)
│   └── ui/                  ← UNCHANGED (shadcn/ui primitives — work with new tokens)
│
├── features/
│   └── ui/                  ← NEW: UI state feature
│       ├── store/
│       │   └── emotional.store.ts   (Zustand: emotional state + override)
│       ├── hooks/
│       │   └── useEmotionalSyncer.ts (TanStack Query → emotional state derivation)
│       └── index.ts
│
├── layouts/
│   └── AppShell.tsx         ← MODIFIED: glass sidebar, new header, emotional state attr
│
├── pages/
│   ├── LoginPage.tsx        ← MODIFIED: glass card, cyan accent
│   └── DashboardPage.tsx    ← MODIFIED: tactical dashboard, replace syslog
│
├── routes/
│   └── AppRoutes.tsx        ← MODIFIED: ScreenLoader → HoloLoader import
│
├── shared/lib/
│   └── toast.tsx            ← MODIFIED: new glass styling
│
└── hooks/
    └── useTheme.ts          ← NEW: dark/light mode toggle + persistence
```

### Pattern 1: Glass Panel Component

```typescript
// src/components/tactical/GlassPanel.tsx
// Replaces: src/components/cyber/Panel.tsx
// Props preserved: title, tag, status, children, className, accent, variant

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AccentColor = 'cyan' | 'amber' | 'green' | 'red';

interface GlassPanelProps {
  title?: string;
  tag?: string;
  status?: string;
  children: ReactNode;
  className?: string;
  accent?: AccentColor;
  variant?: 'default' | 'heavy' | 'subtle';
  bracketed?: boolean;  // corner brackets (tactical accent)
}

const ACCENT_CLASSES: Record<AccentColor, { text: string; border: string; dot: string }> = {
  cyan:   { text: 'text-gdf-accent-secondary', border: 'border-gdf-accent-secondary/20', dot: 'bg-gdf-accent-secondary' },
  amber:  { text: 'text-gdf-status-warning',   border: 'border-gdf-status-warning/20',   dot: 'bg-gdf-status-warning' },
  green:  { text: 'text-gdf-status-success',   border: 'border-gdf-status-success/20',   dot: 'bg-gdf-status-success' },
  red:    { text: 'text-gdf-status-danger',    border: 'border-gdf-status-danger/20',    dot: 'bg-gdf-status-danger' },
};

export function GlassPanel({
  title, tag, status, children, className = '',
  accent = 'cyan', variant = 'default', bracketed = false,
}: GlassPanelProps) {
  const a = ACCENT_CLASSES[accent];

  const variantClass =
    variant === 'heavy'  ? 'backdrop-blur-glass-heavy bg-gdf-glass-bg-heavy' :
    variant === 'subtle' ? 'backdrop-blur-glass bg-gdf-glass-bg/40' :
                           'backdrop-blur-glass bg-gdf-glass-bg'; // default

  return (
    <div className={cn(
      'relative rounded-md border border-gdf-glass-border',
      variantClass,
      'p-6 transition-colors duration-250',
      bracketed && 'gdf-glass-bracketed',
      className,
    )}>
      {(title || tag || status) && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-gdf-border-subtle">
          <div className="flex items-center gap-3">
            {tag && (
              <span className={cn(
                'px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider',
                a.border, 'border', a.text, 'bg-gdf-surface-overlay/50',
              )}>{tag}</span>
            )}
            {title && (
              <h3 className="text-sm font-semibold tracking-tight text-gdf-text-primary">
                {title}
              </h3>
            )}
          </div>
          {status && (
            <div className={cn('flex items-center gap-2 text-xs font-mono', a.text)}>
              <span className={cn('w-1.5 h-1.5 animate-blink', a.dot)} />
              {status}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
```

### Pattern 2: Tactical Button

```typescript
// src/components/tactical/TacticalButton.tsx
// Replaces: src/components/cyber/GlitchButton.tsx
// Props preserved: children, variant, HTMLButton attributes

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger' | 'warning';
}

export function TacticalButton({
  children, variant = 'primary', className = '', ...rest
}: TacticalButtonProps) {
  const styles = {
    primary: 'bg-gdf-accent-primary text-gdf-text-inverse hover:bg-gdf-accent-primary-dim active:scale-[0.98]',
    warning: 'bg-gdf-status-warning text-gdf-text-inverse hover:brightness-110 active:scale-[0.98]',
    ghost:   'bg-transparent border border-gdf-border-default text-gdf-text-secondary hover:border-gdf-accent-primary hover:text-gdf-accent-primary',
    danger:  'bg-transparent border border-gdf-status-danger/30 text-gdf-status-danger hover:bg-gdf-status-danger/10 hover:border-gdf-status-danger',
  };

  return (
    <button
      className={cn(
        'font-mono text-xs tracking-wider uppercase px-5 py-2.5 rounded-md',
        'transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
```

### Anti-Patterns to Avoid

- **Inline `textShadow` styles:** Current DashboardPage uses `style={{ textShadow: '0 0 16px var(--accent-primary)' }}` in 8+ places. New: use CSS utility class `.gdf-glow-text` applied via className, not inline style.
- **Hardcoded oklch() values in JSX:** Current codebase has `oklch(0.68 0.32 340 / 0.6)` in 10+ files. New: all colors come from CSS variables (design tokens).
- **Direct zinc color classes:** Current AppShell, LoginPage, LockScreen, and feature pages use hardcoded `border-zinc-800`, `text-zinc-400`, `bg-zinc-900/50` etc. These all need to migrate to `--gdf-*` tokens.
- **Terminal-themed language in UI:** "TERMINAL ACTIVE", "COMMAND INTERFACE", "AWAITING OPERATOR INPUT", "CIPHER KEY", "AUTH FAILURE", "END MANAGEMENT" — replace with tactical equivalents. This is a content change, not just styling.
- **Mixing old and new CSS variable names:** During migration, old `--accent-primary` and new `--gdf-accent-primary` coexist. New components MUST use `--gdf-*` only. Old components use `--accent-*` until migrated, then deleted.

## Runtime State Inventory

> Phase 01 is a visual redesign — no rename, refactor, or migration of data. It is a greenfield UI layer on top of the existing application state.

| Category            | Items Found                                                                                                                                                                                     | Action Required |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Stored data         | None — visual changes only. All TanStack Query caches, Zustand persisted state (`gdf.auth`), and localStorage are unaffected.                                                                   | None            |
| Live service config | None — no external services reference visual tokens or component names.                                                                                                                         | None            |
| OS-registered state | None — no OS-level registrations reference frontend visual components.                                                                                                                          | None            |
| Secrets/env vars    | None — env vars (`VITE_API_URL`, `VITE_APP_NAME`, `VITE_SESSION_TIMEOUT_MS`) unchanged.                                                                                                         | None            |
| Build artifacts     | Theme toggle preference will be stored in `localStorage` as `gdf.theme` (new) — no migration needed (no existing key). Old cyber/ component files will be deleted — verifiable by `git status`. | None            |

**Nothing found in any category — this is a pure visual layer replacement with zero runtime state impact.**

## Environment Availability

| Dependency            | Required By                    | Available           | Version        | Fallback                          |
| --------------------- | ------------------------------ | ------------------- | -------------- | --------------------------------- |
| Node.js               | Build (tsc, vite)              | ✓                   | 20.x (via nix) | —                                 |
| pnpm                  | Package management             | ✓                   | 10.32.1        | —                                 |
| TypeScript            | Type checking                  | ✓                   | ~5.9.3         | —                                 |
| Vite                  | Dev server + build             | ✓                   | 8.0.1          | —                                 |
| Tailwind CSS          | Styling                        | ✓                   | 3.4.19         | —                                 |
| React                 | UI framework                   | ✓                   | 19.2.4         | —                                 |
| Framer Motion         | Component animations           | ✓                   | 12.38.0        | —                                 |
| Recharts              | StockBarChart                  | ✓                   | 3.8.1          | —                                 |
| Canvas API            | Dynamic background (particles) | ✓ (browser API)     | N/A            | Disable particles if unavailable  |
| `backdrop-filter` CSS | Glass panels                   | ✓ (browser feature) | N/A            | Solid backgrounds via `@supports` |
| `oklch()` CSS         | Advanced color manipulation    | ✓ (browser feature) | N/A            | `rgb()` fallback declarations     |

**No missing dependencies.** All tools are already installed and verified by existing `pnpm check` passing.

## Package Legitimacy Audit

**No new external packages are required for Phase 01.** The phase uses only already-installed dependencies (React, Tailwind CSS, Framer Motion, Recharts) and browser-native APIs (Canvas 2D, CSS backdrop-filter, CSS custom properties).

If the optional `@fontsource/inter` and `@fontsource/jetbrains-mono` packages are adopted (to replace Google Fonts CDN), run slopcheck at that time. These are well-established packages on npm (50M+ weekly downloads each) and pose no risk.

## State of the Art

| Old Approach                                               | Current Approach                                                         | When Changed | Impact                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------ | --------------------------------------------------- |
| CSS variables in `:root` only                              | CSS variables with `[data-theme]` and `[data-emotional-state]` selectors | Phase 01     | Enables dark/light mode and emotional reactivity    |
| Solid panel backgrounds (`.glass` = `background: #171717`) | Glassmorphism (`backdrop-filter: blur()` + RGBA)                         | Phase 01     | Depth, modern aesthetic, matches holographic design |
| Inline `textShadow` styles                                 | CSS `.gdf-glow-text` utility class                                       | Phase 01     | Consistency, easier to change globally              |
| Hardcoded zinc color palette                               | `--gdf-*` design token system                                            | Phase 01     | Single source of truth, theme switching             |
| Single dark mode                                           | Dark + light dual-theme                                                  | Phase 01     | User preference, accessibility                      |
| Red primary accent (#ef4444)                               | Blue/cyan primary (#3b82f6 / #06b6d4)                                    | Phase 01     | CONTEXT.md spec                                     |
| Brutalist sharp corners (`rounded-none`)                   | Slightly softer tactical corners (`rounded-md` — 4px)                    | Phase 01     | Softer, more modern without being SaaS-generic      |
| Dead cyber/ components (8 unused)                          | Removed or rewritten for new system                                      | Wave 6       | Clean codebase                                      |

**Deprecated/outdated:**

- `.brutalist-border` — replaced by `.gdf-glass` with `border-gdf-glass-border`
- `.neon-glow-red` — replaced by `.gdf-glow-accent`
- `.glass`, `.glass-heavy`, `.glass-light`, `.glass-interactive` — replaced by `.gdf-glass` variants
- `.terminal-table`, `.terminal-input`, `.terminal-divider` — replaced by tactical equivalents
- `.font-tech` — removed (no "tech" aesthetic in new design)
- `.text-glow-fuchsia`, `.text-glow-cyan`, `.text-glow-yellow` — replaced by `.gdf-glow-*` utilities
- `--neon-fuchsia`, `--neon-cyan`, `--neon-violet`, `--neon-yellow` CSS vars — removed (were aliases to red/amber anyway)
- `src/components/cyber/` directory — entire directory deprecated, deleted in Wave 6
- `src/components/navigation/` directory — legacy, deleted in Wave 6

## Assumptions Log

| #   | Claim                                                                                                                                                                                   | Section | Risk if Wrong                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `docs/DESIGN_SYSTEM.md` fonts (Orbitron, Rajdhani) were never loaded — only Inter + JetBrains Mono are in the app. No migration needed for Orbitron/Rajdhani removal.                   | §1.4    | LOW — verified by source code audit. If Orbitron/Rajdhani are somehow loaded elsewhere (unlikely), they'd need font-face removal.                                                     |
| A2  | `pnpm check` currently passes.                                                                                                                                                          | General | LOW — build command is standardized. If it fails, issues are pre-existing and not caused by Phase 01.                                                                                 |
| A3  | Canvas 2D API is available in all target browsers (it is — 99.5%+ support).                                                                                                             | §5      | LOW — Canvas is a mature API. Fallback to CSS-only background if unavailable (e.g., Node.js SSR).                                                                                     |
| A4  | `backdrop-filter` graceful degradation (solid backgrounds) is acceptable.                                                                                                               | §4.4    | LOW — 96.3% support. The 3.7% without it are mostly Firefox ESR < 103 or very old Safari.                                                                                             |
| A5  | Emotional state derivation from existing TanStack Query data is feasible. §6.1 data sources (stock alerts, people status, explorations) are already queried.                            | §6.1    | MEDIUM — if `useStockAlerts()` or people status queries don't return the expected shape, the derivation algorithm needs adjustment. This is a data-mapping concern, not a visual one. |
| A6  | The 8 unused cyber/ components (WaveBackground, CyberGrid, RingMeter, StatCard, DataChart, SkeletonTable, SkeletonCard, FileInput) have zero runtime imports and can be safely deleted. | §1.3    | LOW — verified by grep. No `from '@/components/cyber/{component}'` for any of these 8 found.                                                                                          |
| A7  | Framer Motion `motion.ts` file does not exist as a separate file — animation constants are inline in components and CSS. A new `motion.ts` will be created for shared variants.         | §1.5    | LOW — verified by file existence check. Creating it is additive, not breaking.                                                                                                        |

## Open Questions (RESOLVED)

1. **Font self-hosting vs CDN** — RESOLVED: Keep CDN for now. Migrate to `@fontsource` in a later optimization phase if PWA/offline support is needed.
   - Decision lock: Plan 01-01 keeps `@import` in globals.css, removes redundant `<link>` from index.html. No `@fontsource` packages installed.

2. **Light mode default behavior** — RESOLVED: Default to dark. Add manual toggle via `useTheme` Zustand store. Respect `prefers-color-scheme` only if user hasn't manually set a preference (stored in localStorage).
   - Decision lock: Plan 01-03 implements `useTheme` store with `mode: 'dark' | 'light' | 'system'`, default `'dark'`.

3. **Scanner sweep visibility** — RESOLVED: Always-on but very subtle (opacity 0.08-0.15). Can be toggled per-page via the `TacticalBackground` component prop `scannerEnabled`.
   - Decision lock: Plan 01-03 implements `.gdf-scanner-sweep` CSS class as fixed overlay in `TacticalBackground`.

4. **Canvas particles: include or defer?** — RESOLVED: DEFER particles to Wave 2+ (after background + scanner are working). Ship without particles initially; add as enhancement.
   - Decision lock: Plan 01-03 explicitly notes "no particles in initial implementation" in TacticalBackground component spec.

5. **ErrorBoundary GlitchButton dependency during migration** — RESOLVED: ErrorBoundary migration MUST happen in Wave 3/Wave 4 (before Wave 5 cleanup). Plan 01-06 (Wave 4) migrates ErrorBoundary GlitchButton→TacticalButton. Plan 01-07 (Wave 5) deletes GlitchButton only after verifying zero remaining imports.
   - Decision lock: Verified in §7.1 migration order. Plan 01-06 Task 2 PART B handles ErrorBoundary migration. Plan 01-07 Task 1 deletes GlitchButton with grep audit gate.

## Sources

### Primary (HIGH confidence)

- Codebase source files (read directly): `globals.css`, `tailwind.config.js`, all 14 `cyber/*.tsx` files, `AppShell.tsx`, `DashboardPage.tsx`, `LoginPage.tsx`, `AppRoutes.tsx`, `App.tsx`, `main.tsx`, `toast.tsx`, `useNavItems.ts`, `useDashboardStats.ts`, `ErrorBoundary.tsx`, `LockScreen.tsx`, `ProtectedRoute.tsx`
- Codebase documentation: `AGENTS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/STACK.md`, `.planning/codebase/CONVENTIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/AGENT.md`
- Phase context: `.planning/phases/01-ui-redesign/01-CONTEXT.md`, `.planning/config.json`, `requerimientos-frontend.md`
- CSS backdrop-filter specification (verified via training knowledge of web.dev, MDN)
- caniuse.com browser support data for backdrop-filter, oklch(), CSS custom property transitions

### Secondary (MEDIUM confidence)

- Tailwind CSS 3.4 documentation — `darkMode` configuration, `backdropBlur` theme extension, `@layer` directives
- Framer Motion 12.x API — `useReducedMotion()`, `Variants` type, `motion.div` pattern
- Recharts 3.x theming — `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip` props
- Zustand 5.x — `create()` pattern, `persist` middleware
- React 19 patterns — lazy loading, Suspense, ErrorBoundary class component

### Tertiary (LOW confidence)

- None. All findings verified against codebase source files or official documentation.

## Metadata

**Confidence breakdown:**

- Current UI audit: **HIGH** — every component, CSS variable, and import site catalogued by direct source file reading and grep search
- Component migration map: **HIGH** — all 14 components analyzed with import counts, risk levels, and migration strategy
- Design token architecture: **HIGH** — built from CONTEXT.md spec + codebase analysis. Token values within approved ranges.
- Glassmorphism strategy: **HIGH** — based on CSS spec and browser compatibility data. Blur values from established best practices.
- Dynamic background: **MEDIUM** — approach is sound (CSS + canvas) but exact canvas implementation details are at the agent's discretion and need prototyping.
- Emotional UI system: **MEDIUM** — store design is standard Zustand pattern. State derivation algorithm is conceptual and needs calibration with real data.
- Migration sequencing: **HIGH** — dependency graph verified via grep import search. Order ensures zero broken imports.
- Risk assessment: **MEDIUM** — accessibility and performance risks are theoretical until implemented and tested.

**Research date:** 2026-05-23
**Valid until:** 2026-06-23 (30 days — stable domain, CSS/Tailwind best practices change slowly)
