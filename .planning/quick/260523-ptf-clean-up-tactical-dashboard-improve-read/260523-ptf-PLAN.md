# Quick Task 260523-ptf: Tactical Dashboard Cleanup — PLAN

**Description:** Evolve tactical dashboard from glowing prototype to production-grade command center — fix contrast, reduce glow, remove terminal aesthetic.

## Tasks

### Task 1: Fix critical CSS variable bug
**Files:** All feature page files with `--neon-*` vars and `oklch()` colors
**Action:** Replace undefined neon vars with GDF tokens, replace hardcoded oklch colors
**Done:** 346 neon vars + 197 oklch replaced

### Task 2: Fix WCAG contrast
**Files:** tokens.css
**Action:** Bump `--gdf-text-muted` from #536682 → #7a8ba8 (3.55:1 → 4.6:1, passes AA)
**Done:** Muted text now readable

### Task 3: Remove terminal monospace aesthetic
**Files:** All src files
**Action:** Replace `font-mono-data` → `font-sans text-xs`, `font-mono` → `font-sans text-sm`, remove CSS definitions
**Done:** 479 occurrences removed

### Task 4: Normalize letter-spacing
**Files:** All src files
**Action:** Replace `tracking-widest`, `tracking-[0.2em]`, etc. with `tracking-normal`
**Done:** 152 occurrences normalized

### Task 5: Reduce glow/neon effects
**Files:** globals.css, tokens.css
**Action:** Lower glow opacities from 0.4→0.15, remove gdf-glow-text, reduce hover-glow
**Done:** Glow intensity reduced ~60%

### Task 6: Tone down Aurora background
**Files:** AppShell.tsx
**Action:** Change colorStops to dark blues, amplitude 1.2→0.6, blend 0.55→0.4
**Done:** Aurora is subtle dark navy instead of red/amber/green

### Task 7: Reduce TacticalBackground noise
**Files:** TacticalBackground.tsx
**Action:** Reduce particles 60→12, scanner opacity 0.15→0.04, glow opacity 0.12→0.04
**Done:** Background noise reduced ~75%

### Task 8: Clean up tactical text/copy
**Files:** AppShell.tsx, DashboardPage.tsx, LoginPage.tsx
**Action:** Remove "OPERATIONAL SECTOR 04", "TACTICAL LOG", "ENC: AES-256", etc.
**Done:** All tactical copy replaced with clean labels
