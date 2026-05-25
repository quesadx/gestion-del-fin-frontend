# Design System — Gestión del Fin · Tactical Command Interface

> Updated 2026-05-23 — Phase 01 Tactical UI Redesign

## Visual Philosophy

Holographic tactical OS — alive, reactive, atmospheric, elegant, technological.
A command center interface for managing survivor camps in a post-apocalyptic world.

**Inspirations:** Tactical HUDs, glassmorphism, sci-fi command centers, modern hologram
displays, scanner interfaces, surveillance systems.

**Anti-inspirations (intentionally avoided):** Retro terminals, green phosphor CRT,
cyberpunk RGB overload, gamer-heavy interfaces, excessive neon.

---

## Color Palette

All colors are defined as `--gdf-*` CSS custom properties in `src/app/styles/tokens.css`.
Tailwind consumes them via the `gdf.*` color namespace.

### Surface Tokens

| Token                   | Dark      | Light     | Usage             |
| ----------------------- | --------- | --------- | ----------------- |
| `--gdf-surface-root`    | `#080c12` | `#f0f4f8` | Main background   |
| `--gdf-surface-base`    | `#0d131a` | `#f7f9fc` | Input backgrounds |
| `--gdf-surface-raised`  | `#141c26` | `#ffffff` | Cards, sidebar    |
| `--gdf-surface-overlay` | `#1a2332` | `#e8eef4` | Modals, dialogs   |
| `--gdf-surface-hover`   | `#1e2a3a` | `#dce5f0` | Hover states      |

### Text Tokens

| Token                  | Dark      | Light     |
| ---------------------- | --------- | --------- |
| `--gdf-text-primary`   | `#e8edf3` | `#0f172a` |
| `--gdf-text-secondary` | `#8b9bb5` | `#475569` |
| `--gdf-text-muted`     | `#536682` | `#94a3b8` |
| `--gdf-text-inverse`   | `#080c12` | `#ffffff` |

### Accent Tokens

| Token                      | Value            | Usage                         |
| -------------------------- | ---------------- | ----------------------------- |
| `--gdf-accent-primary`     | `#3b82f6` (blue) | Primary buttons, active nav   |
| `--gdf-accent-primary-dim` | `#2563eb`        | Button hover                  |
| `--gdf-accent-secondary`   | `#06b6d4` (cyan) | Highlights, scanner, brackets |

### Status Tokens

| Token                  | Value                         | Usage                    |
| ---------------------- | ----------------------------- | ------------------------ |
| `--gdf-status-danger`  | `#ef4444`                     | Errors, critical, alerts |
| `--gdf-status-warning` | `#f59e0b` / `#d97706` (light) | Warnings, amber accents  |
| `--gdf-status-success` | `#10b981` / `#059669` (light) | Online, healthy          |

---

## Typography

- **Inter** (weights 400-900) — body text, headings, UI labels
- **JetBrains Mono** (weights 400-700) — data displays, metrics, monospace labels

Fonts loaded via Google Fonts CDN (`globals.css` `@import`). No retro pixel or
display fonts — Inter + JetBrains Mono only.

---

## Glassmorphism

Translucent panel surfaces using `backdrop-filter: blur()`.

| Token                    | Dark                  | Light                    |
| ------------------------ | --------------------- | ------------------------ |
| `--gdf-glass-bg`         | `rgba(20,28,38,0.65)` | `rgba(255,255,255,0.65)` |
| `--gdf-glass-bg-heavy`   | `rgba(13,19,26,0.85)` | `rgba(255,255,255,0.85)` |
| `--gdf-glass-blur`       | `16px`                | `16px`                   |
| `--gdf-glass-blur-heavy` | `24px`                | `24px`                   |

**Browser support:** 96.3% global (backdrop-filter). Browsers without it fall back
to solid backgrounds via normal CSS variable resolution.

**CSS utility classes:** `.gdf-glass`, `.gdf-glass-heavy`, `.gdf-glass-interactive`,
`.gdf-glass-bracketed` (corner bracket accents).

---

## Dynamic Background

CSS-based animated background with three layers:

1. **Ambient gradient waves** — cyan/blue radial gradients, 80-90px blur, 20-25s drift
   (`animate-ambient-drift-1/2`)
2. **Cursor-reactive glow** — radial gradient following mouse (throttled 20fps, hidden
   on touch devices)
3. **Scanner sweep** — horizontal cyan line, 8s cycle, subtle opacity (`animate-scanner-sweep`)

Performance: GPU-composited (CSS transforms + blur). No Canvas rendering. No particles.
All layers respect `prefers-reduced-motion`.

---

## Emotional UI States

The interface reacts to camp health via `data-emotional-state` attribute on `:root`:

| State        | Trigger                                            | Visual Effect                                 |
| ------------ | -------------------------------------------------- | --------------------------------------------- |
| **stable**   | Default                                            | Blue/cyan accents, slow breathing, calm waves |
| **alert**    | Low stock, injured people, active explorations > 3 | Amber accent shift, faster scanner            |
| **critical** | Critical stock, many injured/sick, multiple crises | Red accent shift, glitch overlay              |

State is derived from TanStack Query data (stock alerts, people status, explorations)
via `useEmotionalSyncer` hook. Overridable via `useEmotionalStore.manualOverride`.

CSS transitions on accent/glow tokens: `0.8s ease-in-out` for smooth state changes.

---

## Theme (Dark / Light)

- **Default:** Dark mode
- **Toggle:** `ThemeToggle` button (Sun/Moon icon, fixed top-right)
- **Persistence:** `localStorage` key `gdf.theme`
- **Auto-detect:** `prefers-color-scheme` honored only on first visit (no manual pref set)

Light mode tokens defined in `:root[data-theme="light"]` selector.

---

## Components

### GlassPanel

Glass card wrapper. Props: `title?`, `tag?`, `status?`, `children`, `accent?`
(cyan|amber|green|red), `variant?` (default|heavy|subtle), `bracketed?`.

Path: `src/components/tactical/GlassPanel.tsx`

### TacticalButton

Button with variants: primary (blue filled), ghost (transparent border),
warning (amber filled), danger (red border). Replaces GlitchButton.

Path: `src/components/tactical/TacticalButton.tsx`

### StatusBadge

Inline badge with colored dot + label. Variants: red, amber, green.
Restyle of existing cyber/StatusBadge.

Path: `src/components/cyber/StatusBadge.tsx`

### HoloLoader

Full-screen holographic loading spinner with dual cyan rings, scanner sweep,
"System Online" label. Replaces ScreenLoader.

Path: `src/components/tactical/HoloLoader.tsx`

### TacticalBackground

Fixed background layer: gradient waves, cursor glow, scanner sweep.

Path: `src/components/tactical/TacticalBackground.tsx`

### ThemeToggle

Dark/light mode toggle button.

Path: `src/components/tactical/ThemeToggle.tsx`

---

## Layout

**AppShell** (`src/layouts/AppShell.tsx`):

- Fixed left sidebar with glass backdrop-blur and cyan active nav indicators
- Sticky glass header with server clock and "SYSTEM NOMINAL" status
- Transparent main content area (background from TacticalBackground)
- Integrated `useEmotionalSyncer` for reactive UI states
- Collapsible on desktop, sheet drawer on mobile

---

## Animation

- `fade-in`, `slide-up`, `slide-in-right` — page/component transitions
- `breathe` — breathing opacity (status dots, ambient elements)
- `scanner-sweep` — horizontal scan line (8s linear)
- `pulse-glow` — pulsating glow effect
- `ambient-drift-1/2` — slow gradient blob movement (20-25s)
- `glitch-shift` — subtle horizontal jitter for critical states
- `blink` — cursor/punctuation blink (1.2s step-end)

All animations respect `prefers-reduced-motion`. GPU-composited where possible.

---

## Tailwind Configuration

`tailwind.config.js` exposes:

- `gdf.*` namespace — primary token consumption (`bg-gdf-surface-base`, `text-gdf-accent-primary`)
- Legacy namespaces (`surface.*`, `accent.*`, `text.*`, `border.*`, `brand.*`, `status.*`) — backward compat
- Shadcn/ui compat (`background`, `foreground`, `card`, `muted`, etc.)
- `backdropBlur: { glass, 'glass-heavy' }` — glass effect blur sizes
