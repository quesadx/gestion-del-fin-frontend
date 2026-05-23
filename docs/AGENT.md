# AGENT CONTEXT — Gestión del Fin · Tactical Command Interface

> Updated 2026-05-23 — Phase 01 Tactical UI Redesign

Always read this file. Load additional context docs based on your current task.

---

## CONTEXT LOADING GUIDE

| Working on...                         | Load                |
| ------------------------------------- | ------------------- |
| Any UI component, styles, animations  | `@DESIGN_SYSTEM.md` |
| API calls, queries, mutations, stores | `@API_CONTRACT.md`  |
| Auth, guards, roles, session          | `@ROLES_ACCESS.md`  |
| Planning, checklist, deliverables     | `@MILESTONES.md`    |

---

## PROJECT SUMMARY

**Name:** Gestión del Fin
**Type:** Multi-camp zombie apocalypse resource management web app
**Visual:** Holographic tactical command center interface
**Language:** TypeScript — strict mode, no `any`
**Context:** University final project, EIF209 Programming IV, Universidad Nacional de Costa Rica 2026

### Domain glossary

- **Camp** — one isolated tenant. Like a "company" in a multi-tenant system.
- **Survivor** — a person in the camp. Has a role/profession and a condition.
- **Condition** — `healthy | injured | sick | away`. Affects work capacity.
- **Resource** — anything in the warehouse: food, water, medicine, ammo, hygiene.
- **Ration** — daily food/water consumed per person. Collected and distributed automatically.
- **Exploration** — scheduled group mission outside camp to gather resources.
- **Transfer** — sending resources or people between camps. Requires dual approval.

---

## TECH STACK

| Layer          | Technology                 | Version    | Purpose                        |
| -------------- | -------------------------- | ---------- | ------------------------------ |
| Framework      | React                      | 18         | UI rendering                   |
| Language       | TypeScript                 | 5.x strict | Type safety                    |
| Build          | Vite                       | 5.x        | Dev server + bundler           |
| Routing        | React Router DOM           | 6.x        | Client-side routing            |
| Styling        | TailwindCSS                | 3.x        | Utility-first CSS              |
| UI Components  | Shadcn/ui                  | latest     | Accessible primitives          |
| Animations     | Framer Motion              | 11.x       | Page + micro animations        |
| Charts         | Recharts                   | 2.x        | Dashboard metrics              |
| Client state   | Zustand                    | 4.x        | Auth, camp, UI state only      |
| Server state   | TanStack Query             | 5.x        | API cache, loading, errors     |
| HTTP transport | Axios                      | 1.x        | HTTP client + JWT interceptors |
| Forms          | React Hook Form + Zod      | latest     | Validation + type-safe forms   |
| Testing        | Playwright                 | latest     | E2E tests                      |
| Linting        | ESLint + Prettier + CSpell | —          | Code quality                   |
| Deployment     | Vercel                     | —          | Hosting                        |

### State management split — critical rule

```
Zustand  → client state only: auth session, active camp, UI (modals, sidebar, emotional)
TanStack Query → server state: survivors, resources, explorations, transfers, dashboard data
```

Never store API response data in Zustand. Never fetch data inside Zustand actions.

### Environment variables

```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME="Gestión del Fin"
VITE_SESSION_TIMEOUT_MS=1200000
```

### Path alias

- `@/` → `src/`

---

## VISUAL CONCEPT (summary)

The entire UI is a holographic tactical command center interface — glass panels, cyan/blue
accents, dynamic ambient backgrounds with cursor-reactive glow and scanner sweeps. The
interface feels alive, reactive, and technologically sophisticated.

Supports dark mode (default) and light mode via a toggle. The interface reacts emotionally
to camp health: stable (cyan/blue, calm), alert (amber accents, faster scanners), critical
(red accents, subtle glitch overlay).

→ Full tokens, components, and animation specs in `@DESIGN_SYSTEM.md`

---

## FOLDER STRUCTURE

```
src/
│
├── app/                            # Global configuration
│   ├── App.tsx                     # Root component — TacticalBackground + ThemeToggle
│   ├── AppRouter.tsx               # Route definitions
│   ├── providers.tsx               # QueryClientProvider + other providers
│   └── styles/
│       ├── tokens.css              # --gdf-* CSS custom properties (design tokens)
│       └── globals.css             # Tailwind directives + base resets + components
│
├── components/                     # Reusable UI components
│   ├── tactical/                   # NEW — glass holographic components
│   │   ├── GlassPanel.tsx          # Glass card wrapper
│   │   ├── TacticalButton.tsx      # 4-variant button system
│   │   ├── HoloLoader.tsx          # Holographic loading spinner
│   │   ├── TacticalBackground.tsx  # Dynamic ambient background
│   │   └── ThemeToggle.tsx         # Dark/light mode toggle
│   ├── cyber/                      # LEGACY — being migrated to tactical/
│   │   ├── Panel.tsx               # → GlassPanel
│   │   ├── GlitchButton.tsx        # → TacticalButton
│   │   ├── StatusBadge.tsx         # Restyled in-place
│   │   ├── ScreenLoader.tsx        # → HoloLoader
│   │   └── ... (8 unused, scheduled for deletion)
│   ├── ui/                         # shadcn/ui primitives
│   └── navigation/                 # LEGACY — unused, scheduled for deletion
│
├── features/                       # Business domain modules
│   ├── ui/                         # UI state (emotional, theme)
│   │   ├── store/emotional.store.ts
│   │   ├── hooks/useEmotionalSyncer.ts
│   │   └── index.ts
│   ├── auth/
│   ├── camps/
│   ├── people/
│   ├── inventory/
│   ├── explorations/
│   └── dashboard/
│
├── hooks/                          # Shared hooks
│   ├── useTheme.ts                 # Dark/light mode toggle
│   └── useNavItems.ts
│
├── layouts/
│   └── AppShell.tsx                # Glass sidebar + header + Outlet
│
├── routes/
│   └── AppRoutes.tsx
│
└── shared/                         # Truly cross-cutting code
    ├── api/
    │   └── axiosInstance.ts        # Base Axios client + JWT interceptors
    ├── lib/
    │   ├── motion.ts               # Framer Motion animation variants
    │   ├── queryClient.ts          # TanStack QueryClient
    │   └── roleGuards.ts
    └── utils/
```

### Where does new code go?

- **Only exists because of one feature?** → `features/[feature]/`
- **Used by 2+ features?** → `shared/`
- **Global config, routing, providers?** → `app/`
- **New tactical visual component?** → `components/tactical/`

---

## CODE CONVENTIONS (unchanged)

- No `any`. No `as any`. TypeScript strict always on.
- No `console.log` — use `shared/utils/logger.ts`
- No raw `fetch` or `axios` calls in components — use query hooks
- No API response data in Zustand stores
- No `new Date()` or `Date.now()` for business logic — use server time
- All forms: `react-hook-form` + `zod` resolver
- Named exports for components, never default exports
- All async functions have explicit error handling
- `pnpm check` before every commit
