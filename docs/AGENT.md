# AGENT.md — Gestión del Fin · Frontend Core Context

> Always read this file. Load additional context docs based on your current task.

---

## CONTEXT LOADING GUIDE

| Working on... | Load |
|---|---|
| Any UI component, styles, animations | `@DESIGN_SYSTEM.md` |
| API calls, queries, mutations, stores | `@API_CONTRACT.md` |
| Auth, guards, roles, session | `@ROLES_ACCESS.md` |
| Planning, checklist, deliverables | `@MILESTONES.md` |

---

## PROJECT SUMMARY

**Name:** Gestión del Fin
**Type:** Multi-camp zombie apocalypse resource management web app
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

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 18 | UI rendering |
| Language | TypeScript | 5.x strict | Type safety |
| Build | Vite | 5.x | Dev server + bundler |
| Routing | React Router DOM | 6.x | Client-side routing |
| Styling | TailwindCSS | 3.x | Utility-first CSS |
| UI Components | Shadcn/ui | latest | Accessible primitives |
| Animations | Framer Motion | 11.x | Page + micro animations |
| Charts | Recharts | 2.x | Dashboard metrics |
| Client state | Zustand | 4.x | Auth, camp, UI state only |
| Server state | TanStack Query | 5.x | API cache, loading, errors |
| HTTP transport | Axios | 1.x | HTTP client + JWT interceptors |
| Forms | React Hook Form + Zod | latest | Validation + type-safe forms |
| Testing | Playwright | latest | E2E tests |
| Linting | ESLint + Prettier + CSpell | — | Code quality |
| Deployment | Vercel | — | Hosting |

### State management split — critical rule
```
Zustand  → client state only: auth session, active camp, UI (modals, sidebar)
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

The entire UI lives inside a **wrist-mounted Cold War military terminal** — think PIP-Boy meets Soviet ELORG hardware. The device bezel is always visible. The screen inside is monochromatic phosphor green with pixelated fonts and CRT scanlines.

→ Full tokens, fonts, and animation specs in `@DESIGN_SYSTEM.md`

---

## FOLDER STRUCTURE

```
src/
│
├── app/                            # Global configuration
│   ├── App.tsx                     # Root component
│   ├── AppRouter.tsx               # Route definitions
│   ├── providers.tsx               # QueryClientProvider + other providers
│   └── styles/
│       ├── tokens.css              # CSS custom properties (design tokens)
│       ├── fonts.css               # @font-face imports
│       ├── scanlines.css           # CRT overlay effect
│       └── globals.css             # Tailwind directives + base resets
│
├── features/                       # Business domain modules
│   │
│   ├── auth/
│   │   ├── api/
│   │   │   └── auth.api.ts         # login, logout, verifySession (plain Axios fns)
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── LockScreen.tsx
│   │   ├── hooks/
│   │   │   └── useInactivity.ts    # 20-min idle timer
│   │   ├── pages/
│   │   │   └── LoginPage.tsx
│   │   ├── store/
│   │   │   └── auth.store.ts       # Zustand: user, token, role, isLocked
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts                # Barrel export
│   │
│   ├── camps/
│   │   ├── api/
│   │   │   ├── camps.api.ts
│   │   │   └── transfers.api.ts
│   │   ├── components/
│   │   │   ├── CampCard.tsx
│   │   │   └── TransferRequestForm.tsx
│   │   ├── hooks/
│   │   │   ├── useCamps.ts         # useQuery: list camps
│   │   │   └── useTransfers.ts     # useQuery + useMutation: transfers
│   │   ├── pages/
│   │   │   ├── CampsPage.tsx
│   │   │   └── TransfersPage.tsx
│   │   ├── store/
│   │   │   └── camp.store.ts       # Zustand: activeCamp, serverTime only
│   │   ├── types/
│   │   │   └── camp.types.ts
│   │   └── index.ts
│   │
│   ├── people/
│   │   ├── api/
│   │   │   └── people.api.ts
│   │   ├── components/
│   │   │   ├── SurvivorCard.tsx
│   │   │   ├── ConditionBadge.tsx
│   │   │   └── AIAnalysisPanel.tsx # AI decision + reasoning display
│   │   ├── hooks/
│   │   │   ├── usePeople.ts        # useQuery: list + detail survivors
│   │   │   └── useAIDecision.ts    # useMutation: trigger AI evaluation
│   │   ├── pages/
│   │   │   ├── PeopleListPage.tsx
│   │   │   ├── PersonDetailPage.tsx
│   │   │   └── PersonIngressPage.tsx
│   │   ├── types/
│   │   │   └── person.types.ts
│   │   └── index.ts
│   │
│   ├── inventory/
│   │   ├── api/
│   │   │   └── resources.api.ts
│   │   ├── components/
│   │   │   ├── InventoryTable.tsx
│   │   │   ├── LowStockAlert.tsx   # Derived from query data, not store
│   │   │   └── ResourceEntryForm.tsx
│   │   ├── hooks/
│   │   │   └── useResources.ts     # useQuery + useMutation: inventory
│   │   ├── pages/
│   │   │   ├── InventoryPage.tsx
│   │   │   └── ResourceDetailPage.tsx
│   │   ├── types/
│   │   │   └── resource.types.ts
│   │   └── index.ts
│   │
│   ├── explorations/
│   │   ├── api/
│   │   │   └── explorations.api.ts
│   │   ├── components/
│   │   │   ├── ExplorationCard.tsx
│   │   │   └── ExplorationTimeline.tsx
│   │   ├── hooks/
│   │   │   └── useExplorations.ts  # useQuery + useMutation
│   │   ├── pages/
│   │   │   └── ExplorationsPage.tsx
│   │   ├── types/
│   │   │   └── exploration.types.ts
│   │   └── index.ts
│   │
│   └── dashboard/
│       ├── components/
│       │   ├── ResourceChart.tsx
│       │   ├── SurvivorStats.tsx
│       │   └── RationTracker.tsx
│       ├── hooks/
│       │   └── useDashboard.ts     # useQuery: aggregated metrics
│       ├── pages/
│       │   └── DashboardPage.tsx   # system_admin + resource_manager only
│       └── index.ts
│
└── shared/                         # Truly cross-cutting code
    │
    ├── api/
    │   └── axiosInstance.ts        # Base Axios client + JWT interceptors
    │
    ├── ui/                         # Design system primitives
    │   ├── device/
    │   │   ├── DeviceFrame.tsx
    │   │   ├── ScreenSurface.tsx
    │   │   └── StatusBar.tsx
    │   ├── PixelButton.tsx
    │   ├── TerminalText.tsx
    │   ├── PhosphorBadge.tsx
    │   ├── TacticalTable.tsx
    │   └── AlertBanner.tsx
    │
    ├── guards/
    │   ├── PrivateRoute.tsx
    │   ├── RoleGate.tsx
    │   └── SessionGuard.tsx
    │
    ├── hooks/
    │   ├── useServerTime.ts
    │   └── useRoleAccess.ts
    │
    ├── lib/
    │   ├── motion.ts               # Framer Motion animation constants
    │   ├── queryClient.ts          # TanStack QueryClient instance + config
    │   └── roleGuards.ts           # Role → allowed routes map
    │
    └── utils/
        ├── time.utils.ts
        ├── role.utils.ts
        └── logger.ts               # No console.log in production
```

### Feature barrel export pattern
```typescript
// features/inventory/index.ts
export { InventoryPage } from './pages/InventoryPage'
export { LowStockAlert } from './components/LowStockAlert'
export { useResources } from './hooks/useResources'
export type { Resource, ResourceType } from './types/resource.types'
```
```typescript
// Usage anywhere in the app
import { LowStockAlert, useResources } from '@/features/inventory'
```

### Where does new code go?
- **Only exists because of one feature?** → `features/[feature]/`
- **Used by 2+ features?** → `shared/`
- **Global config, routing, providers?** → `app/`

---

## CODE CONVENTIONS

### Language — English ONLY
All source code must be written in **English**:
- Variable, function, and type names
- Comments and docstrings
- Commit messages
- File and folder names

**Exception:** UI text displayed to users can be localized (Spanish, etc.), but code infrastructure is always English.

### Good practices checklist
Before writing any code:
- [ ] No `any` or `as any` — use explicit types
- [ ] No `console.log` — use `shared/utils/logger.ts`
- [ ] No magic numbers — extract to named constants
- [ ] Functions have single responsibility (max 20 lines)
- [ ] Error handling in all async functions
- [ ] Imports organized: react | libraries | features | shared | local
- [ ] Components use named exports only
- [ ] Types at top of file, component below
- [ ] No unused variables or imports

### Component file structure
```typescript
// 1. Imports — group: react | libraries | @/features | @/shared | ./local
// 2. Types / interfaces
// 3. Component as named function declaration (not arrow function)
// 4. Order inside: hooks → derived state/memos → handlers → return

export function SurvivorCard({ survivorId, onSelect }: Props) {
  // hooks first
  // derived state
  // handlers
  // JSX
}
```

### Naming
| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `SurvivorCard.tsx` |
| Hooks | camelCase + `use` prefix | `useResources.ts` |
| Query hooks | `use[Resource]` | `usePeople.ts`, `useResources.ts` |
| Stores | camelCase + `.store` suffix | `auth.store.ts` |
| API files | camelCase + `.api` suffix | `people.api.ts` |
| Types | PascalCase | `Survivor`, `Resource` |
| Constants | SCREAMING_SNAKE_CASE | `TIMEOUT_MS` |

### Hard rules
- No `any`. No `as any`. TypeScript strict always on.
- No `console.log` — use `shared/utils/logger.ts`
- No raw `fetch` or `axios` calls in components — use query hooks
- No API response data in Zustand stores
- No `new Date()` or `Date.now()` for business logic — use server time
- All forms: `react-hook-form` + `zod` resolver
- Named exports for components, never default exports
- All async functions have explicit error handling

---

## MIGRATION WORKFLOW (dummy -> real endpoints)

### Rules
- One endpoint per step (no multi-endpoint changes in the same commit).
- I must stop after each endpoint and wait for your test/commit confirmation.
- Each step includes: API function -> hook -> UI wiring -> quick test notes.
- If a step fails, revert only that step; do not touch other endpoints.

### Step output checklist
- Updated API function (features/[x]/api).
- Updated TanStack Query hook (features/[x]/hooks).
- Updated UI component(s) that used dummy data.
- Test notes: where to click, expected data, and error state check.
- Wait for your approval before continuing.

---

## TOOLING SETUP

### ESLint + Prettier + CSpell scripts (`package.json`)
```json
{
  "scripts": {
    "dev":      "vite",
    "build":    "tsc -b && vite build",
    "lint":     "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format":   "prettier --write src/",
    "spell":    "cspell 'src/**/*.{ts,tsx}'",
    "check":    "npm run lint && npm run spell && npm run build"
  }
}
```

Run `npm run check` before every commit.

→ Full ESLint, Prettier and CSpell config files in `@TOOLING.md`

---

## GAMIFICATION ELEMENTS

- **Threat Level** — sidebar widget (0–5) derived from low-stock query data + survivor conditions
- **Days Survived** — counter in StatusBar since camp creation
- **Achievement toasts** — `[ACHIEVEMENT UNLOCKED] — SUPPLY HOARDER` terminal style
- **Survivor proficiency** — XP badge on survivor cards (days active + tasks)
- **Camp health score** — aggregate metric in dashboard

---

## DO / DON'T

| DO | DON'T |
|---|---|
| Use TanStack Query for all server data | Store API responses in Zustand |
| Keep Zustand for auth, camp, UI state only | Use Zustand for inventory, people, explorations |
| Use `invalidateQueries` after mutations | Manually update Zustand after API calls |
| Call `queryClient.clear()` on camp switch | Manually reset each store on camp switch |
| Use server time for business logic timestamps | Use `Date.now()` / `new Date()` |
| Keep API functions in `features/[x]/api/` | Call Axios directly from components |
| Use `react-hook-form` + `zod` for forms | Use plain `useState` for form fields |
| Named exports for all components | Default exports for components |
| Run `npm run check` before committing | Skip linting |
| Show AI reasoning, let admin override | Auto-apply AI decisions |
| Animate every page transition | Render pages without transitions |
