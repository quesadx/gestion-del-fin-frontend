# AGENTS.md — Gestión del Fin · Frontend

> Read this first. Then load context doc per task.

---

## QUICK START

```bash
npm run dev      # vite dev server → http://localhost:5173
npm run build    # tsc + vite build
npm run check    # lint + spell + build — run before commit
npm run format   # prettier src/
```

---

## PROJECT

| Field | Value |
|---|---|
| Name | Gestión del Fin |
| Type | Zombie apocalypse multi-camp resource manager |
| Context | Univ final project · EIF209 · UNA Costa Rica 2026 |
| Stack | React 19 / TypeScript strict / Vite 8 / Tailwind 3 / TanStack Query 5 / Zustand 5 / shadcn/ui / Axios |
| Visual | Neon cyberpunk — fuchsia + cyan + yellow on dark oklch backgrounds |
| Auth | JWT. Stored in Zustand (persisted to localStorage as `gdf.auth`). Axios interceptor attaches Bearer token, auto-redirects on 401. |
| Proxy | Vite proxies `/api` → `http://localhost:3000` (dev) |

---

## ARCHITECTURE

```
src/
├── app/              # Config, providers, global styles
├── features/         # Business domains (auth, camps, people, inventory, explorations)
│   ├── api/          # Axios call functions
│   ├── components/   # Domain-specific UI
│   ├── hooks/        # TanStack Query hooks
│   ├── pages/        # Route pages
│   ├── store/        # Zustand stores (client state only!)
│   ├── types/        # Domain types
│   └── index.ts      # Barrel export
├── components/       # Reusable UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── cyber/        # Cyberpunk theme components
│   └── navigation/   # Sidebar, Navbar
├── hooks/            # Shared hooks
├── layouts/          # AppShell layout
├── lib/              # Utilities
├── pages/            # Top-level page components
├── routes/           # Router + ProtectedRoute
└── shared/           # Cross-cutting (axios, api types)
```

**State split (hard rule):**
- Zustand → client state only (auth, UI)
- TanStack Query → server state (camps, people, resources, etc.)
- Never store API data in Zustand. Never fetch inside Zustand.

---

## CURRENT STATE

### Working
- Auth: login flow, JWT persistence, logout, protected routes, 401 interception
- AppShell: sidebar (collapsible, mobile overlay), navbar, wave background
- Dashboard: placeholder page
- Design system: neon cyberpunk tokens, fonts, global CSS, Panel component
- UI: full shadcn/ui component library installed
- Routing: React Router v7 with lazy dashboard

### Not yet built
- Feature pages (camps, people, inventory, explorations)
- TanStack Query hooks for server data
- Dashboard metrics/charts with real data
- Gamification (threat level, achievements, camp health)
- Inactivity lock screen
- AI decision displays
- Device frame + scanlines overlay
- Framer Motion page transitions
- Barrel export pattern per feature module
- E2E tests

---

## CONTEXT DOCS (docs/)

| File | Load when... |
|---|---|
| `docs/AGENT.md` | Project overview, conventions, folder structure, state management rules |
| `docs/DESIGN_SYSTEM.md` | UI work: tokens, fonts, layouts, animations, shadcn customization |
| `docs/API_CONTRACT.md` | API calls, queries, mutations, types |
| `docs/ROLES_ACCESS.md` | Auth guards, role-based access, session |
| `docs/MILESTONES.md` | Planning checklist, deliverables, roadmap |
| `docs/TOOLING.md` | ESLint, Prettier, CSpell config details |
| `docs/BACKEND_SCHEMAS.md` | Backend DB schema reference |
| `docs/ENDPOINT_IMPLEMENTATION_WORKFLOW.md` | Step-by-step endpoint integration process |
| `docs/Endpoints.json` | Raw endpoint specs |

---

## CONVENTIONS

- All code in English (UI text can be localized to Spanish)
- No `any` or `as any`. TypeScript strict.
- No `console.log` — use `shared/utils/logger.ts`
- Named exports only (no default exports)
- Component order: hooks → derived state → handlers → JSX
- Imports order: react → libraries → @/features → @/shared → ./local
- All forms: react-hook-form + zod
- All async: explicit error handling
- Server time for business logic, not `Date.now()`
- `npm run check` before every commit

---

## UI COMPONENTS (cyberpunk neon)

### Cyber components (`src/components/cyber/`)
| Component | Purpose | Import |
|-----------|---------|--------|
| `Panel` | Card wrapper with glass border, title, tag, status, accent (`cyan` \| `purple`) | `from '@/components/cyber/Panel'` |
| `GlitchButton` | Cyberpunk button with `primary` \| `ghost` \| `warning` \| `danger` variants | `from '@/components/cyber/GlitchButton'` |
| `StatusBadge` | Inline label with `cyan` \| `purple` \| `green` \| `red` \| `yellow` variants | `from '@/components/cyber/StatusBadge'` |
| `ScreenLoader` | Full-screen loading spinner with cyberpunk styling | `from '@/components/cyber/ScreenLoader'` |
| `TerminalLine` | Animated terminal log line with delay + accent | `from '@/components/cyber/TerminalLine'` |
| `SkeletonTable` | Table skeleton placeholder: `{rows, columns}` props | `from '@/components/cyber/SkeletonTable'` |
| `SkeletonCard` | Card skeleton placeholder: `{height?}` prop | `from '@/components/cyber/SkeletonCard'` |
| `DataChart` | SVG donut/line chart with cyberpunk gradients | `from '@/components/cyber/DataChart'` |

### Toast notifications
- **Store**: `useToastStore` (Zustand) — `toast(message, type?)` 
- **Imperative**: `toast(message, 'error' | 'success' | 'info')` (no hook needed)
- **Container**: `<ToastContainer />` — mounted in `App.tsx`
- **Theme**: error=fuchsia, success=cyan, info=purple on glass backgrounds
- **Auto-dismiss**: 5s, click X to dismiss early

```typescript
import { toast } from '@/shared/lib/toast';
toast('Resource created', 'success');
toast('Failed to save', 'error');
```

### Motion helpers (`src/shared/lib/motion.ts`)
| Variant | Use case |
|---------|----------|
| `fadeIn`, `crtOn` | Page enter transitions |
| `staggerContainer`, `staggerItem` | Item list animations |
| `cardStaggerContainer`, `cardStaggerItem` | Card grid stagger (scale+fade) |
| `listStaggerContainer`, `listStaggerItem` | Table row stagger (y-slide) |
| `modalEnter` | Dialog enter/exit (scale+fade) |
| `slideInRight` | Detail panel slide-in |
| `glitch`, `scanlineSweep`, `cursorBlink` | Cyberpunk effects |

---

## MIGRATION NOTES (frontend-remake → gestion-del-fin-frontend)

Visual-only migration completed:
- ✅ Toast notification system (adapted from brutalist → cyberpunk theme)
- ✅ SkeletonTable and SkeletonCard components
- ✅ Enhanced motion animation helpers (card stagger, list stagger, modal enter, slide-in)
- ⚠️ Page-level animations not applied (large refactor, applied per-module as needed)
- ⚠️ Recharts theme not migrated (existing `DataChart` SVG component is sufficient)

---

## ENV

```
VITE_API_URL=/api          # proxied to localhost:3000 in dev
VITE_APP_NAME=Gestión del Fin
VITE_SESSION_TIMEOUT_MS=1200000   # 20 min
```
