# gestion-del-fin — Frontend

This repository contains the frontend for the gestion-del-fin application. The README below documents why the stack was chosen, the on-disk structure, where to find key pieces, and the standard developer workflows and checks.

**Goals:** concise onboarding for contributors, clear rationale for technology choices, and pointers to implementation and documentation.

**Stack selection**
- **Framework:** React 19 (concurrent features) — chosen for modern React capabilities and ecosystem compatibility.
- **Language:** TypeScript (strict) — prevents whole-class of runtime bugs and enables safe refactors.
- **Bundler / Dev Server:** Vite — extremely fast startup and HMR for developer productivity.
- **Styling:** Tailwind CSS — utility-first, consistent design tokens; PostCSS + Autoprefixer in build.
- **State & Data:** Zustand for lightweight UI/local state; TanStack React Query v5 for server state, caching and mutations.
- **Forms & Validation:** React Hook Form + Zod via @hookform/resolvers — performant forms with schema-driven validation.
- **HTTP client:** Axios — consistent request/response handling and interceptors kept in `src/lib/api.ts`.
- **UI building:** CVA for component variants, Framer Motion for animations, Lucide icons, and Recharts for visuals.
- **Tooling & Quality:** ESLint (strict, 0 warnings), Prettier, CSpell, TypeScript strict checks.

Rationale: this combination balances developer ergonomics (Vite, Tailwind), safety (TypeScript, Zod), and runtime performance (React Query, lightweight Zustand).

**Repository structure (high-level)**
- **src/** — application source
  - **App.tsx**: application root and route mounting ([src/App.tsx](src/App.tsx))
  - **main.tsx**: bootstrapping and providers
  - **features/**: feature-oriented pages and components (each feature owns pages and subcomponents)
  - **components/**: shared presentational components and UI primitives
  - **layouts/**: route layouts (e.g., AuthLayout, DashboardLayout)
  - **hooks/**: reusable hooks (custom hooks for shared logic)
  - **lib/**: low-level utilities and API client (see [src/lib/api.ts](src/lib/api.ts))
  - **store/**: Zustand stores for local UI/state ([src/store/index.ts](src/store/index.ts))
  - **styles/**: design tokens and global styles

- **public/** — static assets (favicon, images)
- **server.ts** — local development server / proxy helpers (if used)

**Key files and where to look**
- API client: [src/lib/api.ts](src/lib/api.ts)
- Global stores: [src/store](src/store)
- Routes & app entry: [src/App.tsx](src/App.tsx) and [src/main.tsx](src/main.tsx)
- Feature examples: [src/features/dashboard/DashboardOverview.tsx](src/features/dashboard/DashboardOverview.tsx)
- UI components: [src/components](src/components)

**Environment & running**
- Prerequisites: Node.js (LTS recommended), pnpm or npm
- Install deps (pnpm preferred):

```bash
pnpm install
```

- Local dev:

```bash
pnpm run dev
```

- Build for production:

```bash
pnpm run build
pnpm run preview
```

- Environment: place environment variables in `.env.local` (example variables are documented near `server.ts` or the deploy config). The project references `GEMINI_API_KEY` in some workflows; verify secrets and remove unused keys when not required.

**Scripts & checks**
- `pnpm run dev` — dev server
- `pnpm run build` — production build
- `pnpm run preview` — preview production build
- `pnpm run lint` — ESLint checks (0 warnings policy)
- `pnpm run lint:fix` — auto-fix lint issues
- `pnpm run format` — Prettier formatting
- `pnpm run spell` — CSpell spell checks
- `pnpm run check` — combined lint, spell, and build validation (use before PRs)

**Development workflow & conventions**
- Use feature folders under `src/features/` for pages and feature-specific components.
- Keep shared UI in `src/components/` with variants via CVA.
- Extract async logic into React Query hooks; keep global UI state in Zustand stores under `src/store`.
- Use Zod schemas for API response validation when helpful; place schemas nearby the consuming code.
- Keep TypeScript strict; avoid `any`. Prefer narrow union types and discriminated unions for complex states.

**Documentation & design notes**
- Project docs: [MIGRATION-PLAN.md](MIGRATION-PLAN.md), [requerimientos-frontend.md](requerimientos-frontend.md), and [ARCH_ANALYSIS.md](ARCH_ANALYSIS.md).
- Component notes and smaller design decisions live near components or in inline comments; broader architectural rationale is in the above docs.

**Where to add new features**
- Create a new folder under `src/features/yourFeatureName` with page(s) and subcomponents.
- Add React Query hooks in the same feature or in `src/lib/queries` if shared.
- Add state to `src/store/` only when state must be shared across multiple features or persisted beyond the page lifecycle.

**Contributing**
- Run `pnpm run check` locally before opening PRs.
- Keep PRs focused (one feature or fix per PR). Attach screenshots for UI changes.
- Update or add docs in the repository root when a change affects architecture, migration, or setup.

If you'd like, I can also:
- add a minimal CONTRIBUTING.md with the required pre-PR checklist
- add badges and a short TOC at the top of this README

---
Generated and maintained by the frontend dev team — contact maintainers via the repository issues for questions.
