# DESIGN_SYSTEM.md — Gestión del Fin · Visual & Animation Context

> Load this when working on: UI components, styles, layouts, animations, Tailwind classes.

---

## VISUAL CONCEPT

The entire UI lives inside a **wrist-mounted Cold War military terminal** — ruggedized hardware the player physically wears. Think PIP-Boy × Soviet ELORG terminal × NATO field computer. The device bezel (screws, wear marks, housing) is always visible. The UI is the screen *inside* that device.

**Three pillars:**
1. Monochromatic phosphor green — one color family, multiple luminosity levels
2. Pixelated bitmap typography — all fonts are monospace or pixel-rendered
3. Military density — no decoration, every pixel serves information

---

## CSS DESIGN TOKENS

Defined in `src/app/styles/tokens.css`. Use these variables everywhere — never hardcode hex values in components.

```css
:root {
  /* PHOSPHOR GREEN RAMP */
  --clr-bg-deep:      #010802;   /* deepest black — device interior shadow */
  --clr-bg-screen:    #020f04;   /* CRT screen background */
  --clr-bg-panel:     #041508;   /* elevated surface: cards, panels */
  --clr-bg-hover:     #071f0b;   /* hover state background */

  --clr-green-dim:    #1a3d1f;   /* disabled / inactive */
  --clr-green-mid:    #2d6b35;   /* secondary text, borders, dividers */
  --clr-green-base:   #3d8b46;   /* body text, UI labels */
  --clr-green-bright: #4dbd57;   /* primary text, active elements */
  --clr-green-hi:     #6de87a;   /* headings, emphasis, data values */
  --clr-green-max:    #a0f5a8;   /* critical alerts, system messages */
  --clr-green-glow:   #c8ffce;   /* cursor glow, blink states */

  /* SEMANTIC ALIASES */
  --clr-text-primary:   var(--clr-green-bright);
  --clr-text-secondary: var(--clr-green-base);
  --clr-text-muted:     var(--clr-green-mid);
  --clr-text-disabled:  var(--clr-green-dim);
  --clr-text-value:     var(--clr-green-hi);
  --clr-text-alert:     var(--clr-green-max);

  --clr-border-default: var(--clr-green-mid);
  --clr-border-active:  var(--clr-green-bright);
  --clr-border-subtle:  var(--clr-green-dim);

  /* FUNCTIONAL STATES (still green-tinted) */
  --clr-danger:      #8b1a1a;    /* irreversible / destructive actions */
  --clr-danger-text: #ff4444;
  --clr-warn:        #3d3000;
  --clr-warn-text:   #c8a800;   /* low resources, caution */
  --clr-ok:          var(--clr-green-bright);

  /* DEVICE CHROME */
  --clr-bezel:    #1a1a18;       /* outer device body */
  --clr-bezel-hi: #2e2e2a;       /* bezel highlight edge */
  --clr-screw:    #111110;       /* screw / rivet details */

  /* GLOW EFFECTS */
  --glow-text:   0 0 8px rgba(77, 189, 87, 0.6);
  --glow-strong: 0 0 16px rgba(109, 232, 122, 0.5);
  --glow-subtle: 0 0 4px rgba(61, 139, 70, 0.3);

  /* SPACING SCALE */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* BORDERS */
  --border-thin:  1px solid var(--clr-border-default);
  --border-panel: 2px solid var(--clr-green-mid);
  --radius-sm: 2px;
  --radius-md: 4px;
}
```

---

## TYPOGRAPHY

### Font stack

| Variable | Font | Usage |
|---|---|---|
| `--font-display` | `Press Start 2P` | Headings, nav labels, section titles, status badges |
| `--font-mono` | `Share Tech Mono` | Body text, descriptions, form labels, table data |
| `--font-system` | `VT323` | Terminal output, AI analysis text, logs, console messages |

Never use sans-serif. Everything is monospace or pixel.

### Google Fonts import (in `index.html`)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link
  href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&family=VT323&display=swap"
  rel="stylesheet"
>
```

### Tailwind font config (`tailwind.config.ts`)
```typescript
fontFamily: {
  display: ['"Press Start 2P"', 'monospace'],
  mono:    ['"Share Tech Mono"', 'monospace'],
  system:  ['VT323', 'monospace'],
}
```

### Size rules
- `Press Start 2P` — 8px (xs), 10px (sm), 12px (md), 16px (lg). Always uppercase.
- `Share Tech Mono` — 12px (sm), 14px (base), 16px (lg).
- `VT323` — minimum 16px (renders poorly below that).

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
        'bg-deep':      'var(--clr-bg-deep)',
        'bg-screen':    'var(--clr-bg-screen)',
        'bg-panel':     'var(--clr-bg-panel)',
        'green-dim':    'var(--clr-green-dim)',
        'green-mid':    'var(--clr-green-mid)',
        'green-base':   'var(--clr-green-base)',
        'green-bright': 'var(--clr-green-bright)',
        'green-hi':     'var(--clr-green-hi)',
        'green-max':    'var(--clr-green-max)',
        'danger':       'var(--clr-danger)',
        'danger-text':  'var(--clr-danger-text)',
        'warn-text':    'var(--clr-warn-text)',
        'bezel':        'var(--clr-bezel)',
      },
      fontFamily: {
        display: ['"Press Start 2P"', 'monospace'],
        mono:    ['"Share Tech Mono"', 'monospace'],
        system:  ['VT323', 'monospace'],
      },
      boxShadow: {
        'glow-text':   'var(--glow-text)',
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
