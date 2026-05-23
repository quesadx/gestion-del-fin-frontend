# Phase 02: Tactical UI Consolidation — Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Source:** PRD Express Path (user brief)

<domain>
## Phase Boundary

Extend the holographic tactical OS design system to cover ALL components in the application. Phase 01 migrated feature pages and created core glass primitives, but 64 shadcn/ui components still render with default Zinc/Tailwind styling. This phase completes the visual unification.

**Deliverables:**

1. All shadcn/ui primitives restyled with gdf-\* glass tokens (combobox, select, dropdown, popover, command, dialog, hover-card, tooltip, etc.)
2. Standardized interactive element behavior (hover/focus rings, border states, motion consistency)
3. Emotional UI deepened with per-component reactivity and animated transitions
4. LockScreen splash migrated to glass tactical aesthetic
5. StockBarChart consolidated into tactical/ directory
6. TacticalBackground refined (particle layer, cursor glow performance)
7. Dark/light mode audited for contrast and consistency across all components
8. Responsive layout refined (mobile drawer, tablet spacing)
9. Legacy `.terminal-*` CSS classes removed from globals.css
10. Accessibility audit (focus visibility, color contrast, aria labels)
11. Performance optimization (backdrop-filter GPU layering, Tailwind purge audit)
    </domain>

<decisions>
## Implementation Decisions

### Component Migration (LOCKED)

All 64 shadcn/ui primitives must be visually unified under the gdf-\* token system. Priority order:

| Priority | Component Type                          | Impact  | Reason                                                                 |
| -------- | --------------------------------------- | ------- | ---------------------------------------------------------------------- |
| P0       | Combobox, Select, Dropdown              | Highest | Most immersion-breaking — generic defaults with solid dark backgrounds |
| P1       | Popover, Command, Dialog                | High    | Floating panels look disconnected from glass system                    |
| P2       | Input, Textarea, HoverCard, Tooltip     | High    | Interactive elements lack glass styling and glow                       |
| P3       | Calendar, Slider, Toggle, Checkbox      | Medium  | Form controls need accent color alignment                              |
| P4       | Breadcrumb, Accordion, Tabs, Avatar     | Medium  | Navigation and display elements                                        |
| P5       | ContextMenu, NavigationMenu, Menubar    | Lower   | Less frequently used                                                   |
| P6       | Sheet (used for mobile sidebar), Drawer | Lower   | Already partially styled                                               |

### Interactive Element Standard (LOCKED)

All interactive elements must share:

- **Hover:** Subtle background highlight via `bg-gdf-surface-hover/50` + border glow transition
- **Focus:** Visible focus ring using `ring-2 ring-gdf-accent-primary/50 ring-offset-2 ring-offset-gdf-surface-root`
- **Active:** Scale feedback `active:scale-[0.98]` on buttons and interactive cards
- **Border:** `border-gdf-border-subtle` default, `border-gdf-accent-primary` on focus/open
- **Background:** Glass translucency via `bg-gdf-glass-bg` + `backdrop-blur-glass` for floating panels
- **Motion:** 150-250ms ease-out transitions on all state changes

### Shadcn/ui Override Strategy (LOCKED)

- Do NOT fork shadcn/ui components — override via CSS variables and Tailwind classes in the component's usage site
- Override the `classNames` API where components expose it (dialog, popover, command)
- For components without classNames API, override via `className` prop on the root wrapper
- The shadcn/ui primitives already consume `--background`, `--foreground`, `--border`, `--muted` etc. which are mapped to gdf-\* tokens in globals.css. The main gap is backgrounds (still solid `bg-background` instead of `bg-gdf-glass-bg`) and borders.

### Glass Overlay Standard (LOCKED)

All floating/overlay elements (popovers, dropdowns, command palettes, dialogs, hover cards, tooltips, select dropdowns):

- `bg-gdf-glass-bg-heavy` (not `bg-gdf-surface-overlay` — needs transparency)
- `backdrop-blur-glass-heavy` (24px blur, heavy glass feel)
- `border border-gdf-glass-border` (subtle cyan-tinted border)
- `shadow-lg shadow-gdf-surface-root/20` (depth)
- `rounded-md` (consistency with gdf-radius-md)
- Light mode: higher opacity glass (`bg-gdf-glass-bg-heavy` already accounts for this via CSS variable resolution)

### Immersion-Breaking Items to Fix (LOCKED)

User explicitly identified these as breaking visual coherence:

- Combobox dropdowns with solid `bg-popover` backgrounds → must become glass translucent
- Select triggers and content with generic borders → must use gdf-border-\* + glass BG
- Dropdown menus with hard shadows and no transparency → glass overlay standard
- Command palette with Tailwind default styling → glass + scanner sweep accent
- Input fields in forms → already partially migrated in LoginPage, need `gdf` styling applied to all shadcn/ui input instances
- Search bars → glass translucent with scanner-like focus glow

### LockScreen Migration (LOCKED)

- `src/components/LockScreen.tsx` still uses `brutalist-border` and hardcoded zinc colors
- Replace with GlassPanel + TacticalButton
- Update countdown timer styling

### StockBarChart Consolidation (LOCKED)

- Move from `src/components/cyber/StockBarChart.tsx` to `src/components/tactical/StockBarChart.tsx`
- Update all imports in InventoryPage
- This removes the last non-StatusBadge file from cyber/

### Emotional UI Deepening (LOCKED)

- Add `useEmotionalStore` subscription to shadcn/ui components where appropriate (popover borders shift with state)
- Animate emotional state transitions: CSS `transition` on accent/glow/border tokens already defined, but need to ensure all overridden components also transition
- Add subtle scanner accent to command palette and select dropdowns in alert/critical states
- Glitch overlay: make `.gdf-critical-glitch` more visible (currently 0.03 opacity — too subtle to notice)

### TacticalBackground Enhancements (LOCKED)

- Add optional particle layer: 20-30 slowly drifting dots using CSS animations (not Canvas)
- Cursor glow performance: currently runs on `requestAnimationFrame` at 20fps — acceptable. Consider debouncing the CSS property write instead.
- Scanner sweep: make opacity responsive to emotional state (already reads `--gdf-scanner-opacity`)

### Dark/Light Mode Audit (LOCKED)

- Audit all shadcn/ui components in light mode for:
  - Glass readability (white glass on white background)
  - Border contrast (subtle cyan borders need different alpha on light bg)
  - Focus ring visibility (ring-offset color must match surface)
  - Text contrast ratios (WCAG AA minimum 4.5:1)
- Fix: light mode glass borders need higher alpha values in tokens.css light block

### Responsive Refinement (LOCKED)

- Mobile sidebar drawer (Sheet component): restyle header with glass, update close button
- Tablet spacing: audit padding/margins on 768px-1024px breakpoints
- Glass panels on mobile: reduce blur (performance) or keep same? → keep same, test performance

### Accessibility (LOCKED)

- Focus rings: ensure `:focus-visible` styles are prominent enough on all interactive elements
- Color contrast: audit gdf-text-muted (#536682 dark / #94a3b8 light) against surface backgrounds
- Skip links: no skip link to main content → add if time permits (low priority)
- Motion: all animations respect `prefers-reduced-motion` (already implemented in TacticalBackground, verify for new shadcn overrides)

### Performance (LOCKED)

- `backdrop-filter: blur()` is GPU-expensive. Too many simultaneous blurred elements cause jank.
  - Rule: maximum 3 simultaneously visible blurred glass layers at any depth
  - Mitigation: tooltip + popover + dropdown shouldn't all render at once; conditional rendering via AnimatePresence handles this
- Tailwind purge audit: after removing `.terminal-*` classes, CSS bundle should shrink
- Reduce unused CSS variables: several `--gdf-*` tokens aren't consumed yet — fine, they're available for this phase

### Dead Code Removal (LOCKED)

- `.terminal-table`, `.terminal-input`, `.terminal-divider` CSS classes in globals.css → verify zero usage, then remove
- `LockScreen.tsx` — migrates to glass, but class name references change
- `cspell.json` — remove any remaining legacy words (scanline references already removed in Phase 01)

### The agent's Discretion

- Exact animation curves for shadcn/ui state transitions
- Whether to fork or override each specific shadcn/ui component
- Exact hover/focus ring styling (within the standard defined above)
- Particle implementation details for TacticalBackground
- LockScreen redesign specifics
- Order within priority tiers (P0-P6)
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System (Phase 01 output)

- `src/app/styles/tokens.css` — Complete --gdf-\* design token architecture
- `src/app/styles/globals.css` — Tailwind directives + base styles + component utilities + emotional UI overrides
- `tailwind.config.js` — gdf.\* namespace + animations + backdropBlur
- `docs/DESIGN_SYSTEM.md` — Updated design system documentation

### Current Components (Phase 01 output)

- `src/components/tactical/GlassPanel.tsx` — Glass card with backdrop-blur
- `src/components/tactical/TacticalButton.tsx` — 4-variant tactical button
- `src/components/tactical/HoloLoader.tsx` — Holographic spinner
- `src/components/tactical/TacticalBackground.tsx` — Dynamic background
- `src/components/tactical/ThemeToggle.tsx` — Dark/light toggle
- `src/components/cyber/StatusBadge.tsx` — Restyled inline badge
- `src/components/cyber/StockBarChart.tsx` — Recolored chart

### State Management (Phase 01 output)

- `src/features/ui/store/emotional.store.ts` — Zustand store for emotional state
- `src/features/ui/hooks/useEmotionalSyncer.ts` — Hook deriving emotional state from camp data
- `src/hooks/useTheme.ts` — Dark/light toggle hook

### Layout

- `src/layouts/AppShell.tsx` — Glass sidebar + header
- `src/App.tsx` — Root providers + TacticalBackground + ThemeToggle

### shadcn/ui Primitives (all 64 in src/components/ui/)

- All 64 shadcn/ui component files need audit for gdf-\* compatibility
- `src/shared/lib/utils.ts` — cn() utility used by all shadcn/ui components

### Remaining to Migrate

- `src/components/LockScreen.tsx` — Session lock screen with countdown
- `src/components/ErrorBoundary.tsx` — Already partially migrated (TacticalButton imported, text updated, colors need full pass)
- `src/components/cyber/StockBarChart.tsx` — Needs directory relocation to tactical/

### Project Conventions

- `AGENTS.md` — Hard rules: named exports, no `any`, pnpm check
- `.planning/codebase/CONVENTIONS.md` — Coding patterns
- `.planning/codebase/ARCHITECTURE.md` — Full architecture map
  </canonical_refs>

<specifics>
## Specific Design Requirements

### Glass Combobox

- Trigger: `bg-gdf-glass-bg backdrop-blur-glass border border-gdf-glass-border rounded-md text-gdf-text-primary`
- Open state: border shifts to `border-gdf-accent-primary`, subtle glow via box-shadow
- Dropdown: glass overlay standard, items with `hover:bg-gdf-surface-hover/50`
- Search inside: glass input with scanner-like accent on focus

### Glass Select

- Same trigger styling as combobox
- Dropdown: glass overlay standard
- Selected item: cyan accent indicator
- Groups: subtle divider via `border-gdf-glass-border`

### Glass Dropdown Menu

- Content: glass overlay standard (heavy glass, 24px blur)
- Items: `text-gdf-text-secondary`, hover→`bg-gdf-accent-primary/10 text-gdf-accent-primary`
- Separator: `bg-gdf-glass-border`
- Shortcuts: `text-gdf-text-muted font-mono`

### Glass Command Palette

- Overlay: glass overlay standard + scanner sweep accent line at top
- Input: glass styled, placeholder `text-gdf-text-muted`
- Items: same as dropdown
- Empty state: `text-gdf-text-muted` with tactical icon

### Glass Popover

- Content: `bg-gdf-glass-bg-heavy backdrop-blur-glass-heavy border border-gdf-glass-border rounded-md shadow-lg`
- Arrow: inherits border color
- Close button: `text-gdf-text-muted hover:text-gdf-text-primary`

### Glass Dialog/Modal

- Overlay: `bg-gdf-surface-root/60 backdrop-blur-sm`
- Content: glass overlay standard
- Header/Footer: subtle border separation via `border-gdf-glass-border`
- Close button styling consistent

### Glass Inputs

- Base: `bg-gdf-surface-base/50 border border-gdf-border-subtle rounded-md text-gdf-text-primary`
- Focus: `border-gdf-accent-primary ring-1 ring-gdf-accent-primary/20`
- Placeholder: `text-gdf-text-muted`
- Disabled: `opacity-50 cursor-not-allowed`

### Glass Tooltip

- Content: `bg-gdf-glass-bg-heavy backdrop-blur-glass-heavy border border-gdf-glass-border rounded-md px-3 py-1.5 text-xs text-gdf-text-secondary`
- Arrow: matches border

### LockScreen Redesign

- Center glass panel with heavy glass, bracketed corners
- Countdown timer with `font-mono-data` and `text-gdf-accent-primary`
- GF logo with `bg-gdf-accent-primary`
- "SESSION LOCKED" header
- TacticalButton variant="primary" for unlock

### Responsive

- Mobile: Sheet sidebar drawer now restyled in Phase 01, verify close button/header styling
- Tablet: 768-1024px breakpoint ensures glass panels don't overflow
- Dialog max-width: `sm:max-w-md` for mobile safety
  </specifics>

<deferred>
## Deferred Ideas

- Canvas particle system for TacticalBackground (CSS-only first)
- Skip-to-content link (accessibility)
- Motion design system documentation (separate docs task)
- Comprehensive WCAG audit with automated tooling
- Playwright E2E visual regression tests
  </deferred>

---

_Phase: 02-tactical-ui-consolidation_
_Context gathered: 2026-05-23 via PRD Express Path_
