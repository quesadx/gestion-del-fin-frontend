# Technology Stack

**Analysis Date:** 2026-05-19

## Languages

**Primary:**

- TypeScript ~5.9.3 - All application code (`src/`) and config files
- ES2023 target with strict mode enabled

**Secondary:**

- JavaScript - Only in root config files (`eslint.config.js`, `tailwind.config.js`, `postcss.config.js`)
- CSS - Custom styles and Tailwind utilities in `src/app/styles/`
- SCSS custom properties - Design tokens in `src/app/styles/tokens.css`

**HTML:**

- `index.html` - Single entry point with splash screen inline styles

## Runtime

**Environment:**

- Node.js 20.x (specified in `flake.nix` for Nix development shell)
- Package manager: pnpm 10.32.1 (declared in `package.json` `packageManager` field)
- Lockfile: `pnpm-lock.yaml` (present)

**Nix Dev Environment (Optional):**

- `flake.nix` / `flake.lock` - Reproducible Nix dev shell with nodejs_20, TypeScript, ESLint, Prettier, CSpell, pnpm pre-installed

## Frameworks

**Core:**

- React 19.2.4 - UI library (with `react-dom 19.2.4`)
- TypeScript ~5.9.3 - Type checker and compiler
- Vite 8.0.1 - Build tool and dev server

**UI Components:**

- shadcn/ui (via Radix primitives) - Headless component library
  - 26 `@radix-ui/react-*` packages (accordion, alert-dialog, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toggle, toggle-group, tooltip, aspect-ratio)
  - `class-variance-authority 0.7.1` - Component variant definitions
  - `clsx 2.1.1` + `tailwind-merge 3.5.0` - Class name utilities
  - `cmdk 1.1.1` - Command menu (⌘K)
  - `embla-carousel-react 8.6.0` - Carousel
  - `input-otp 1.4.2` - OTP input
  - `vaul 1.1.2` - Drawer component

**State Management:**

- Zustand 5.0.12 - Client-side state (auth, UI, camp selection)
- TanStack Query 5.95.2 - Server state (API data fetching, caching, mutations)
- TanStack Query Devtools 5.95.2 - Query debugging (dev only)

**Routing:**

- react-router-dom 7.13.2 - Client-side routing with lazy-loaded pages

**Forms:**

- react-hook-form 7.72.0 - Form state management
- @hookform/resolvers 5.2.2 - Zod integration with react-hook-form
- zod 4.3.6 - Schema validation

**HTTP Client:**

- Axios 1.13.6 - HTTP requests with interceptors for auth and 401 handling

**Visual:**

- Tailwind CSS 3.4.19 - Utility-first CSS
- framer-motion 12.38.0 - Animation library (toasts, page transitions, stagger effects)
- recharts 3.8.1 - Charts (horizontal bar charts for inventory)
- lucide-react 1.7.0 - Icon library
- sonner 2.0.7 - Toast library (installed but actual toast system uses Zustand-based custom implementation in `src/shared/lib/toast.tsx`)
- date-fns 4.1.0 - Date utilities

**Testing:**

- No test framework detected in dependencies
- Requirement RNF-05 specifies Playwright for E2E tests — **not yet installed**

**Build/Dev:**

- @vitejs/plugin-react 6.0.1 - Vite React plugin (HMR, Fast Refresh)
- autoprefixer 10.4.27 - CSS vendor prefixing
- postcss 8.5.8 - CSS processing

## Key Dependencies

**Critical (required at runtime):**
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.4 | Core UI framework |
| react-dom | 19.2.4 | DOM rendering |
| react-router-dom | 7.13.2 | Page routing |
| @tanstack/react-query | 5.95.2 | Server state & API cache |
| zustand | 5.0.12 | Client state management |
| axios | 1.13.6 | HTTP client with interceptors |
| react-hook-form | 7.72.0 | Form handling |
| zod | 4.3.6 | Schema validation |
| framer-motion | 12.38.0 | Animation |
| recharts | 3.8.1 | Data visualization |
| lucide-react | 1.7.0 | Icons |

**Infrastructure (devDependencies):**
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ~5.9.3 | Type checking and compilation |
| vite | 8.0.1 | Build tool and dev server |
| @vitejs/plugin-react | 6.0.1 | React HMR support |
| tailwindcss | 3.4.19 | CSS utilities |
| postcss | 8.5.8 | CSS processor |
| autoprefixer | 10.4.27 | CSS vendor prefixes |
| eslint | 9.39.4 | Linting |
| typescript-eslint | 8.57.0 | TypeScript ESLint rules |
| prettier | 3.8.1 | Code formatting |
| cspell | 9.7.0 | Spell checking |
| @cspell/dict-es-es | 3.0.8 | Spanish dictionary for CSpell |
| @types/react | 19.2.14 | React type definitions |
| @types/react-dom | 19.2.3 | React DOM type definitions |
| @types/node | 24.12.0 | Node.js type definitions |

## Configuration

**Environment Variables** (copied from `.env.example`):
| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:3000/api` | Backend API base URL |
| `VITE_APP_NAME` | `Gestión del Fin` | Application display name |
| `VITE_SESSION_TIMEOUT_MS` | `1200000` (20 min) | Auto-logout after inactivity |

- `.env.example` present (template)
- `.env.local` present — contains local environment overrides (Vite auto-loads `.env.local` over `.env`)
- **Important:** In production, `VITE_API_URL` must point to the deployed backend API URL (not proxied). In development, Vite's `server.proxy` forwards `/api` → `http://localhost:3000`.

**TypeScript Configuration:**

- Root: `tsconfig.json` — project references to `tsconfig.app.json` and `tsconfig.node.json`
- App: `tsconfig.app.json`
  - Target: ES2023, Module: ESNext, ModuleResolution: bundler
  - JSX: react-jsx
  - **strict: true** — all strict checks enabled
  - **noUnusedLocals: true** — unused local variables are errors
  - **noUnusedParameters: true** — unused parameters are errors
  - **noFallthroughCasesInSwitch: true**
  - **noUncheckedSideEffectImports: true**
  - Path alias: `@/*` → `./src/*`
- Node: `tsconfig.node.json` — same strict settings, includes only `vite.config.ts`

**ESLint Configuration:**

- Config: `eslint.config.js` (flat config format)
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` flat recommended, `react-refresh` vite, `eslint-config-prettier`
- Plugin: `eslint-plugin-prettier` (runs Prettier as ESLint rule — `prettier/prettier: error`)
- Ignores: `dist`, `reference-frontend/**`, `neon-nova-dashboard/**`, `temp/**`
- Run: `pnpm lint` (with `--max-warnings 0`)

**Prettier Configuration:**

- Config: `.prettierrc`
- Key settings: semi: true, singleQuote: true, trailingComma: all, printWidth: 100, tabWidth: 2
- Ignores: `node_modules`, `dist`, `.env`, `.env.local`, `*.log`, `neon-nova-dashboard`
- Run: `pnpm format`

**CSpell Configuration:**

- Config: `cspell.json`
- Language: English (with Spanish dictionary: `@cspell/dict-es-es`)
- Custom words: Domain-specific terms (Zustand, tanstack, shadcn, recharts, framer, scanlines, etc.)
- Ignores: `node_modules`, `dist`, `*.lock`, `*.json`, `*.md`, `neon-nova-dashboard`, `temp`
- Run: `pnpm spell`

**Build Setup:**

- Command: `pnpm build` runs `tsc -b && vite build`
  1. `tsc -b`: Builds both TypeScript project references (app + node)
  2. `vite build`: Production bundle
- Pre-commit check: `pnpm check` runs `pnpm lint && pnpm spell && pnpm build`

**Vite Configuration:**

- Config: `vite.config.ts`
- Plugin: `@vitejs/plugin-react`
- Path alias: `@` → `./src`
- Dev server proxy: `/api` → `http://localhost:3000` (with `changeOrigin: true`)
- PostCSS: `postcss.config.js` with `tailwindcss` and `autoprefixer`

**Tailwind Configuration:**

- Config: `tailwind.config.js`
- Content paths: `./index.html`, `./src/**/*.{ts,tsx}`
- Custom theme: Brutalist dark design system
  - Custom colors: surface (base/deep/raised/overlay), accent (primary/secondary/success), brand (primary/secondary/accent), status (green/red/yellow), text (primary/secondary/muted), border (subtle/DEFAULT/hover/active)
  - Custom fonts: Inter (sans), JetBrains Mono (mono)
  - Custom animations: fade-in, slide-up, slide-in-right, blink
- No plugins

**Nix Flake:**

- `flake.nix` / `flake.lock` — Nix development environment
- Provides: nodejs_20, TypeScript language server, ESLint, Prettier, CSpell, pnpm
- Shell aliases: `pi` (install), `pd` (dev), `pb` (build), `pc` (check)

## Platform Requirements

**Development:**

- Node.js 20.x (or Nix with `nix develop`)
- pnpm 10.x
- Backend running at `http://localhost:3000` for API proxy

**Production:**

- Build output: `dist/` directory (static assets)
- Deployment target: **Vercel** (per requirement RNF-06)
- No `vercel.json` found — deployment configuration not yet set up
- Runtime: Static file serving (SPA). Must serve `index.html` for all routes (fallback)
- Environment variables must be set in Vercel dashboard (`VITE_API_URL` pointing to deployed backend)

---

_Stack analysis: 2026-05-19_
