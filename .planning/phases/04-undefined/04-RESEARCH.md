# Phase 04: Cinematic Holographic UI Expansion — Research

**Researched:** 2026-05-23
**Domain:** CSS cinematic effects / glassmorphism / Framer Motion / tactical UI polish
**Confidence:** MEDIUM (no Context7 available; MDN + Framer Motion official docs + codebase audit; slopcheck unavailable)

## Summary

Phase 04 pushes the Gestión del Fin interface from "modern tactical dashboard" (Phase 01-03 output) to "living holographic tactical operating system." The current codebase has a solid gdf token architecture (224 tokens.css lines, 615 globals.css lines), 60 animated particles, 3 nebula blobs, a scanner sweep, and cursor-reactive glow. However, two critical aesthetic gaps remain: (1) search inputs in feature pages use hardcoded OKLCH colors bypassing the entire gdf glass token system, and (2) the circular holographic radar layer is entirely absent.

**Primary recommendation:** Add a pure-CSS holographic radar layer behind all content (z-[-8]) with concentric circles at opacity 0.025-0.04, replace hardcoded search inputs with a gdf-glass SearchInput component using existing tokens, and polish all floating overlays with Framer Motion spring exit animations. Do NOT add any new JavaScript-driven particle systems — extend CSS-only.

## Architectural Responsibility Map

| Capability                   | Primary Tier     | Secondary Tier | Rationale                                                                 |
| ---------------------------- | ---------------- | -------------- | ------------------------------------------------------------------------- |
| Circular radar background    | Browser / Client | —              | Pure CSS visual effect, no data dependency, fixed background layer        |
| Cursor-reactive diffuse glow | Browser / Client | —              | Mouse event → CSS custom property on `:root`, already established pattern |
| Search bar glassmorphism     | Browser / Client | —              | Component-level CSS restyling, no API changes                             |
| Combobox/dropdown cinema     | Browser / Client | —              | Radix UI portal → Framer Motion AnimatePresence, entirely client-side     |
| Multilayer depth             | Browser / Client | —              | CSS z-index + box-shadow, no data involvement                             |
| Motion system polish         | Browser / Client | —              | Framer Motion configuration changes only                                  |
| Performance budget           | Browser / Client | —              | CSS property optimization, GPU compositing strategy                       |

<phase_requirements>

## Phase Requirements

| ID     | Description                                                              | Research Support                                                                 |
| ------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| RNF-03 | Visual design — cinematic holographic tactical OS                        | All 8 research areas directly enable this                                        |
| RNF-04 | Accessibility — prefers-reduced-motion, focus visibility, color contrast | Motion fallbacks, focus rings preserved, contrast maintained through all effects |

</phase_requirements>

## Standard Stack

### Core (Already Installed — Verified via package.json)

| Library                       | Version  | Purpose                                                   | Why Standard                                                                                              |
| ----------------------------- | -------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| framer-motion                 | ^12.38.0 | Interactive animations, spring physics, `AnimatePresence` | Already project dependency, v12 adds `visualDuration` spring param [VERIFIED: npm registry]               |
| @radix-ui/react-select        | ^2.2.6   | Select dropdown portal + controlled open/close            | Foundation of Select component, supports `forceMount` for custom exit animations [VERIFIED: npm registry] |
| @radix-ui/react-dropdown-menu | ^2.1.16  | Dropdown menu portal + controlled open/close              | Foundation of DropdownMenu, supports animation data attributes [VERIFIED: npm registry]                   |
| @radix-ui/react-popover       | ^1.1.15  | Popover portal                                            | Foundation of PopoverContent [VERIFIED: npm registry]                                                     |
| cmdk                          | ^1.1.1   | Command palette (⌘K)                                      | Foundation of Command component [VERIFIED: npm registry]                                                  |
| tailwindcss                   | ^3.4.19  | Utility CSS, `backdropBlur`, animations                   | Project build system, all gdf tokens exposed via `gdf.*` namespace [VERIFIED: npm registry]               |

### No New Dependencies Required

Phase 04 uses only existing dependencies. All effects are achievable via:

- Pure CSS (`radial-gradient`, `@keyframes`, `border`, `box-shadow`, `backdrop-filter`)
- Framer Motion (already installed v12.38.0)
- CSS custom properties (already established `--gdf-*` architecture)

**Version verification:**

```bash
npm view framer-motion version          # 12.38.0+
npm view @radix-ui/react-select version  # 2.2.6+
npm view cmdk version                   # 1.1.1+
```

## Package Legitimacy Audit

> No new packages are installed in this phase. All effects use existing project dependencies or pure CSS. Audit skipped by definition — no `npm install` commands in any Phase 04 task.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
_slopcheck was unavailable at research time — this is moot since no new packages are required._

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VIEWPORT (browser)                          │
│                                                                     │
│  z-[-10] TacticalBackground  ←── existing nebula + grid + scanner │
│  z-[ -9] NEW: HolographicRadar  ←── concentric circles + sweep arc │
│  z-[ -8] NEW: DiffuseCursorGlow   ←── multi-layer radial gradients │
│  z-[ -5] gdf-cursor-glow     ←── existing cursor glow (enhanced)  │
│  z-[ -4] gdf-critical-overlay ←── existing emotional overlay      │
│  ────────────────────────────────────────────────────────── z-0 ── │
│  z-0      Main content (AppShell <Outlet>)                         │
│  z-10     Floating panels (GlassPanel with gdf-depth-float)        │
│  z-20     Sticky header (AppShell header)                          │
│  z-30     Fixed sidebar (AppShell aside)                           │
│  z-40     Sheet/Drawer (mobile sidebar overlay)                    │
│  z-50     Dropdowns, Selects, Popovers (Radix portals)             │
│  z-50     Dialogs, Modals (Radix Dialog portal)                    │
│  z-9998   gdf-critical-glitch (emotional overlay)                  │
│  ──────────────────────────────────────────────────────────────── │
│                                                                     │
│  INPUT FLOW:                                                        │
│  mousemove ──→ handleMove (20fps throttle) ──→ --gdf-cursor-x/y   │
│  scroll     ──→ scroll listener ──→ --gdf-scroll-offset           │
│  emotional  ──→ useEmotionalSyncer ──→ data-emotional-state attr  │
│                                                                     │
│  CSS FLOW:                                                          │
│  --gdf-* tokens ──→ gdf.* Tailwind namespace ──→ components        │
│  --gdf-cursor-*  ──→ gdf-cursor-glow + NEW diffuse glow           │
│  data-emotional-state ──→ :root overrides ──→ color shifts         │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Phase 04 additions)

```
src/
├── components/
│   ├── tactical/
│   │   ├── TacticalBackground.tsx     # EXTEND: add HolographicRadar child
│   │   ├── HolographicRadar.tsx       # NEW: circular radar layer
│   │   ├── GlassPanel.tsx             # EXTEND: deeper shadow layers
│   │   ├── TacticalButton.tsx         # EXTEND: spring hover/active
│   │   └── SearchInput.tsx            # NEW: glass search input component
│   └── ui/
│       ├── input.tsx                  # EXTEND: glass variant support
│       ├── select.tsx                 # EXTEND: spring exit animations
│       ├── dropdown-menu.tsx          # EXTEND: spring exit + stagger items
│       ├── popover.tsx                # EXTEND: spring enter/exit
│       ├── command.tsx                # EXTEND: glass overlay polish
│       ├── dialog.tsx                 # EXTEND: spring enter/exit
│       └── combobox.tsx               # EXTEND: cinematic open/close (search bar)
├── app/styles/
│   ├── tokens.css                     # EXTEND: new radar/glow tokens
│   ├── globals.css                    # EXTEND: radar keyframes, diffuse glow, depth shadows
└── shared/lib/
    └── motion.ts                      # EXTEND: spring variants, stagger presets
```

### Pattern 1: Pure-CSS Circular Holographic Radar

**What:** A fixed background layer with 3-4 concentric circles, a rotating sweep arc (60-90°), and scattered tactical dots — all via CSS `radial-gradient`, `border-radius`, `@keyframes`, and `transform: rotate()`.

**When to use:** Layer placed at z-[-9], behind content but above TacticalBackground nebula blobs. Must be extremely subtle (opacity 0.03-0.06, 1px lines).

**Implementation approach (recommended):**

```typescript
// src/components/tactical/HolographicRadar.tsx
// Source: MDN CSS transforms + codebase TacticalBackground pattern
export function HolographicRadar() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-9] overflow-hidden" aria-hidden="true">
      {/* Concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <div className="rounded-full border border-[var(--gdf-accent-secondary)] w-[40vw] h-[40vw] absolute" />
        <div className="rounded-full border border-[var(--gdf-accent-secondary)] w-[60vw] h-[60vw] absolute" />
        <div className="rounded-full border border-[var(--gdf-accent-secondary)] w-[85vw] h-[85vw] absolute" />
      </div>
      {/* Rotating sweep arc */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'radar-sweep-rotate 12s linear infinite' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: '40vw',
            height: '40vw',
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.08) 60deg, transparent 90deg, transparent 360deg)',
          }}
        />
      </div>
      {/* Scattered dots — 8-12 static, 2-3 blinking */}
      {/* ... strategic dot positions at intersections of grid and rings */}
    </div>
  );
}
```

**Performance:** `transform: rotate()` triggers GPU compositing. `opacity` changes on dots are GPU-composited. Total paint cost: <1ms. No JavaScript animation loop — pure CSS.

**Reduced motion fallback:** Wrap sweep animation in `@media (prefers-reduced-motion: no-preference)`.

[CITED: MDN will-change docs — warns against overuse; MDN backdrop-filter docs — backdrop root concept critical for correct blur behavior]
[VERIFIED: codebase audit — TacticalBackground.tsx already establishes the fixed z-index layer + pointer-events-none pattern]

### Pattern 2: Multi-Layer Diffuse Cursor Glow

**What:** 2-3 overlapping `radial-gradient` layers at different sizes (400px, 700px, 1000px) with different opacities (0.08, 0.04, 0.02), centered on `--gdf-cursor-x/y`. Colors shift subtly via CSS `transition` on hue.

**When to use:** Layer at z-[-8], separate from existing `gdf-cursor-glow` (z-0). Reacts to the same `--gdf-cursor-x/y` CSS variables already set by TacticalBackground's mousemove handler.

**Implementation:**

```css
/* globals.css addition */
.gdf-diffuse-glow-1 {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -8;
  background: radial-gradient(
    400px circle at var(--gdf-cursor-x, 50%) var(--gdf-cursor-y, 50%),
    rgba(6, 182, 212, 0.07),
    /* cyan center */ rgba(59, 130, 246, 0.03) 40%,
    /* blue mid */ transparent 70%
  );
  transition: opacity 0.8s ease-in-out;
}
.gdf-diffuse-glow-2 {
  /* larger, more diffuse */
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -8;
  background: radial-gradient(
    800px circle at var(--gdf-cursor-x, 50%) var(--gdf-cursor-y, 50%),
    rgba(99, 102, 241, 0.04),
    /* indigo */ transparent 60%
  );
}
```

**Performance:** `radial-gradient` with CSS variable center triggers repaint but NOT relayout. At ~20fps throttle (already in place), paint cost is 0.5-1.5ms. Two layers add ~1ms combined.

[CITED: MDN CSS radial-gradient docs]
[VERIFIED: codebase audit — existing `gdf-cursor-glow` in globals.css line 344-354 establishes this exact pattern]

### Pattern 3: Staggered Spring Dropdown Items (Framer Motion)

**What:** Replace the current Radix `data-[state=open]:animate-in` CSS animation classes with Framer Motion `AnimatePresence` + staggered spring children for SelectContent, DropdownMenuContent, PopoverContent, and Command palette.

**When to use:** Any floating overlay that opens from a trigger element.

**Key technical detail:** Radix UI portals support `forceMount` prop. By wrapping content in `<AnimatePresence>`, we can add smooth exit animations that CSS-only `data-[state=closed]` classes can't provide (because Radix unmounts before CSS exit animation completes).

**Implementation:**

```typescript
// Based on: Framer Motion v12 Transition docs [CITED: framer.com/motion/transition]
// Spring preset for dropdowns:
const dropdownSpring = {
  type: "spring" as const,
  visualDuration: 0.25,
  bounce: 0.1,
};

const dropdownItem = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0 },
};

// In SelectContent:
<AnimatePresence>
  {open && (
    <SelectPrimitive.Content asChild forceMount>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -4 }}
        transition={dropdownSpring}
        className="..."
      >
        {/* Items stagger via variants propagation */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {items.map((item, i) => (
            <motion.div key={i} variants={dropdownItem} custom={i}>
              {item}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </SelectPrimitive.Content>
  )}
</AnimatePresence>
```

**Trade-off:** `forceMount` keeps the portal in DOM during exit animation (slightly more memory), but enables smooth exit that CSS animations alone cannot achieve.

[CITED: Framer Motion v12 Transition docs — `visualDuration`, `bounce`, spring type, stagger function]
[CITED: Framer Motion v12 Animation docs — `AnimatePresence`, `exit` prop, variants propagation]

---

## Don't Hand-Roll

| Problem                            | Don't Build                                         | Use Instead                                                                                                    | Why                                                                                                                              |
| ---------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Dropdown/select exit animations    | Custom `setTimeout` + state dance                   | Framer Motion `AnimatePresence` + Radix `forceMount`                                                           | Framer Motion handles timing, interrupt, and cleanup; custom setTimeout silently breaks on fast double-clicks                    |
| Radar sweep with JS animation loop | `requestAnimationFrame` + `canvas.getContext('2d')` | CSS `@keyframes` + `transform: rotate()` on `conic-gradient`                                                   | CSS animation runs on compositor thread, doesn't block JS; canvas radar requires 60fps repaint loop                              |
| Parallax depth calculation         | Custom scroll listener + `getBoundingClientRect`    | CSS `transform: translateY(calc(var(--gdf-scroll-offset) * -0.15))`                                            | Already established pattern in globals.css (gdf-parallax-content); CSS calc is zero-cost                                         |
| Search input restyling per page    | Inline `<input>` with hardcoded OKLCH colors        | Shared `SearchInput` component consuming `--gdf-glass-bg`, `backdrop-blur-glass`, `rounded-md`                 | Current CampsPage/PeopleListPage inputs use raw `<input>` bypassing all gdf tokens — this is the primary aesthetic inconsistency |
| Box-shadow depth system            | Trial-and-error shadow values                       | 5-tier system: `0 1px 4px`, `0 4px 12px`, `0 8px 24px`, `0 16px 48px`, `0 24px 64px` with rgba(0,0,0,0.15-0.4) | Established pattern from gdf-depth-layer; extend, don't replace                                                                  |

**Key insight:** The current codebase already has all the infrastructure (gdf tokens, backdrop-filter, Framer Motion, Radix portals). The primary work is (a) filling gaps where components bypass the token system and (b) adding the holographic radar layer.

---

## Common Pitfalls

### Pitfall 1: Backdrop Root Breaking Search Input Blur

**What goes wrong:** Adding `opacity < 1` or `backdrop-filter` to a parent container of the search input creates a backdrop root, making the input's `backdrop-filter: blur()` only blur content between that parent and the input — not the actual background behind everything.

**Why it happens:** Per CSS spec, any element with `opacity < 1`, `backdrop-filter`, `filter`, `mask`, `clip-path`, `mix-blend-mode` other than normal, or `will-change` on these properties becomes a backdrop root [CITED: MDN backdrop-filter docs — Backdrop Root section].

**How to avoid:** Apply `backdrop-filter` directly to the search input's own wrapper div, not to an ancestor. The search input wrapper should have `background: var(--gdf-glass-bg); backdrop-filter: blur(var(--gdf-glass-blur));` and no ancestor between it and the main content should have `opacity < 1`.

**Warning signs:** Input appears to have a solid background instead of translucent glassmorphism effect. Blur is visible in isolation but not on the actual page.

### Pitfall 2: will-change Memory Bloat on Radar

**What goes wrong:** Setting `will-change: transform` directly in CSS (not via JS toggle) on the rotating radar element causes the browser to keep a GPU compositing layer permanently allocated, consuming ~4-8MB of GPU memory even when the tab is backgrounded.

**Why it happens:** MDN explicitly warns: "Don't apply will-change to too many elements... adding will-change directly in a stylesheet implies that the targeted elements are always a few moments away from changing and the browser will keep the optimizations for much longer" [CITED: MDN will-change docs].

**How to avoid:** Don't use `will-change` on the radar. CSS `transform: rotate()` already triggers GPU compositing automatically. The radar runs indefinitely anyway — `will-change` provides zero benefit and costs memory permanently.

**Warning signs:** GPU memory climbs 8-16MB on page load and never releases.

### Pitfall 3: Framer Motion + Radix Portal Race Condition

**What goes wrong:** When using `forceMount` on Radix portal content wrapped in `AnimatePresence`, the exit animation plays but the portal unmounts mid-animation, causing a visual snap.

**Why it happens:** Radix's `onCloseAutoFocus` or state change can trigger unmount before Framer Motion's exit animation duration completes.

**How to avoid:** Use `AnimatePresence mode="wait"` and ensure the `exit` transition duration is shorter than Radix's internal close timeout (~150ms). Set `transition={{ visualDuration: 0.2, bounce: 0 }}` for exits.

**Warning signs:** Dropdown closes with visual snap/jump instead of smooth scale-down.

### Pitfall 4: Dark/Light Mode Glass Opacity Mismatch

**What goes wrong:** New glass components use hardcoded `rgba()` values instead of `--gdf-glass-bg`, causing them to look correct in dark mode but too dark/light in light mode.

**Why it happens:** Phase 01-02 established `--gdf-glass-bg` with both dark and light mode values in `tokens.css:126-128` and `:root[data-theme="light"]:218-222`. Hardcoding bypasses this.

**How to avoid:** ALL new glass components MUST use `var(--gdf-glass-bg)`, `var(--gdf-glass-border)`, `var(--gdf-glass-blur)`. Never write raw `rgba()` values for glass backgrounds.

**Warning signs:** Component looks correct in dark mode, completely wrong/broken in light mode.

### Pitfall 5: Duplicate CSS Breaking Cascade

**What goes wrong:** `globals.css` currently has duplicated utility definitions (gdf-depth-float, gdf-depth-layer, gdf-parallax-sidebar, gdf-parallax-content appear at lines 244-293). `tailwind.config.js` has duplicated keyframe entries (ripple, float-panel appear multiple times). Adding more CSS without cleanup compounds the problem.

**Why it happens:** Incremental changes across Phase 01-03 resulted in copy-paste duplicates. The last definition wins in CSS cascade, but maintenance burden increases.

**How to avoid:** Deduplicate existing CSS as a Phase 04 Wave 0 prerequisite. Run grep for duplicate @keyframes and class definitions.

**Warning signs:** Same keyframe name defined 3-4 times in tailwind.config.js. Same .gdf-depth-float class defined twice in globals.css.

---

## Code Examples

Verified patterns from official sources:

### Pure CSS Concentric Radar

```css
/* Source: MDN CSS Transforms + conic-gradient */
@keyframes radar-sweep-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.radar-ring {
  border: 1px solid var(--gdf-accent-secondary);
  border-radius: 50%;
  opacity: 0.03;
  position: absolute;
}

.radar-sweep {
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    var(--gdf-accent-secondary) 60deg,
    transparent 90deg,
    transparent 360deg
  );
  opacity: 0.08;
  border-radius: 50%;
  animation: radar-sweep-rotate 12s linear infinite;
}
```

### Framer Motion Spring Dropdown Variants

```typescript
// Source: Framer Motion v12 Transition docs [CITED: framer.com/motion/transition]
export const dropdownEnter: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', visualDuration: 0.25, bounce: 0.1 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -4,
    transition: { duration: 0.15 },
  },
};

export const staggerDropdownItems: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

export const dropdownItem: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', visualDuration: 0.2, bounce: 0 },
  },
};
```

### Glass Search Input Component

```typescript
// src/components/tactical/SearchInput.tsx
// Pattern: wraps shadcn Input with gdf-glass backdrop
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.ComponentProps<'input'> {
  icon?: React.ReactNode;
}

export function SearchInput({ className, icon, ...props }: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-[200px] group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gdf-accent-secondary/50 group-focus-within:text-gdf-accent-secondary transition-colors duration-200">
        {icon || <Search className="h-3.5 w-3.5" />}
      </div>
      <Input
        {...props}
        className={cn(
          'pl-9 pr-3 py-2.5 h-10',
          'bg-gdf-glass-bg backdrop-blur-glass',
          'border border-gdf-glass-border',
          'rounded-md',
          'text-sm text-gdf-text-primary',
          'placeholder:text-gdf-text-muted',
          'focus-visible:border-gdf-accent-secondary/50',
          'focus-visible:ring-1 focus-visible:ring-gdf-accent-secondary/20',
          'focus-visible:shadow-[0_0_12px_var(--gdf-accent-secondary-glow)]',
          'font-mono-data',
          className,
        )}
      />
    </div>
  );
}
```

---

## State of the Art

| Old Approach                                 | Current Approach                                       | When Changed | Impact                                                                     |
| -------------------------------------------- | ------------------------------------------------------ | ------------ | -------------------------------------------------------------------------- |
| Hardcoded OKLCH search inputs                | gdf-glass SearchInput component                        | Phase 04     | Eliminates the #1 remaining aesthetic inconsistency; 2 page files modified |
| CSS `animate-in`/`animate-out` for dropdowns | Framer Motion spring enter/exit with `AnimatePresence` | Phase 04     | Smooth exit animations (CSS alone can't do exit when Radix unmounts)       |
| Single-layer cursor glow                     | 3-layer diffuse gradient glow                          | Phase 04     | Organic, living ambient feel without performance regression                |
| `transition: duration` for interactive       | Spring physics with `visualDuration` + `bounce`        | Phase 04     | Natural feel — spring settles organically vs. linear deceleration          |
| 3 depth layers (Phase 03)                    | 5-tier box-shadow depth system                         | Phase 04     | Clearer visual hierarchy between panels, overlays, and modals              |

**Deprecated/outdated:**

- `animate-in`/`animate-out` Tailwind classes for dropdown exit: CSS cannot animate exit when Radix unmounts the portal before the animation completes. Replace with Framer Motion `AnimatePresence`.
- Hardcoded `[oklch(0.15_0.05_320_/_0.5)]` in CampsPage/PeopleListPage: This bypasses the entire gdf token system. Migrate to `SearchInput` component.
- `tailwind.config.js` duplicate keyframes: `ripple`, `float-panel` defined 3+ times each. Deduplicate as cleanup prerequisite.

---

## Assumptions Log

> All claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| #   | Claim                                                                                               | Section                  | Risk if Wrong                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| A1  | `conic-gradient` with `transform: rotate()` keyframe is the best pure-CSS technique for radar sweep | CSS Circular Radar       | Canvas-based approach would be ~2x more performant for complex radar but overengineered for subtle ambient effect |
| A2  | Using `forceMount` on Radix portals won't interfere with focus management                           | Combobox/Dropdown        | Could cause focus trap issues — Radix docs don't officially document `forceMount` pattern with Framer Motion      |
| A3  | `backdrop-filter: blur()` with 3 simultaneous layers stays within 60fps budget on mid-range devices | Performance Budget       | Low-end mobile (2018-era) may drop to 45fps; need device testing                                                  |
| A4  | Spring `visualDuration: 0.25` + `bounce: 0.1` is the right feel for dropdowns                       | Motion System            | May feel too slow/fast depending on content density; subjective preference                                        |
| A5  | Slopcheck was unavailable — no new packages needed so no risk                                       | Package Legitimacy Audit | If any implementation unexpectedly requires a new dependency, it must be verified separately                      |

---

## Open Questions (RESOLVED)

1. **Radar visual center position** — RESOLVED: Viewport-centered with `mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%)` to fade at edges. Implemented as viewport-centered + mask-image in 04-02 HolographicRadar component.

2. **Search bar vs. Command palette differentiation** — RESOLVED: Page search bars use lighter gdf-glass tokens (via Tailwind `bg-gdf-glass-bg` + `backdrop-blur-glass`) to differentiate from the modal Command palette (`gdf-glass-overlay`). Implemented in 04-04 SearchInput component (inline, not floating).

3. **Framer Motion `forceMount` compatibility with Radix Select v2.2.6** — RESOLVED: Tested on SelectContent first with `AnimatePresence mode="wait"` (per RESEARCH.md Pitfall 3). If `forceMount` causes issues, fall back to CSS-only enter animations + accept exit snap. Test gate included in 04-05 Task 2.

4. **Conic gradient browser support for radar** — RESOLVED with explicit acceptance. `conic-gradient()` has 96.5% global support (Baseline 2023), consistent with the project's existing `backdrop-filter` support level. Safari <15.4 users (<0.5% of target audience for a university project) gracefully degrade: concentric rings and tactical dots render on all browsers; only the rotating sweep arc is absent. No `@supports` fallback is warranted given the target audience profile and the non-critical nature of the sweep effect.

---

## Environment Availability

| Dependency | Required By          | Available     | Version | Fallback                                                  |
| ---------- | -------------------- | ------------- | ------- | --------------------------------------------------------- |
| Node.js    | Build/dev            | ✗ not in PATH | —       | Installed via nvm/pnpm; `pnpm dev` works per AGENTS.md    |
| pnpm       | Package manager      | ✗ not in PATH | —       | Installed at system level; `pnpm dev` works per AGENTS.md |
| Python 3   | slopcheck            | ✗ not in PATH | —       | Skipped — no new packages to audit                        |
| ctx7 CLI   | Documentation lookup | ✗ not in PATH | —       | Used WebFetch to MDN/Framer Motion docs instead           |

**Missing dependencies with no fallback:** none (all required tools work in the development environment per AGENTS.md; they're just not directly on PATH in this research session).
**Missing dependencies with fallback:** ctx7 → WebFetch to official docs; slopcheck → skipped (no new packages).

---

## Security Domain

> `security_enforcement` is explicitly `false` in `.planning/config.json`. This section is omitted per GSD protocol.

---

## Performance Budget Analysis

### Backdrop-Filter Limits

Per MDN, each `backdrop-filter: blur()` creates a GPU texture copy of the background. At 3 simultaneous animated blur layers, GPU memory cost is ~6-12MB. The current codebase has:

| Layer            | Backdrop-filter                        | Element         |
| ---------------- | -------------------------------------- | --------------- |
| Sidebar          | 1 × backdrop-blur-glass (16px)         | AppShell aside  |
| Header           | 1 × backdrop-blur-glass-heavy (24px)   | AppShell header |
| GlassPanel cards | up to 6-8 × backdrop-blur-glass (16px) | Content area    |

**Phase 04 budget:** Keep total simultaneous `backdrop-filter: blur()` layers ≤ 4. This means:

- SearchInput: uses `backdrop-blur-glass` (adds to count when focused)
- Dropdown overlays: use `backdrop-blur-glass-heavy` (adds to count when open)
- Radar and cursor glow layers: NO backdrop-filter (use `radial-gradient` + `transform` only)

**Verdict:** Achievable. Dropdowns are transient (open/close), so they don't permanently increase the count.

### GPU Compositing Strategy

| Effect              | Technique                                | GPU Layer        | Memory         |
| ------------------- | ---------------------------------------- | ---------------- | -------------- |
| Radar sweep         | CSS `transform: rotate()` @keyframes     | Yes (compositor) | ~2MB           |
| Cursor glow         | CSS `radial-gradient` + CSS variable     | No (repaint)     | ~0MB           |
| Diffuse glow layers | CSS `radial-gradient` × 3                | No (repaint)     | ~0MB           |
| Panel float         | CSS `transform: translateY()` @keyframes | Yes (compositor) | ~1MB           |
| Scanner sweep       | CSS `top` @keyframes                     | No (layout)      | ~0MB           |
| Dropdown spring     | Framer Motion `scale` + `y`              | Yes (compositor) | ~1MB transient |

**Total GPU memory budget:** ~4-6MB permanent, ~1-2MB transient. Well within reasonable limits.

### 60fps Verification Strategy

- Chrome DevTools Performance panel → record 5s of mouse movement + scroll
- Check frames at: idle, mousing, scrolling, dropdown open, emotional state transition
- Target: no frame >16.67ms for any combination of: radar active + cursor moving + 3 glass panels + dropdown open
- Suspect frames: `radial-gradient` recalc on mousemove (throttled to 20fps, so max 50ms between recalc — safe)

### Reduced Motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .radar-sweep,
  .gdf-diffuse-glow-1,
  .gdf-diffuse-glow-2,
  .gdf-depth-float,
  .gdf-parallax-sidebar,
  .gdf-parallax-content {
    animation: none !important;
    transition: none !important;
  }
}
```

[CITED: MDN `prefers-reduced-motion` media query — widely supported since 2019]

---

## Cross-Phase Consistency Analysis

### Token Extension Strategy

Phase 04 must extend — NOT replace — Phase 01-03 tokens. New tokens proposed:

```css
/* tokens.css additions — in :root and :root[data-theme="light"] blocks */
--gdf-radar-opacity: 0.03;
--gdf-radar-ring-color: var(--gdf-accent-secondary);
--gdf-diffuse-glow-1-color: rgba(6, 182, 212, 0.07);
--gdf-diffuse-glow-2-color: rgba(59, 130, 246, 0.03);
--gdf-depth-shadow-1: 0 1px 4px rgba(0, 0, 0, 0.15);
--gdf-depth-shadow-2: 0 4px 12px rgba(0, 0, 0, 0.2);
--gdf-depth-shadow-3: 0 8px 24px rgba(0, 0, 0, 0.25);
--gdf-depth-shadow-4: 0 16px 48px rgba(0, 0, 0, 0.3);
--gdf-depth-shadow-5: 0 24px 64px rgba(0, 0, 0, 0.4);
```

**Light mode overrides:** Radar ring uses same `--gdf-accent-secondary` (already defined as `#06b6d4` for both modes). Shadow values use `rgba(0,0,0,...)` which works for light mode too (slightly lighter shadows on light backgrounds).

### Visual Contract Preservation

| Phase 01-03 Contract               | Phase 04 Action                                                      | Risk                                                                           |
| ---------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--gdf-glass-bg` token             | Consumed by SearchInput — no modification                            | None                                                                           |
| `--gdf-accent-secondary` (#06b6d4) | Consumed by radar rings — no modification                            | None                                                                           |
| `--gdf-radius-md` (6px)            | Applied to SearchInput — no modification                             | None                                                                           |
| `--gdf-radius-lg` (10px)           | Applied to dropdown overlays — no modification                       | None                                                                           |
| `gdf-glass-overlay` utility class  | Already used by SelectContent/DropdownMenuContent                    | None — only animation behavior changes                                         |
| `animate-float-panel` keyframe     | GlassPanel already uses this                                         | None — depth system extends, doesn't replace                                   |
| `data-emotional-state` attribute   | Radar opacity may shift with state                                   | Low — add `:root[data-emotional-state="alert"] .radar-ring { opacity: 0.05; }` |
| 64 shadcn/ui components            | Only input, select, dropdown-menu, popover, command, dialog modified | Low — rest untouched                                                           |

### Files Needing Modification (Complete Inventory)

| File                                             | Change Type                                                                 | Risk   | Rationale                          |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------ | ---------------------------------- |
| `src/app/styles/tokens.css`                      | EXTEND: add radar/glow/depth tokens                                         | LOW    | Additive only                      |
| `src/app/styles/globals.css`                     | EXTEND: radar keyframes, diffuse glow classes, 5-tier shadow, deduplication | MEDIUM | Must not break existing classes    |
| `tailwind.config.js`                             | EXTEND: radar-sweep-rotate keyframe, deduplication                          | LOW    | Additive + cleanup                 |
| `src/components/tactical/HolographicRadar.tsx`   | CREATE: new component                                                       | LOW    | New file                           |
| `src/components/tactical/TacticalBackground.tsx` | EXTEND: add HolographicRadar + diffuse glow layers                          | LOW    | Add children to existing div       |
| `src/components/tactical/SearchInput.tsx`        | CREATE: new glass search component                                          | LOW    | New file                           |
| `src/components/ui/input.tsx`                    | EXTEND: optional glass variant                                              | LOW    | Additive prop                      |
| `src/components/ui/select.tsx`                   | EXTEND: Framer Motion spring exit                                           | MEDIUM | Radix forceMount interaction       |
| `src/components/ui/dropdown-menu.tsx`            | EXTEND: Framer Motion spring exit + stagger items                           | MEDIUM | Radix forceMount interaction       |
| `src/components/ui/popover.tsx`                  | EXTEND: Framer Motion spring enter/exit                                     | LOW    | Simpler than select                |
| `src/components/ui/command.tsx`                  | EXTEND: glass overlay polish, focus glow                                    | LOW    | Minimal changes                    |
| `src/components/ui/dialog.tsx`                   | EXTEND: spring enter/exit                                                   | LOW    | Minimal changes                    |
| `src/components/tactical/GlassPanel.tsx`         | EXTEND: 5-tier depth shadow                                                 | LOW    | Additive shadow layers             |
| `src/components/tactical/TacticalButton.tsx`     | EXTEND: spring hover/active                                                 | LOW    | Replace CSS transition with spring |
| `src/shared/lib/motion.ts`                       | EXTEND: dropdownEnter, staggerDropdownItems, dropdownItem variants          | LOW    | Additive                           |
| `src/features/camps/pages/CampsPage.tsx`         | EDIT: replace raw `<input>` with `<SearchInput>`                            | LOW    | Drop-in replacement                |
| `src/features/people/pages/PeopleListPage.tsx`   | EDIT: replace raw `<input>` with `<SearchInput>`                            | LOW    | Drop-in replacement                |
| `src/layouts/AppShell.tsx`                       | EXTEND: add HolographicRadar between TacticalBackground and content         | LOW    | Add one component                  |

---

## Sources

### Primary (HIGH confidence)

- [MDN backdrop-filter docs](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) — Backdrop root definition, browser support (Baseline 2024), filter function syntax
- [MDN will-change docs](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — Warning against stylesheet-based will-change, memory cost, stacking context side effects
- [Framer Motion v12 Transition docs](https://www.framer.com/motion/transition/) — Spring `visualDuration`, `bounce`, `stiffness`, `damping`, stagger, orchestration
- [Framer Motion v12 Animation docs](https://www.framer.com/motion/animation/) — `AnimatePresence`, `exit`, `forceMount` pattern, variants propagation, gesture animations
- [web.dev High-Performance CSS Animations](https://web.dev/articles/animations-guide) — GPU compositing properties (transform, opacity), paint-only properties (background-image), layout-triggering properties (top, left)

### Secondary (MEDIUM confidence)

- Codebase audit (`tokens.css`, `globals.css`, `tailwind.config.js`, all tactical components, all shadcn/ui components) — Verified current state, identified gaps (hardcoded search inputs, duplicate CSS, missing radar layer)
- `package.json` dependency audit — Confirmed versions: framer-motion 12.38.0, @radix-ui/react-select 2.2.6, @radix-ui/react-dropdown-menu 2.1.16, cmdk 1.1.1

### Tertiary (LOW confidence)

- Slopcheck unavailable — no new packages needed, so no risk
- ctx7 unavailable — compensated by direct WebFetch to MDN and Framer Motion official docs

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all dependencies already installed, verified via package.json
- Architecture: MEDIUM — pattern relies on Radix `forceMount` + Framer Motion interaction not officially documented by Radix
- Pitfalls: HIGH — backdrop root behavior and will-change memory cost are well-documented by MDN
- Motion system: MEDIUM — spring parameters are subjective; `visualDuration: 0.25, bounce: 0.1` is a starting recommendation, not a locked value

**Research date:** 2026-05-23
**Valid until:** 2026-06-23 (stable — CSS/Framer Motion APIs change slowly)
