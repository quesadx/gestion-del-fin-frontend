# DESIGN_SYSTEM.md — Gestión del Fin · Visual & Animation Context

> Load this when working on: UI components, styles, layouts, animations, Tailwind classes.

---

## VISUAL CONCEPT

The current system is cyberpunk neon — not green CRT. The UI is still a wearable tactical terminal, but it now lives on a neon-fused digital display inside a rugged wrist device.

**Three pillars:**
1. Deep matte screen base with high-glow neon accents
2. Techno display typography — crisp geometric and monospace fonts
3. Information-first density with strong contrast and holo-inspired overlays

The device aesthetic remains rugged and mechanical, but the runtime palette is dominated by:
- `Fuchsia` and `Cyan` as primary accents
- `Yellow` for warnings and highlights
- dark charcoal / oklch black for surfaces and panels
- soft ambient glow and scanline depth

---

## CSS DESIGN TOKENS

Defined in `src/app/styles/globals.css`. Use these variables everywhere — never hardcode colors, shadows, or spacing.

```css
:root {
  /* BASE SCREEN */
  --background: oklch(0.13 0.04 320);
  --foreground: oklch(0.97 0.02 320);
  --card: oklch(0.18 0.06 325 / 0.55);
  --card-foreground: oklch(0.97 0.02 320);
  --popover: oklch(0.16 0.06 325);
  --popover-foreground: oklch(0.97 0.02 320);

  /* ACCENT PALETTE */
  --primary: oklch(0.68 0.32 340);
  --primary-foreground: oklch(0.1 0.03 320);
  --secondary: oklch(0.55 0.28 300);
  --secondary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.22 0.05 320 / 0.6);
  --muted-foreground: oklch(0.78 0.08 320);
  --accent: oklch(0.85 0.22 200);
  --accent-foreground: oklch(0.1 0.03 320);

  /* WARNING / DANGER */
  --destructive: oklch(0.65 0.28 25);
  --destructive-foreground: oklch(0.98 0 0);
  --warning: oklch(0.92 0.2 100);
  --warning-foreground: oklch(0.13 0.04 320);

  /* NEON HIGHLIGHTS */
  --neon-fuchsia: oklch(0.68 0.32 340);
  --neon-cyan: oklch(0.85 0.22 200);
  --neon-violet: oklch(0.55 0.28 300);
  --neon-yellow: oklch(0.92 0.2 100);
  --deep-magenta: oklch(0.25 0.18 340);
  --charcoal: oklch(0.13 0.02 320);

  /* GLOW EFFECTS */
  --glow-fuchsia: 0 0 18px oklch(0.68 0.32 340 / 0.7), 0 0 40px oklch(0.68 0.32 340 / 0.35);
  --glow-cyan: 0 0 18px oklch(0.85 0.22 200 / 0.7), 0 0 40px oklch(0.85 0.22 200 / 0.35);
  --glow-yellow: 0 0 18px oklch(0.92 0.2 100 / 0.7), 0 0 40px oklch(0.92 0.2 100 / 0.4);

  --gradient-wave:
    radial-gradient(ellipse at 20% 30%, oklch(0.35 0.25 340 / 0.55), transparent 55%),
    radial-gradient(ellipse at 80% 70%, oklch(0.4 0.28 300 / 0.5), transparent 60%),
    radial-gradient(ellipse at 50% 100%, oklch(0.5 0.3 320 / 0.45), transparent 65%);

  /* GEOMETRY */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --border-thin: 1px solid oklch(0.68 0.32 340 / 0.35);
  --border-panel: 1px solid oklch(0.68 0.32 340 / 0.18);
  --radius-sm: 2px;
  --radius-md: 4px;
}
```

### Usage rules
- Always prefer semantic variables (`--background`, `--card`, `--primary`, `--accent`, `--neon-fuchsia`, `--neon-cyan`).
- Use `--warning` / `--destructive` only for state messages and error banners.
- Use glow variables only for interactive components and neon highlights, not for body copy.
- Use `--card` for panels and surfaces, and keep screen backgrounds darker than cards.

---

## TYPOGRAPHY

### Font stack

| Variable | Font | Usage |
|---|---|---|
| `--font-display` | `Orbitron` | Headings, section titles, status badges, branded text |
| `--font-tech` | `Rajdhani` | Form labels, UI labels, utility bars, badge text |
| `--font-mono-data` | `JetBrains Mono` | Code-style labels, terminal output, debug panels |

Do not use generic sans-serif for core UI text. Use the established system fonts only.

### Google Fonts import (in `index.html`)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link
  href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
  rel="stylesheet"
>
```

### Tailwind font config (`tailwind.config.js`)
```typescript
fontFamily: {
  display: ['Orbitron', 'sans-serif'],
  tech: ['Rajdhani', 'sans-serif'],
  'mono-data': ['JetBrains Mono', 'monospace'],
}
```

### Size rules
- `Orbitron` — use for display text, headings and title bars. Keep letter spacing wide.
- `Rajdhani` — use for labels, buttons and status text. Text should be uppercase where possible.
- `JetBrains Mono` — use for data, counters, code-like status output and tooltip text.

---

## TAILWIND CONFIG EXTENSIONS

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        warning: 'var(--warning)',
        'warning-foreground': 'var(--warning-foreground)',
        'bg-deep': 'var(--clr-bg-deep)',
        'bg-screen': 'var(--clr-bg-screen)',
        'bg-panel': 'var(--clr-bg-panel)',
        'bezel': 'var(--clr-bezel)',
        'bezel-hi': 'var(--clr-bezel-hi)',
        'screw': 'var(--clr-screw)',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        tech: ['Rajdhani', 'sans-serif'],
        'mono-data': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-text': 'var(--glow-text)',
        'glow-strong': 'var(--glow-strong)',
        'glow-subtle': 'var(--glow-subtle)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
      },
    },
  },
} satisfies Config
```

---

## FRAMER MOTION ANIMATION CONSTANTS

Defined in `src/shared/lib/motion.ts`. Import from here — never define animations inline.

```typescript
// src/shared/lib/motion.ts
import type { Variants, Transition } from 'framer-motion'

// Page / section entrance
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
}

// Screen power-on
export const crtOn: Variants = {
  initial: { scaleY: 0.01, opacity: 0 },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
  },
}

// List containers — apply to the wrapping ul/div
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
}

// List items — apply to each li/card
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// Alerts and error states
export const glitch: Variants = {
  animate: {
    x: [0, -2, 2, -1, 1, 0],
    opacity: [1, 0.8, 1, 0.9, 1],
    transition: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
}

// Decorative CRT scanline sweep
export const scanlineSweep = {
  animate: { y: ['-100%', '100%'] },
  transition: { duration: 3, repeat: Infinity, ease: 'linear' } as Transition,
}

// Cursor blink (for terminal cursors)
export const cursorBlink: Variants = {
  animate: {
    opacity: [1, 0, 1],
    transition: { duration: 1, repeat: Infinity, ease: 'steps(1)' },
  },
}
```

### Animation rules
- Every page mount → `crtOn` or `fadeIn`. No instant renders.
- Lists → `staggerContainer` + `staggerItem`. Max 0.05s stagger delay.
- Alerts / status banners → `glitch`.
- Decorative motion should remain subtle and under 400ms, except slow ambient scanline sweeps.
- Always respect `useReducedMotion()`.

---

## CYBERPUNK BACKGROUND & SCANLINES

The project uses a blurred neon wave background plus scanline overlay.

```css
/* src/app/styles/globals.css */
.scanlines::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    oklch(0.85 0.22 200 / 0.04) 2px,
    oklch(0.85 0.22 200 / 0.04) 3px
  );
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

Use these classes for the ambient screen effect:
- `wave-blob`, `wave-blob-1`..`wave-blob-4` for floating neon blobs
- `grid-overlay` for subtle techno grids
- `scanlines` for CRT texture
- `text-glow-fuchsia`, `text-glow-cyan`, `text-glow-yellow` for glowing headings and badges

---

## DEVICE LAYOUT HIERARCHY

```
DeviceFrame          ← outer bezel, screws, physical housing
└── ScreenSurface    ← CRT wrapper: scanlines, glow, border
    └── [page content]
        └── StatusBar  ← always pinned at top: camp name, server time, signal
```

### DeviceFrame notes
- Device is still wrist-mounted, but the screen surface is a neon terminal.
- Bezel uses dark charcoal with subtle edge highlights.
- Corners and screws are decorative, not interactive.
- On mobile: device fills viewport. On desktop: center inside a framed terminal shape.

---

## RECHARTS THEME

Apply neon/cyberpunk styling to charts in `features/dashboard/`:

```typescript
export const CHART_THEME = {
  style: { background: 'transparent' },
}

export const CHART_COLORS = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  muted: 'var(--muted)',
  grid: 'var(--muted-foreground)',
  text: 'var(--foreground)',
}

export const GRID_PROPS = {
  stroke: 'var(--muted-foreground)',
  strokeDasharray: '3 3',
}

export const AXIS_PROPS = {
  tick: { fill: 'var(--foreground)', fontFamily: 'var(--font-mono-data)', fontSize: 11 },
  axisLine: { stroke: 'var(--muted-foreground)' },
  tickLine: false,
}
```

---

## SHADCN CUSTOMIZATION NOTES

When using Shadcn components:
1. Background → `--card` or `--background`
2. Border → `var(--border)` or `--border-panel`
3. Text → `--foreground`
4. Focus glow → `--glow-strong` or `--glow-fuchsia`
5. Border radius → `--radius-md` (2–4px only)
6. Font → `display` for labels and headers, `tech` for buttons/forms, `mono-data` for data text

No large rounded corners. No white or pastel fills. Use neon accents sparingly and only for emphasis.

## FRAMER MOTION ANIMATION CONSTANTS

Defined in `src/shared/lib/motion.ts`. Import from here — never define animations inline.

```typescript
// src/shared/lib/motion.ts
import type { Variants, Transition } from 'framer-motion'

// Page / section entrance
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
}

// CRT power-on (use on every page mount)
export const crtOn: Variants = {
  initial: { scaleY: 0.01, opacity: 0 },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
  },
}

// List containers — apply to the wrapping ul/div
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
}

// List items — apply to each li/card
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// Alerts and error states
export const glitch: Variants = {
  animate: {
    x: [0, -2, 2, -1, 1, 0],
    opacity: [1, 0.8, 1, 0.9, 1],
    transition: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
}

// Decorative CRT scanline sweep
export const scanlineSweep = {
  animate: { y: ['-100%', '100%'] },
  transition: { duration: 3, repeat: Infinity, ease: 'linear' } as Transition,
}

// Cursor blink (for terminal cursors)
export const cursorBlink: Variants = {
  animate: {
    opacity: [1, 0, 1],
    transition: { duration: 1, repeat: Infinity, ease: 'steps(1)' },
  },
}
```

### Animation rules
- Every page mount → `crtOn` or `fadeIn`. No instant renders.
- Lists → `staggerContainer` + `staggerItem`. Max 0.05s stagger delay.
- Errors / alerts → `glitch`.
- All animations under 400ms except decorative scanlines.
- Always wrap in `useReducedMotion()` — check it and skip animations if true.
- No particle systems. No physics engines. Performance first.

```typescript
// Pattern for respecting reduced motion
import { useReducedMotion } from 'framer-motion'
import { crtOn } from '@/shared/lib/motion'

export function SomePage() {
  const reduce = useReducedMotion()
  const variant = reduce ? {} : crtOn
  return <motion.div variants={variant} initial="initial" animate="animate">...</motion.div>
}
```

---

## CRT SCANLINES EFFECT

```css
/* src/app/styles/scanlines.css */
.crt-screen {
  position: relative;
  overflow: hidden;
}

.crt-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.04) 2px,
    rgba(0, 0, 0, 0.04) 4px
  );
  pointer-events: none;
  z-index: 10;
}
```

---

## DEVICE LAYOUT HIERARCHY

```
DeviceFrame          ← outer bezel, screws, physical housing
└── ScreenSurface    ← CRT wrapper: scanlines, glow, border
    └── [page content]
        └── StatusBar  ← always pinned at top: camp name, server time, signal
```

### DeviceFrame notes
- Fixed aspect ratio — designed to look like a wrist-worn device on any screen size
- Bezel uses `--clr-bezel` with subtle highlight on top edge (`--clr-bezel-hi`)
- Corner screws are decorative `div` elements with `--clr-screw` fill
- On mobile: device takes full viewport. On desktop: centered with device proportions.

---

## RECHARTS THEME

Apply to all charts in `features/dashboard/`:

```typescript
// Base props to spread on every Recharts chart
export const CHART_THEME = {
  style: { background: 'transparent' },
}

export const CHART_COLORS = {
  primary:   'var(--clr-green-bright)',
  secondary: 'var(--clr-green-base)',
  muted:     'var(--clr-green-mid)',
  grid:      'var(--clr-green-dim)',
  text:      'var(--clr-green-base)',
}

// CartesianGrid props
export const GRID_PROPS = {
  stroke: 'var(--clr-green-dim)',
  strokeDasharray: '3 3',
}

// Axis props
export const AXIS_PROPS = {
  tick: { fill: 'var(--clr-green-base)', fontFamily: 'var(--font-mono)', fontSize: 11 },
  axisLine: { stroke: 'var(--clr-green-mid)' },
  tickLine: false,
}
```

---

## SHADCN CUSTOMIZATION NOTES

Shadcn components must be restyled to match the device aesthetic. When adding a Shadcn component:

1. Override background → `--clr-bg-panel`
2. Override border → `--clr-border-default`
3. Override text → `--clr-text-primary`
4. Override focus ring → `--clr-green-bright` glow
5. Override radius → `--radius-md` (2–4px max, never large rounded corners)
6. Font → always `--font-mono` for inputs, `--font-display` for labels

No rounded-lg. No white backgrounds. No colored accent fills — only green ramp.
