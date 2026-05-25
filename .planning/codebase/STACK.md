# Technology Stack

**Analysis Date:** 2026-05-24

## Languages

**Primary:**
- TypeScript ~5.8.2 - Entire codebase: frontend components (`src/`), server (`server.ts`), build config (`vite.config.ts`)

**Secondary:**
- CSS (Tailwind v4 utility classes) - Styling in `src/index.css`
- HTML - Single entry point `index.html`

## Runtime

**Environment:**
- Node.js (ESM — `"type": "module"` in `package.json`)
- Express 4.21.2 for local development API server (`server.ts`)
- tsx 4.21.0 for TypeScript execution without pre-compilation

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (189KB)

## Frameworks

**Core:**
- React 19.0.1 - UI library (all components in `src/`)
- Vite 6.2.3 - Build tool, dev server, HMR
- React Router DOM 7.15.0 - Client-side routing (`src/App.tsx`)
- TanStack React Query 5.100.10 - Server state, caching, mutations (`@tanstack/react-query`)
- Zustand 5.0.13 - Global client state (`src/store/index.ts`)
- Tailwind CSS 4.1.14 - Utility-first CSS framework via `@tailwindcss/vite` plugin
- Express 4.21.2 - Development API/mock server (`server.ts`)

**Form/Validation:**
- React Hook Form 7.75.0 - Form management (`src/features/auth/LoginPage.tsx`)
- @hookform/resolvers 5.2.2 - Zod schema resolver integration
- Zod 4.4.3 - Schema validation

**UI/Animation:**
- Lucide React 0.546.0 - Icon library (used across all feature components)
- Motion 12.23.24 - Animation library (formerly Framer Motion; imported from `motion/react`)
- Recharts 3.8.1 - Charting library (`src/features/dashboard/DashboardOverview.tsx`)
- clsx 2.1.1 + tailwind-merge 3.6.0 - Class merging utilities (`src/lib/utils.ts`)

**Testing:**
- No test framework detected (no `jest`, `vitest`, or test runner in dependencies; no test files found)

**Build/Dev:**
- tsx 4.21.0 - TypeScript runtime executor for `npm run dev`
- esbuild 0.28.0 - Server bundling for production (`npm run build`)
- TypeScript ~5.8.2 - Type checking (`npm run lint`)
- autoprefixer 10.4.21 - CSS vendor prefixes
- @types/express 4.17.21 - Express type definitions
- @types/node 22.14.0 - Node.js type definitions

## Key Dependencies

**Critical:**
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.0.1 | Core UI rendering |
| react-dom | 19.0.1 | DOM rendering |
| react-router-dom | 7.15.0 | Client-side routing with protected routes |
| @tanstack/react-query | 5.100.10 | API data fetching, caching, optimistic updates |
| zustand | 5.0.13 | Auth and camp context state management |
| axios | 1.16.0 | HTTP client with interceptors for auth tokens |
| zod | 4.4.3 | Runtime schema validation for forms and API contracts |
| @google/genai | 1.29.0 | Google Gemini AI SDK (declared dependency; no usage found in frontend source) |
| express | 4.21.2 | Local dev API server with mock data |

**Infrastructure:**
| Package | Version | Purpose |
|---------|---------|---------|
| vite | 6.2.3 | Build and dev server |
| @vitejs/plugin-react | 5.0.4 | React Fast Refresh for Vite |
| @tailwindcss/vite | 4.1.14 | Tailwind CSS integration for Vite |
| tailwindcss | 4.1.14 | CSS framework |
| esbuild | 0.28.0 | Production server bundling |
| dotenv | 17.2.3 | Environment variable loading |

## Configuration

**Environment:**
- `.env.example` present — documents two variables:
  - `GEMINI_API_KEY` — Google Gemini API key (required)
  - `APP_URL` — Deployment URL (injected by AI Studio/Cloud Run)
- `.env*` files gitignored (except `.env.example`)
- `vite.config.ts` reads `GEMINI_API_KEY` via `loadEnv` and injects it as `process.env.GEMINI_API_KEY` in the client bundle
- `vite.config.ts` reads `DISABLE_HMR` to conditionally disable HMR and file watching (for AI Studio agent edits)
- The `dotenv` package is listed but not explicitly imported — likely used by Vite's `loadEnv` internally

**Build:**
- `tsconfig.json` — Target `ES2022`, module `ESNext`, bundler resolution, JSX `react-jsx`, path alias `@/*` → `./*`, `noEmit: true`
- `vite.config.ts` — React plugin, Tailwind plugin, `@` path alias, environment injection for `GEMINI_API_KEY`
- `index.html` — Single entry point mounting React to `#root`

**Run Scripts:**
```bash
npm run dev       # Start dev server with tsx (Express + Vite middleware)
npm run build     # Vite build client + esbuild bundle server → dist/
npm run start     # Run production bundled server
npm run preview   # Vite preview of production build
npm run clean     # Remove dist/
npm run lint      # TypeScript type checking (tsc --noEmit)
```

## Platform Requirements

**Development:**
- Node.js (version not pinned; no `.nvmrc` or `.node-version` found)
- npm
- Gemini API key (for AI features)

**Production:**
- Deployment target: Google AI Studio / Cloud Run (per `README.md` and `metadata.json`)
- AI Studio app URL: `https://ai.studio/apps/f1d6bfbe-c1bb-472e-b56f-4542f336ecdf`
- Primary API backend hosted on Railway: `https://gestion-del-fin-api-production.up.railway.app/api`
- No `Dockerfile` detected; deployment handled by AI Studio platform

---

*Stack analysis: 2026-05-24*
