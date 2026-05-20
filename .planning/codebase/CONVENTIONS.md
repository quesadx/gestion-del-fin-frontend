# Coding Conventions

**Analysis Date:** 2026-05-19

## Naming Patterns

**Files:**

- Component files: PascalCase matching component name (e.g., `GlitchButton.tsx`, `RoleGate.tsx`)
- Hook files: camelCase with `use` prefix (e.g., `useCamps.ts`, `useAuth.ts`, `useNavItems.ts`)
- Type definition files: `*.types.ts` inside `types/` directory (e.g., `camp.types.ts`, `auth.types.ts`)
- API files: `*.api.ts` inside `api/` directory (e.g., `camps.api.ts`, `auth.api.ts`)
- Store files: `*.store.ts` inside `store/` directory (e.g., `auth.store.ts`, `camp.store.ts`)
- Page components: `*Page.tsx` inside `pages/` directory (e.g., `CampsPage.tsx`, `LoginPage.tsx`)
- Utility/lib files: kebab-case (e.g., `error-capture.ts`, `queryClient.ts`, `use-mobile.tsx`)
- Barrel export files: always `index.ts`

**Functions:**

- camelCase for all functions (e.g., `handleCampChange`, `onSubmitCreate`, `useCampStore`)
- Hook functions: `use` prefix (e.g., `useCamps`, `useAuth`, `useNavItems`, `useCreateCamp`)
- API service objects: camelCase with `Api` suffix (e.g., `campsApi`, `authApi`, `inventoryApi`)

**Variables:**

- camelCase for all variables (e.g., `activeCamp`, `searchTerm`, `mutation`, `createCampMutation`)
- Boolean flags: `is` or `has` prefix (e.g., `isLoading`, `isError`, `isLocked`, `hasHydrated`, `isHandling401`)
- Event handlers: `handle` prefix (e.g., `handleSubmit`, `handleDelete`, `handleCampChange`, `handleLogout`)
- Query keys: UPPER_SNAKE_CASE constants (e.g., `const CAMPS_KEY = ['camps'] as const`)
- Ref objects: `navigationRef`

**Types/Interfaces:**

- PascalCase for all types and interfaces (e.g., `AuthState`, `CampState`, `LoginFormValues`)
- Form value types: `<Name>FormValues` pattern (e.g., `CreateCampFormValues`, `LoginFormValues`)
- DTO types: `<Action><Name>Dto` pattern (e.g., `CreateCampDto`, `UpdateCampDto`, `ManualAdjustmentDto`)
- Component props interfaces: inline interfaces named `Props` or `ComponentNameProps` (e.g., `PanelProps`, `SkeletonTableProps`)
- Zod schema variables: camelCase (e.g., `createCampSchema`, `loginSchema`)

**Environment variables:**

- UPPER*SNAKE_CASE with `VITE*`prefix (e.g.,`VITE_API_URL`, `VITE_SESSION_TIMEOUT_MS`)

## Code Style

**Formatting:**

- Tool: Prettier v3.8.1
- Config file: `.prettierrc`
- Key settings:
  - `semi: true` — semicolons required
  - `singleQuote: true` — single quotes for strings
  - `trailingComma: "all"` — trailing commas everywhere
  - `printWidth: 100` — 100 character line width
  - `tabWidth: 2` — 2 spaces per indent
  - `arrowParens: "always"` — parentheses around arrow function params
  - `bracketSpacing: true` — spaces inside object literals
  - `endOfLine: "auto"` — auto-detect line endings

**Format command:** `pnpm format` (runs `prettier --write src/`)

**Linting:**

- Tool: ESLint v9 (flat config) with `typescript-eslint` v8
- Config file: `eslint.config.js`
- Extends:
  - `@eslint/js` recommended
  - `typescript-eslint` recommended
  - `eslint-plugin-react-hooks` flat recommended
  - `eslint-plugin-react-refresh` (Vite)
  - `eslint-config-prettier` (disables conflicting rules)
- Plugin: `eslint-plugin-prettier` — Prettier violations are ESLint errors
- Ignores: `dist/`, `reference-frontend/**`, `neon-nova-dashboard/**`, `temp/**`
- Files matched: `**/*.{ts,tsx}`
- `ecmaVersion: 2020`, `globals.browser`
- **Lint command:** `pnpm lint` (runs `eslint . --max-warnings 0`)
- **Fix command:** `pnpm lint:fix` (runs `eslint . --fix`)

**Spell Checking:**

- Tool: CSpell v9.7.0
- Config file: `cspell.json`
- Language: `en` with dictionaries: `typescript`, `node`, `css`
- Custom words include project-specific terms: `Zustand`, `tanstack`, `shadcn`, `recharts`, `tailwindcss`, `framer`, `phosphor`, `axiosInstance`, `campId`, `authStore`, `campStore`, `uiStore`, `queryClient`, `staleTime`, `system_admin`, `resource_manager`, `travel_lead`, `crtOn`, `staggerItem`, `staggerContainer`, `scanlines`, role names, component names like `GlitchButton`, `Panel`, `StatusBadge`, `ScreenLoader`, etc.
- Ignores: `node_modules/`, `dist/`, `*.lock`, `*.json`, `*.md`, `neon-nova-dashboard/`, `temp/`
- **Spell command:** `pnpm spell` (runs `cspell --config ./cspell.json "src/**/*.{ts,tsx}"`)

**TypeScript:**

- Strict mode: **enabled** (`tsconfig.app.json` and `tsconfig.node.json` both have `"strict": true`)
- Additional rigor flags:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`
  - `noUncheckedSideEffectImports: true`
- Path alias: `@/*` → `./src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`)
- Module: ESNext with bundler resolution
- JSX: `react-jsx` transform
- Target: ES2023
- **No `any` or `as any`** — TypeScript strict enforces this convention
- Check before commit: `pnpm check` (runs `pnpm run lint && pnpm run spell && pnpm run build`)

## Import Organization

**Order (enforced by AGENTS.md convention):**

1. React / React core (e.g., `import { useState } from 'react'`)
2. Third-party libraries (e.g., `import { useQuery } from '@tanstack/react-query'`, `import { z } from 'zod'`)
3. `@/` prefixed imports — features (e.g., `import { useCamps } from '@/features/camps/hooks/useCamps'`)
4. `@/` prefixed imports — shared/utilities (e.g., `import { toast } from '@/shared/lib/toast'`, `import { cn } from '@/lib/utils'`)
5. Relative/local imports (`./local`, `../sibling`)

**Path Aliases:**

- `@/*` → `src/*` (the only alias used throughout the codebase)
- Never use relative paths like `../../../features/auth/store/auth.store` — always use `@/features/auth/store/auth.store`

**Type-only imports:** Use `import type` for type-only imports (e.g., `import type { AuthUser, Role } from '@/features/auth/types/auth.types'`)

**Export pattern:** Named exports only. **No default exports.** This is a hard convention — `grep -r "export default" src/` returns zero results.

## Component Patterns

**Component structure (declared in AGENTS.md):**

1. Hooks (useState, useAuth, useForm, custom hooks)
2. Derived state (useMemo, computed values)
3. Event handlers (handleSubmit, handleDelete)
4. JSX (the render)

**Export:** Always named function export (e.g., `export function CampsPage()` not `export default function`)

**Props:** TypeScript interfaces defined inline above the component function, named `Props` or `ComponentNameProps`:

```typescript
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'warning' | 'danger';
}
```

**File-per-component:** Each component gets its own file, even single-file reusable components like `StatusBadge.tsx`.

**Conditional rendering:** Pattern `{condition && <Component />}` or `{condition ? <A /> : <B />}`, never `if (condition) return <A />` inside JSX blocks.

**Loading state:** Display `<ScreenLoader />` from `@/components/cyber/ScreenLoader` for full-page loading states. Table loading uses `<SkeletonTable rows={N} columns={M} />` and `animate-pulse`.

**Error state:** Try/catch in async handlers, store error as local state, render inline error panel:

```typescript
const [createError, setCreateError] = useState<string | null>(null);
// ...
try {
  await createCampMutation.mutateAsync(values);
  toast('Camp created successfully', 'success');
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Creation failed';
  setCreateError(message);
}
// Render:
{createError && (
  <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
    {createError}
  </div>
)}
```

**Empty state:** If array is empty, show a centered icon + message + action button. Always guard array operations with `Array.isArray(data)` before `.map`/`.filter`/`.reduce`:

```typescript
const campsArray = Array.isArray((campsData as Record<string, unknown>)?.data)
  ? ((campsData as Record<string, unknown>).data as Record<string, unknown>[])
  : [];
```

**Lazy loading:** All page components are lazy-loaded in `src/routes/AppRoutes.tsx` using `React.lazy()` with named import unwrapping:

```typescript
const CampsPage = lazy(() =>
  import('@/features/camps/pages/CampsPage').then((m) => ({ default: m.CampsPage })),
);
```

**Animation:** Components use Tailwind CSS animation classes (`animate-fade-in`, `animate-slide-up`, `animate-slide-in-right`, `animate-blink`) defined in `tailwind.config.js`. Framer Motion variants are centralized in `src/shared/lib/motion.ts`.

## Forms (react-hook-form + zod)

**All forms in the project follow this exact pattern:**

1. **Zod schema** defined above the component:

```typescript
const createCampSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'ABANDONED']).default('ACTIVE'),
  ai_context_prompt: z.string().optional(),
});
type CreateCampFormValues = z.infer<typeof createCampSchema>;
```

2. **useForm hook** with resolver:

```typescript
const {
  register,
  handleSubmit,
  reset,
  formState: { errors },
} = useForm<CreateCampFormValues>({
  resolver: resolved(createCampSchema),
  defaultValues: { name: '', location: '', status: 'ACTIVE', ai_context_prompt: '' },
});
```

The `resolved()` helper from `@/shared/lib/form` is a type-safe wrapper around `zodResolver`.

3. **Form submission:** Async handler with try/catch, calls mutation's `mutateAsync`:

```typescript
const onSubmitCreate = async (values: CreateCampFormValues) => {
  setCreateError(null);
  try {
    await createCampMutation.mutateAsync(values);
    toast('Camp created successfully', 'success');
    reset();
    setCreateDialogOpen(false);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Creation failed';
    setCreateError(message);
  }
};
```

4. **Form fields** use `{...register('fieldName')}` spread pattern with inline labels and error display:

```typescript
<label className="block mb-1.5 text-[10px] tracking-[0.2em] ...">NAME //</label>
<input {...register('name')} type="text" placeholder="NORTH CAMP" className="..." />
{errors.name && (
  <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
    {errors.name.message}
  </p>
)}
```

## State Management Rules

**Hard split (declared in AGENTS.md):**

| Concern                                             | Tool           | Scope               |
| --------------------------------------------------- | -------------- | ------------------- |
| Auth state, UI state, active camp, toast            | Zustand        | Client state only   |
| API data: camps, people, inventory, resources, etc. | TanStack Query | Server state always |

**Rules:**

- Never store API response data in Zustand
- Never fetch inside Zustand actions
- Zustand stores live in `src/features/<domain>/store/*.store.ts`
- TanStack Query hooks live in `src/features/<domain>/hooks/*.ts`

**Zustand pattern:**

```typescript
import { create } from 'zustand';

interface CampState {
  activeCamp: { id: number; name?: string } | null;
  setActiveCamp: (camp: { id: number; name?: string } | null) => void;
}

export const useCampStore = create<CampState>()((set) => ({
  activeCamp: null,
  setActiveCamp: (camp) => set({ activeCamp: camp }),
}));
```

Auth store uses `persist` middleware with localStorage key `'gdf.auth'` and `partialize` to only persist user, token, role.

**TanStack Query pattern:**

```typescript
const CAMPS_KEY = ['camps'] as const;

export function useCamps(query?: PaginationQuery & { enabled?: boolean }) {
  const { enabled, ...params } = query ?? {};
  return useQuery({
    queryKey: [...CAMPS_KEY, params] as const,
    queryFn: () => campsApi.getAll(Object.keys(params).length > 0 ? params : undefined),
    enabled: enabled !== false,
  });
}

export function useCreateCamp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampDto) => campsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPS_KEY });
    },
  });
}
```

**QueryClient defaults** (`src/shared/lib/queryClient.ts`):

- `staleTime: 30_000` (30 seconds)
- `retry: 2` for queries
- `retry: 0` for mutations
- `refetchOnWindowFocus: true`

## Error Handling

**API layer:** Axios interceptor handles 401 responses by logging out and redirecting to `/login`. Uses a `navigationRef` from `axiosInstance.ts` to navigate outside React components.

**Component layer:** Every async operation (form submit, delete, mutation) is wrapped in `try/catch` with `err: unknown` typed catch, pattern:

```typescript
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Operation failed';
  setError(message);
}
```

**Toast notifications** via Zustand-based system (`src/shared/lib/toast.tsx`):

- `toast('message', 'error')` — red/fuchsia border
- `toast('message', 'success')` — cyan border
- `toast('message', 'info')` — violet border
- Auto-dismiss after 5 seconds
- Rendered by `<ToastContainer />` in `App.tsx`

## Logging

**Framework:** Custom `[GDF]` prefixed logger (`src/shared/utils/logger.ts`)

- `logger.info()` and `logger.warn()` only log in `import.meta.env.DEV`
- `logger.error()` always logs

## Comments

**When to comment:**

- `// eslint-disable-next-line react-refresh/only-export-components` in files exporting non-component entities (e.g., `toast.tsx`, `form.tsx`)
- `/* PATH ALIASES (Fundamental ...)` comments in config files
- Inline type comments for cast-explanations only

**JSDoc/TSDoc:** Not used in this codebase.

## Function Design

**Parameters:** Destructured objects preferred for 3+ params. Mutation functions use object payloads:

```typescript
mutationFn: ({ campId, payload }: { campId: number; payload: CreatePersonDto }) =>
  peopleApi.create(campId, payload),
```

**Return Values:** Named exports always. Functions return explicit types (inferred via TypeScript strict, not explicitly annotated on callbacks).

**Size:** Components range from ~20 lines (StatusBadge, RoleGate) to ~425 lines (CampsPage with full CRUD + filtering + pagination). Hooks typically 30-60 lines. API files typically 7-25 lines.

## Module Design

**Exports:** Always named exports. No default exports anywhere in the codebase (verified by grep).

**Barrel files:** Every feature domain has an `index.ts` barrel export (`src/features/*/index.ts`) that re-exports API functions, hooks, stores, and types used externally. Example from `src/features/auth/index.ts`:

```typescript
export { authApi } from './api/auth.api';
export { authService } from './auth.service';
export { AuthProvider } from './auth-context';
export { useAuth } from './useAuth';
export { useAuthStore } from './store/auth.store';
export type { AuthUser, Role } from './types/auth.types';
```

**Feature module structure** (standard):

```
features/<domain>/
├── api/            # Axios call functions (*.api.ts)
├── components/     # Domain-specific UI
├── hooks/          # TanStack Query hooks (*.ts)
├── pages/          # Route page components (*Page.tsx)
├── store/          # Zustand stores (*.store.ts)
├── types/          # Domain types (*.types.ts)
└── index.ts        # Barrel export
```

## Design System (Brutalist Dark)

**Colors (from `tailwind.config.js`):**
| Token | Hex | Tailwind Class | Uses |
|-------|-----|----------------|------|
| `brand-primary` / `accent-primary` | `#ef4444` | `bg-accent-primary`, `border-accent-primary` | Alerts, active nav, primary buttons |
| `brand-secondary` / `accent-secondary` | `#f59e0b` | `bg-accent-secondary`, `text-accent-secondary` | Warnings, amber accents |
| `brand-accent` / `status-green` | `#10b981` | `bg-brand-accent` | Success, online status |
| `surface-base` | `#0a0a0a` | `bg-surface-base` | Main background |
| `surface-raised` | `#171717` | `bg-surface-raised` | Cards, sidebar |
| `surface-overlay` | `#262626` | `bg-surface-overlay` | Modals, dialogs |

**Typography (from `tailwind.config.js`):**

- `font-sans`: Inter (weight 400-900)
- `font-mono`: JetBrains Mono (weight 400-700)
- Utility classes documented in code: `.font-mono-data` (12px JetBrains Mono), `.font-mono-sm`, `.font-display`

**Animation keyframes (from `tailwind.config.js`):**

- `fade-in`: opacity 0→1 (0.3s)
- `slide-up`: opacity + translateY (0.35s)
- `slide-in-right`: opacity + translateX (0.3s)
- `blink`: opacity 1→0.3→1 (1.2s step-end infinite)

**CSS utility patterns:**

- `rounded-none` (brutalist sharp corners)
- `border border-zinc-800` or `border border-[oklch(...)]` for neoned borders
- `tracking-widest` / `tracking-[0.1em]` on UI labels
- `uppercase` on buttons, labels, badges
- `animate-blink` on status dots
- `animate-pulse` on loading skeletons

---

_Convention analysis: 2026-05-19_
