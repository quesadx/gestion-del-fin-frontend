# AGENTS.md — Gestión del Fin · Frontend

> Read this first. Then load context doc per task.

---

## QUICK START

```bash
pnpm dev      # vite dev server → http://localhost:5173
pnpm build    # tsc + vite build
pnpm check    # lint + spell + build — run before commit
pnpm format   # prettier src/
```

---

## PROJECT

| Field   | Value                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Name    | Gestión del Fin                                                                                                                   |
| Type    | Zombie apocalypse multi-camp resource manager                                                                                     |
| Context | Univ final project · EIF209 · UNA Costa Rica 2026                                                                                 |
| Stack   | React 19 / TypeScript strict / Vite 8 / Tailwind 3 / TanStack Query 5 / Zustand 5 / shadcn/ui / Axios                             |
| Visual  | **Brutalist dark** — red (#ef4444) / amber (#f59e0b) / green (#10b981) on near-black (#0a0a0a)                                    |
| Auth    | JWT. Stored in Zustand (persisted to localStorage as `gdf.auth`). Axios interceptor attaches Bearer token, auto-redirects on 401. |
| Proxy   | Vite proxies `/api` → `http://localhost:3000` (dev)                                                                               |

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
│   ├── cyber/        # Shared visual components (Panel, GlitchButton, StatusBadge, Skeleton, Charts)
│   └── navigation/   # Sidebar, Navbar (legacy, unused in new layout)
├── hooks/            # Shared hooks
├── layouts/          # AppShell — sidebar + header + content (brutalist)
├── lib/              # Utilities
├── pages/            # Top-level page components
├── routes/           # Router + ProtectedRoute
└── shared/           # Cross-cutting (axios, api types, toast, motion, roleGuards)
```

**State split (hard rule):**

- Zustand → client state only (auth, UI)
- TanStack Query → server state (camps, people, resources, etc.)
- Never store API data in Zustand. Never fetch inside Zustand.

---

## DESIGN SYSTEM (Brutalist Dark)

### Colors

| Token             | Hex       | Uses                                        |
| ----------------- | --------- | ------------------------------------------- |
| `brand-primary`   | `#ef4444` | Alerts, active nav, primary buttons, errors |
| `brand-secondary` | `#f59e0b` | Warnings, transfers, amber accents          |
| `brand-accent`    | `#10b981` | Success, online status, completed           |
| `surface-base`    | `#0a0a0a` | Main background                             |
| `surface-raised`  | `#171717` | Cards, sidebar, tables                      |
| `surface-overlay` | `#262626` | Modals, dialogs                             |

### Typography

- **Inter** (weight 400-900) — body, headings, UI
- **JetBrains Mono** (weight 400-700) — data, labels, monospace

### Utility Classes

- `.brutalist-border` — `border border-zinc-800`
- `.neon-glow-red` — red text shadow
- `.glass` / `.glass-heavy` — solid raised panels (backward-compat)
- `.font-mono-data` — 12px JetBrains Mono

### Animation

- Keyframe CSS: `fade-in`, `slide-up`, `slide-in-right`, `blink`
- Framer Motion used inline in `src/shared/lib/toast.tsx` — no shared motion variants file

---

## LAYOUT

**AppShell** (`src/layouts/AppShell.tsx`):

- Fixed left sidebar (collapsible w-64 / w-16) with nav links, camp selector, user info, logout
- Sticky top header with clock + "NOMINAL SYSTEM" status dot
- `<Outlet />` in scrollable content area
- Red GF logo square in sidebar
- Active nav link: red right border + bg-zinc-800

---

## UI COMPONENTS

### Panel

Card wrapper. Props: `title?`, `tag?`, `status?`, `accent?` (cyan | purple), `children`. Uses `.glass` styling with corner brackets.

### GlitchButton

Button with variants: `primary` (red), `ghost` (transparent), `warning` (amber), `danger` (red border).

### StatusBadge

Inline badge with colored dot + text. Variants: `cyan` (red), `purple` (amber), `green`, `red`, `yellow`.

### StockBarChart

Recharts horizontal bar chart. Props: `data: StockBarEntry[]`, `height?`. Color-coded: CRITICAL=red, LOW=amber, OK=cyan.

### SkeletonTable / SkeletonCard

Loading placeholders with `animate-pulse`.

### Toast

Zustand-based notification system. Usage: `toast('message', 'error'|'success'|'info')`. Auto-dismiss 5s.

---

## CONVENTIONS

- All code in English (UI text in English)
- No `any` or `as any`. TypeScript strict.
- Named exports only (no default exports)
- Component order: hooks → derived state → handlers → JSX
- Imports order: react → libraries → @/features → @/shared → ./local
- All forms: react-hook-form + zod
- All async: explicit error handling
- Server time for business logic, not `Date.now()`
- `pnpm check` before every commit
- Before `.map`/`.filter`/`.reduce`: always `Array.isArray(data)`

---

## ENV

```
VITE_API_URL=/api          # proxied to localhost:3000 in dev
VITE_APP_NAME=Gestión del Fin
VITE_SESSION_TIMEOUT_MS=1200000   # 20 min
```
