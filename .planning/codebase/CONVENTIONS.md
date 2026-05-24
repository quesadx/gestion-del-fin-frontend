# Coding Conventions

**Analysis Date:** 2026-05-24

## Naming Patterns

**Files:**
- `PascalCase` for components and pages: `DashboardOverview.tsx`, `LoginPage.tsx`, `AuthLayout.tsx`
- `lowercase` / `camelCase` for utilities and libraries: `api.ts`, `utils.ts`
- `index.ts` for barrel re-exports: `src/store/index.ts`

**Functions:**
- `camelCase` for all functions: `formatDate`, `handleLogout`, `setAuth`, `resetForm`
- `camelCase` for React hooks (custom): `useAuthStore`, `useCampStore`
- Event handlers prefixed with `handle`: `handleLogout`, `handleSubmit`, `handleEditClick`, `handleCreateExpedition`
- Mutation names follow `<action><Entity>Mutation` pattern: `createExpMutation`, `deletePersonMutation`, `adjustMutation`, `reviewMutation`

**Variables:**
- `camelCase` for locals: `isLoading`, `currentCampId`, `selectedAdmissionId`
- `UPPER_SNAKE_CASE` for enum values: `SYSTEM_ADMIN`, `HEALTHY`, `CRITICAL`
- Boolean flags prefixed with `is` or `has`: `isLoading`, `isAuditOpen`, `isModalOpen`, `isAuditLoading`

**Types/Interfaces:**
- `PascalCase` for interfaces: `Camp`, `User`, `Resource`, `InventorySnapshot`, `Person`, `Admission`, `Expedition`
- `PascalCase` for enums: `UserRole`
- Store state interfaces named `[Domain]State`: `AuthState`, `CampState`
- String literal unions for statuses: `'ACTIVE' | 'ABANDONED'`, `'PENDING' | 'APPROVED' | 'REJECTED'`

## Code Style

**Formatting:**
- No `.prettierrc` or `.eslintrc` detected — formatting is enforced implicitly through code review
- Inconsistent brace style: some components use `{StrictMode}` (space after `{`), while most use `{strictMode}` (no space)
- Indentation: 2 spaces consistently throughout
- Semi-colons used at end of statements in non-JSX code
- JSX props wrapped in quotes when strings, braces when expressions
- Long JSX attributes broken onto separate lines with the closing `>` on its own line for complex elements

**Linting:**
- `tsc --noEmit` used as the lint command (`package.json` line 12: `"lint": "tsc --noEmit"`)
- No dedicated linter (ESLint, Biome) configured
- TypeScript strictness: `noEmit: true`, `skipLibCheck: true`, `isolatedModules: true`

## Import Organization

**Observed patterns across all files:**

1. **React/Third-party** — React, react-router-dom, @tanstack/react-query, react-hook-form
2. **Internal modules** — `../../lib/api`, `../../store`, `../../types`, `../../lib/utils`
3. **Icons** — lucide-react icons
4. **Animation** — `motion/react`

Example from `src/features/inventory/InventoryList.tsx`:
```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useCampStore } from '../../store';
import { InventorySnapshot } from '../../types';
import { Package, AlertTriangle, ... } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatQuantity } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
```

**Path Aliases:**
- `@/*` maps to `./*` (project root) — configured in both `tsconfig.json` line 19 and `vite.config.ts` line 15
- Despite alias being available, all internal imports use **relative paths** (`../../lib/api`, `../store`, `../types`) — the `@/` alias is never used in source files

## Error Handling

**Patterns:**
- **API error handling** uses a single catch in the interceptor (`src/lib/api.ts` line 34-42) — 401 responses redirect to `/login`
- **Form submission errors** caught with `catch (err: any)` and set to local error state (`src/features/auth/LoginPage.tsx` lines 44-45):
  ```typescript
  } catch (err: any) {
    setError(err.response?.data?.error?.message || 'Authentication failed. Check credentials.');
  }
  ```
- **Mutations** lack explicit `onError` handlers — errors silently fail in the UI (all mutations use `onSuccess` only)
- **Server-side** (`server.ts`) returns `res.status(400).json({ error: ... })` for validation errors and `res.status(404).json({ message: ... })` for not-found
- `window.confirm()` used as delete confirmation (`PopulationRoster.tsx` line 297, `ExpeditionList.tsx` line 229/248)

## Logging

**Framework:** `console.log` only (no structured logging)

**Patterns:**
- Single production console.log in `server.ts` line 487 for server startup
- No client-side console logging present
- No logging framework (winston, pino, etc.)

## Comments

**When to Comment:**
- JSDoc comments on exported utility functions (`src/lib/utils.ts` lines 4, 11, 22):
  ```typescript
  /**
   * Merges Tailwind classes safely
   */
  export function cn(...inputs: ClassValue[]) { ... }
  ```
- Section labels in server.ts: `// --- AUTH ROUTES ---`, `// --- MOCK DATABASE ---`
- Inline comments for normalization logic (`PopulationRoster.tsx` line 59: `// Normalize string status`)
- Comments are sparse in component files — code is expected to be self-documenting

**JSDoc/TSDoc:**
- Used only for exported utility functions in `src/lib/utils.ts`
- Not used for components or store hooks

## Function Design

**Size:** Most component functions are large (100–480 lines), containing markup, logic, and state management inline. Feature components average ~300 lines.

**Parameters:**
- Store hooks use destructured returns: `const { user, logout } = useAuthStore()`
- Component props use inline type annotations for local sub-components:
  ```typescript
  const ProtectedRoute = ({ children, roles }: { children: ReactNode, roles?: string[] }) => { ... }
  ```

**Return Values:**
- Components return JSX directly
- API helper functions return promises with appropriate types
- Store hooks return `void` for actions (`setAuth`, `logout`, `setCurrentCamp`)

## Component Structure Pattern

Components consistently follow this pattern:
1. **Imports** (organized as described above)
2. **Schemas** (if using react-hook-form + zod): `loginSchema`
3. **Type aliases**: `type LoginForm = z.infer<typeof loginSchema>`
4. **Component function**: `export default function ComponentName() {`
5. **Store/query hooks** at the top: `const { currentCampId } = useCampStore()`
6. **State declarations** grouped together: `const [isModalOpen, setIsModalOpen] = useState(false)`
7. **Query definitions** with `useQuery` / `useMutation`
8. **Helper functions**: `handleSubmit`, `openCreateModal`, `resetForm`
9. **Return JSX** with conditional rendering based on loading/empty states

## Module Design

**Exports:**
- **Default exports** for page/layout components: `export default function LoginPage()`
- **Named exports** for shared components: `export function Skeleton({...})` and `export function SkeletonCard()`
- **Named exports** for utilities: `export function cn(...)` and `export const apiClient`
- **Named exports** for hooks: `export const useAuthStore` and `export const useCampStore`

**Barrel Files:**
- `src/store/index.ts` re-exports all store hooks from a single file (both `useAuthStore` and `useCampStore` defined there)
- No other barrel/index files detected

## Schema & Validation

**Form Validation:**
- `react-hook-form` with `zod` for form validation
- Schema defined with `z.object()` at module scope:
  ```typescript
  const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  });
  ```
- Type extracted with `z.infer<typeof loginSchema>`: `type LoginForm = z.infer<typeof loginSchema>`
- Used via `useForm<LoginForm>({ resolver: zodResolver(loginSchema) })`

**Type Definitions:**
- All domain models in `src/types.ts` as interfaces with TypeScript string literal unions
- No runtime validation of API responses — response data typed with generic parameters or `any`

## CSS / Styling Conventions

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- Custom theme tokens in `src/index.css` using `@theme` directive
- Custom colors: `--color-brand-primary` (red), `--color-brand-secondary` (amber), `--color-brand-accent` (green)
- Custom surface colors: `--color-surface-base`, `--color-surface-raised`, `--color-surface-overlay`
- Utility CSS classes for recurring patterns: `.brutalist-border` (`@apply border border-zinc-800`)
- `cn()` helper from `src/lib/utils.ts` used for conditional className merging via `clsx` + `tailwind-merge`
- Consistent dark theme with zinc palette; no light mode support

---

*Convention analysis: 2026-05-24*
