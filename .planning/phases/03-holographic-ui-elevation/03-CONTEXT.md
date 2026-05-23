# Phase 03: Holographic UI Elevation — Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Source:** PRD Express Path (user brief)

<domain>
## Phase Boundary

Elevate the Gestión del Fin interface from "modern tactical dashboard" to "cinematic holographic tactical operating system." Phase 01 established the design system. Phase 02 unified all 64 shadcn/ui components. Phase 03 adds depth, motion, atmosphere, and premium feel.

**Deliverables:**

1. Rounded corners system (larger border-radius across the design system)
2. Multilayer translucency with depth and parallax
3. Advanced motion system (page transitions, hover animations, floating panels, scanners)
4. Dynamic ambient background (holographic waves, grid lines, nebula gradients, particles)
5. Deep emotional UI (atmospheric shifts for alert/critical states)
6. Premium microinteractions (hover glow, focus rings, ripple effects)
7. Legacy component audit and modernization
8. Background performance optimization
   </domain>

<decisions>
## Implementation Decisions

### Rounded Corners System (LOCKED)

- Increase `--gdf-radius-md` from 4px to 6px and `--gdf-radius-lg` from 6px to 10px
- Add `--gdf-radius-xl` at 14px for floating cards and hero panels
- All panels, cards, inputs, buttons get larger border-radius
- NOT excessive mobile-casual rounding — tactical modern rounding
- GlassPanel, TacticalButton, all shadcn/ui components affected
- Reference: interfaces tácticas modernas con glassmorphism premium

### Multilayer Translucency (LOCKED)

- Stacked glass panels with depth via z-index layering
- Parallax effect: panels shift slightly on scroll (light, 2-4px)
- Ambient shadows between layers: `box-shadow` with varying blur radii
- At least 3 visible depth layers: foreground (panels) → midground (content) → background (ambient)
- Overlays use higher-opacity glass to create visual hierarchy

### Dynamic Ambient Background (LOCKED)

- More visible than current TacticalBackground
- Holographic wave overlays (animated SVG or CSS gradients)
- Tactical grid lines (light subtle grid, animated drift)
- Nebula gradients: slow-moving color blobs at large scale
- Particle system: 40-60 particles (up from current 24)
- All effects respect `prefers-reduced-motion`
- Performance target: 60fps, GPU-composited
- Must NOT distract from readability
- Must NOT kill mobile performance

### Advanced Motion System (LOCKED)

- Page transitions: fade + slide-up on route changes (Framer Motion AnimatePresence)
- Hover animations: smooth 200ms transitions on all interactive elements
- Floating panel behavior: subtle float animation (2-3px translateY)
- Scanner effects: multiple horizontal sweeps at different speeds
- Loading states: skeleton pulses with glass styling
- Alert transitions: smooth emotional state shifts (800ms)
- Focus transitions: ring-glow expanding animation
- Background motion: ambient drift + parallax

### Deep Emotional UI (LOCKED)

- Alert state: amber glow bleeds into sidebar and header borders
- Critical state: red ambient overlay on entire viewport (5-8% opacity)
- Color bleeding: emotional accent colors tint adjacent glass panels
- Atmospheric particles shift color (blue→amber→red based on state)
- Scanner speed accelerates with urgency
- Background wave frequency increases subtly
- Manual override preserved for debugging

### Premium Microinteractions (LOCKED)

- Hover glow: subtle box-shadow cyan glow on glass panels
- Focus rings: expanding ring animation (scale + fade)
- Ripple effect on button clicks (CSS-based, lightweight)
- Smooth state transitions on all interactive elements
- Select dropdown items slide-in animation
- Dialog open: scale-up + fade-in (Framer Motion)
- Toast notifications: glass slide-in from right

### Legacy Component Audit (LOCKED)

User identified specific components still looking "too solid/dark/traditional":

- Tables: audit all feature page tables for glass compatibility
- Pagination: restyle with glass buttons
- Filters/search bars: full glass overlay with scanner accent
- Date pickers: calendar styling alignment
- Tabs: already gdf-restyled, verify
- Sidebar already migrated (AppShell), verify no regression
- All P0-P2 component types from Phase 02 must be re-audited for premium feel

### Performance (LOCKED)

- Keep `backdrop-filter` at maximum 3 simultaneous layers
- GPU compositing via `will-change: transform` on animated elements
- CSS animations preferred over JavaScript for background effects
- Particle count capped at 60, throttle on low-power devices
- Motion never blocks interaction

### Accessibility (LOCKED)

- All animations respect `prefers-reduced-motion`
- Focus rings must be visible (WCAG 2.4.7 Focus Visible)
- Color contrast maintained through emotional state shifts
- No seizure-inducing effects (no rapid flashes)
- Keyboard navigation preserved through all motion states

### The agent's Discretion

- Exact radius values (within the ranges specified)
- Motion easing curves
- Background wave/nebula implementation (CSS vs SVG)
- Ripple effect implementation approach
- Exact parallax values
- Particle distribution and animation patterns
- Order of component audit findings
  </decisions>

<canonical_refs>

## Canonical References

### Design Tokens (Phase 01-02 output)

- `src/app/styles/tokens.css` — Complete --gdf-\* design token architecture including radius, transition, glass, surface, accent, status, emotional state
- `src/app/styles/globals.css` — Tailwind directives + base styles + component utilities including gdf-glass-overlay, gdf-interactive-hover, gdf-focus-ring, emotional state overrides
- `tailwind.config.js` — gdf.\* namespace + animations (ambient-drift-1/2, scanner-sweep, breathe, pulse-glow, glitch-shift) + backdropBlur

### Core Components (Phase 01-02 output)

- `src/components/tactical/GlassPanel.tsx` — Glass card with accent variants and bracketed corners
- `src/components/tactical/TacticalButton.tsx` — 4-variant tactical button system
- `src/components/tactical/TacticalBackground.tsx` — Dynamic background (gradient waves + cursor glow + scanner + 24 particles)
- `src/components/tactical/ThemeToggle.tsx` — Dark/light mode toggle
- `src/components/tactical/HoloLoader.tsx` — Holographic loading spinner
- `src/components/tactical/StockBarChart.tsx` — Tactical chart (relocated from cyber/)

### Layout + State

- `src/layouts/AppShell.tsx` — Glass sidebar + header with emotional UI syncer
- `src/features/ui/store/emotional.store.ts` — Zustand store for stable/alert/critical states
- `src/features/ui/hooks/useEmotionalSyncer.ts` — Hook deriving emotional state from camp data
- `src/hooks/useTheme.ts` — Dark/light toggle with localStorage persistence

### All Shadcn/ui Components (Phase 02 output)

- `src/components/ui/*.tsx` — All 64 components restyled with gdf-\* glass tokens

### Motion System

- `src/shared/lib/motion.ts` — Framer Motion variants (fadeIn, slideUp, staggerContainer, modalEnter, scannerLine)
- `src/shared/lib/toast.tsx` — Glass toast notification system

### Documentation

- `docs/DESIGN_SYSTEM.md` — Updated comprehensive design system documentation
- `AGENTS.md` — Project conventions and hard rules
  </canonical_refs>

<specifics>
## Specific Design Requirements

### Rounded Corners Tiers

- Button: rounded-md (6px)
- Input/Select/Combobox: rounded-md (6px)
- Card/Panel: rounded-lg (10px)
- Dialog/Modal: rounded-lg (10px)
- Floating Card (hero): rounded-xl (14px)
- Dropdown/Popover: rounded-md (6px)
- Badge/Tag: rounded-md (4px)
- Toggle: rounded-full (pill)

### Background Vision

- Wave layers: 2-3 overlapping animated gradient blobs (cyan, blue, indigo) at 120px blur
- Grid overlay: subtle 60px grid with animated drift (opacity 0.03-0.06)
- Scanner lines: 2 sweeps at different speeds (8s, 12s) with varied opacity
- Particle field: 40-60 dots with slow drift + pulse, color-reactive to emotional state
- Cursor glow: increased radius (800px) but same intensity

### Motion Timing

- Page transitions: 300ms ease-out
- Hover states: 200ms ease-out
- Panel float: 3px translateY, 4s ease-in-out infinite alternate
- Scanner: 8s/12s linear infinite
- Emotional shift: 800ms ease-in-out (already defined)
- Toast enter: 300ms spring
- Dialog enter: 200ms scale-up + fade
- Focus ring expand: 150ms ease-out

### Emotional UI Deepening

- Alert: amber border glow on AppShell sidebar + header (box-shadow inset)
- Critical: red overlay (#ef4444 at 5% opacity, fixed full-viewport)
- Particle color shift: particles read `--gdf-accent-secondary` for color (auto-reactive)
- Scanner opacity shift: already reads `--gdf-scanner-opacity`
- Background wave hue: shift from cyan to amber to red via CSS filter or separate gradient layers
  </specifics>

<deferred>
## Deferred Ideas

- Three.js 3D map visualization — phase 03 focuses on 2D tactical depth
- Sound design / audio feedback — multimedia compatibility not in scope
- Playwright E2E visual regression tests — separate testing phase
- PWA offline support — separate capability phase
- Real-time websocket-driven background reactivity — backend dependency
  </deferred>

---

_Phase: 03-holographic-ui-elevation_
_Context gathered: 2026-05-23 via PRD Express Path_
