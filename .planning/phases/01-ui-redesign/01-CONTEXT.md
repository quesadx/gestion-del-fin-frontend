# Phase 01: Tactical UI Redesign — Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Source:** PRD Express Path (user brief)

<domain>
## Phase Boundary

Complete visual transformation of the Gestión del Fin frontend. Replace the current brutalist/cyberpunk-neon visual system with a modern holographic tactical command-center interface.

**Deliverables:**

1. New design token system supporting dark + light modes
2. Glassmorphism component library (glass panels, cards, dialogs, overlays)
3. Reactive holographic/dynamic background with cursor tracking
4. Emotional UI state system (stable/alert/critical ambient states)
5. Tactical dashboard layout with central map concept
6. Migrated legacy brutalism/cyberpunk components to new design system
7. All existing pages, routes, and features working identically under new visual layer

**Preserved:** All business logic, API contracts, user flows, RBAC, auth, routing.
</domain>

<decisions>
## Implementation Decisions

### Visual Direction (LOCKED)

- **Aesthetic:** Holographic tactical OS — NOT retro terminal, NOT cyberpunk RGB excess, NOT Fallout green CRT
- **Feel:** Alive, reactive, atmospheric, elegant, technological, immersive
- **Inspirations:** Tactical HUDs, glassmorphism, sci-fi command centers, modern hologram displays, scanner interfaces, surveillance systems
- **Anti-inspirations:** Retro terminals, green phosphor, cyberpunk RGB overload, gamer-heavy interfaces, excessive neon

### Dark Mode (LOCKED — primary, default)

- Deep dark backgrounds with ambient depth
- Dark glassmorphism (translucent panels, backdrop-filter blur)
- Blue/cyan glow as primary accent
- Dynamic red alerts for danger states
- Scanner effects, subtle wave animations
- Tactical sci-fi atmosphere

### Light Mode (LOCKED — secondary, must maintain tactical identity)

- Clean cold whites (NOT pure white)
- Clear glass translucency
- Soft blue accents
- Laboratory/sci-fi facility feel
- Subtle hologram hints
- Must NOT look like a generic SaaS dashboard

### Glassmorphism (LOCKED)

- Translucent panels with `backdrop-filter: blur()`
- Subtle borders (not harsh outlines)
- Ambient illumination behind panels
- Legibility must NOT suffer from transparency
- Use `bg-white/[0.03-0.08]` dark / `bg-white/[0.6-0.8]` light ranges

### Dynamic Reactive Background (LOCKED)

- Animated gradients, subtle waves, scanner sweeps
- Cursor-reactive lighting (radial gradient following mouse)
- Particle effects (light, minimal, non-distracting)
- Must NOT kill performance — CSS/Canvas-based, not Three.js unless justified
- Subtle distortion effects in critical state

### Emotional UI States (LOCKED)

The interface reacts visually to camp health/situation:

- **Stable:** Blue/cyan tones, slow breathing animations, calm waves
- **Alert:** Orange/amber pulses, accelerated scanners, ambient red glow
- **Critical:** Subtle glitches, interference, controlled visual distortion, unstable system feel

### Layout (LOCKED)

- Central tactical map concept on dashboard
- Floating glass panels
- Collapsible sidebar with new styling
- Widget system for modular dashboard
- Status overlays for camp state
- Scanner-like data views

### Typography

- **Display/Headings:** Geist or Inter (clean geometric, modern)
- **UI Labels:** Inter (readable at small sizes)
- **Data/Metrics:** JetBrains Mono (existing, preserve)
- NO retro pixel fonts, NO CRT-styled typefaces

### Color Palette

- Primary accent: cyan/blue range (`#06b6d4` → `#3b82f6`)
- Danger/Alert: red range (`#ef4444` → `#dc2626`)
- Warning: amber range (`#f59e0b` → `#d97706`)
- Success: emerald range (`#10b981`)
- Surfaces: near-black with blue undertones (dark), cool white/gray (light)
- All colors must have dark + light mode variants

### Technology Stack (LOCKED to existing)

- React 19, TypeScript strict, Vite 8, Tailwind 3
- Framer Motion for animations (already installed)
- CSS variables for design tokens (already used)
- Canvas API for background effects (lightweight)
- No new heavy dependencies unless justified
- Three.js ONLY if it adds real value (not for basic effects)

### Migration Strategy (LOCKED)

- Incremental component-by-component migration
- Create new design system in parallel to existing cyber/ components
- Swap components one page at a time
- Preserve all business logic and API contracts
- Keep both systems operational during transition
- Kill old system after all pages migrated

### Component Priority (LOCKED)

1. Design tokens (CSS variables, Tailwind config)
2. Background system (dynamic/reactive)
3. Glass primitives (Panel, Card, Dialog)
4. Layout (AppShell sidebar + header)
5. Button, Input, Select, Form fields
6. Dashboard page
7. Table/Data components
8. Remaining feature pages
9. Toast, alerts, badges
10. Loaders, skeletons, empty states

### The agent's Discretion

- Exact color values within the approved ranges
- Animation timing and easing curves
- Glass blur intensity (within readability constraints)
- Canvas background implementation details
- Framer Motion variant specifics
- Order of page migration after core components
- Whether to use Three.js for any specific effect
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Codebase (reference for migration)

- `src/app/styles/globals.css` — Current Tailwind directives + utility classes (glass, brutalist-border, font-mono-data)
- `src/app/styles/tokens.css` — Current CSS design tokens (brand-primary, surface-_, neon-_)
- `src/app/styles/fonts.css` — @font-face declarations
- `src/app/styles/scanlines.css` — CRT scanline overlay (TO BE REMOVED)
- `src/components/cyber/Panel.tsx` — Current Panel component (brutalist)
- `src/components/cyber/GlitchButton.tsx` — Current button system
- `src/components/cyber/StatusBadge.tsx` — Current badge system
- `src/components/cyber/ScreenLoader.tsx` — Current loader
- `src/components/cyber/WaveBackground.tsx` — Current background (TO BE REPLACED)
- `src/components/cyber/StockBarChart.tsx` — Current chart component
- `src/layouts/AppShell.tsx` — Current layout shell
- `src/shared/lib/motion.ts` — Current Framer Motion variants
- `tailwind.config.js` — Current Tailwind theme

### Docs

- `docs/DESIGN_SYSTEM.md` — Current visual concept documentation (cyberpunk neon)
- `docs/AGENT.md` — Current agent context (phosphor green terminal)
- `AGENTS.md` — Project conventions and hard rules

### Project State

- `.planning/codebase/ARCHITECTURE.md` — Full architecture map
- `.planning/codebase/CONCERNS.md` — Known issues, tech debt
- `.planning/codebase/CONVENTIONS.md` — Coding patterns
  </canonical_refs>

<specifics>
## Specific Design Requirements

### Background System

- Animated gradient waves (CSS or Canvas)
- Cursor-reactive radial glow (follows mouse, ambient lighting effect)
- Scanner line sweeps (horizontal, subtle)
- Light particle system (optional, subtle)
- Must work in both dark and light modes
- Performance: 60fps target, degrade on low-power devices

### Glass Panel Properties

- `backdrop-filter: blur(12-20px)`
- `background: rgba(255,255,255,0.04)` dark / `rgba(255,255,255,0.7)` light
- `border: 1px solid rgba(255,255,255,0.08)` dark / `rgba(0,0,0,0.06)` light
- Subtle box-shadow for depth
- Corner accents optional (tactical brackets)

### Emotional UI Triggers

- Camp threat level / low stock count → ambient state
- Sidebar or dashboard shows current emotional state
- State transitions animated smoothly (0.5-1s transition)
- Manual override possible for debugging

### Navigation

- Preserve AppShell pattern (sidebar + header + content)
- Sidebar: glass panel styling, cyan active indicator
- Collapsible to icon-only mode (existing pattern)
- Camp selector: restyled as tactical dropdown
- Status bar: server time + camp status dot

### Responsive

- Mobile: sidebar becomes drawer/hamburger
- Tablet: collapsible sidebar
- Desktop: full sidebar
- Glass panels responsively stack
- Dashboard widgets reflow on smaller screens
  </specifics>

<deferred>
## Deferred Ideas

- Gamification elements (achievements, badges, scoring) — separate phase
- Three.js 3D map — evaluate after 2D tactical map implemented
- AI explainability dashboard — depends on backend AI features
- Playwright E2E tests — separate testing phase
- Sound design / audio feedback — stretch goal, not priority
  </deferred>

---

_Phase: 01-ui-redesign_
_Context gathered: 2026-05-23 via PRD Express Path_
