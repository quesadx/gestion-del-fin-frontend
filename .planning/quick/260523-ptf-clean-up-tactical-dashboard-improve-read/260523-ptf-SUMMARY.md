# Quick Task 260523-ptf: Tactical Dashboard Cleanup — Summary

**Status:** complete
**Date:** 2026-05-24

## What was done

### Critical bug fixes
- **346 undefined `--neon-*` CSS variables** replaced with proper GDF tokens across 17 files
- **197 hardcoded `oklch()` colors** replaced with GDF surface/border tokens
- These were rendering as `initial`/`transparent` — form labels and inputs were effectively invisible

### Typography & readability
- **WCAG contrast fix**: `--gdf-text-muted` #536682 → #7a8ba8 (3.55:1 → 4.6:1, passes AA)
- **479 monospace occurrences** removed — `font-mono-data` → `font-sans text-xs`, `font-mono` → `font-sans text-sm`
- **152 excessive tracking/letter-spacing** normalized to `tracking-normal`
- Deleted CSS definitions for `.font-mono-data`, `.font-mono`, `.font-mono-sm`

### Glow & noise reduction
- **Glow opacities**: `--gdf-accent-primary-glow` 0.4→0.15, `--gdf-accent-secondary-glow` 0.4→0.15
- **Text glow**: `.text-glow` now `text-shadow: none`, glow variants reduced to subtle 6px/0.15 opacity
- **Hover glow**: removed `box-shadow` from `.gdf-hover-glow:hover`
- **Scanner opacity**: 0.15→0.04 (barely visible)
- **TacticalBackground particles**: 60→12, opacity clamped to 0.1-0.25
- **Ambient glow blobs**: opacity reduced from 0.12/0.10/0.08 to 0.04/0.03/0.03

### Aurora background
- Color stops: `#ef4444, #f59e0b, #10b981` → `#1e293b, #1e3a5f, #0f172a` (dark navy)
- Amplitude: 1.2→0.6, Blend: 0.55→0.4, Speed: 0.4→0.2

### Tactical text removal
- AppShell: "OPERATIONAL SECTOR 04 // ONLINE" → "Gestión del Fin"
- AppShell: ISO timestamp → locale time string
- DashboardPage: "TACTICAL LOG" / STREAMING → "Camp Status" + camp count
- DashboardPage: "TERMINAL ACTIVE" → "Runtime"
- DashboardPage: "END MANAGEMENT · COMMAND INTERFACE" → "Dashboard"
- DashboardPage: "· terminal ready" → activeCampName or "Overview"
- DashboardPage: Removed "[00:00] OK Terminal boot sequence..." fake log
- LoginPage: "TACTICAL COMMAND // AUTHENTICATION" → "Sign in to continue"
- LoginPage: "ENC: AES-256 / SEC LEVEL: 02" → "v2.0 / Gestión del Fin"
- LoginPage: Removed "Unauthorized access will be prosecuted" footer
