# Gestión del Fin — Frontend

Zombie apocalypse multi-camp resource management system. Universidad Nacional de Costa Rica final project (EIF209, 2026).

## Stack

- **React 19** / **TypeScript** (strict) / **Vite 8**
- **Tailwind CSS 3** / **shadcn/ui**
- **TanStack Query 5** / **Zustand 5**
- **Axios** / **react-hook-form** + **zod**

## Quick Start

```bash
nix develop          # enter Nix shell
pnpm install         # install dependencies
pnpm dev             # vite dev server → http://localhost:5173
pnpm build           # tsc + vite production build
pnpm check           # lint + spell + build — run before commit
pnpm format          # prettier src/
```

## Architecture

```
src/
├── app/             # Global styles
├── features/        # Business domains (auth, camps, people, inventory, etc.)
│   ├── api/         # Axios call functions
│   ├── hooks/       # TanStack Query hooks
│   ├── pages/       # Route pages
│   ├── store/       # Zustand stores (client state only)
│   └── types/       # Domain types
├── components/      # Reusable UI (cyber/, ui/, navigation/)
├── layouts/         # AppShell (sidebar + header + content)
├── routes/          # Router + ProtectedRoute + ErrorBoundary
├── shared/          # Axios instance, API types, toast, form helpers
└── lib/             # Utilities
```

### State split

- **Zustand** → client state only (auth, UI)
- **TanStack Query** → server state (camps, people, resources, etc.)

## Design

**Brutalist dark** — red (#ef4444) / amber (#f59e0b) / green (#10b981) on near-black (#0a0a0a).

## Env

```
VITE_API_URL=/api          # proxied to localhost:3000 in dev
VITE_APP_NAME=Gestión del Fin
VITE_SESSION_TIMEOUT_MS=1200000   # 20 min
```
