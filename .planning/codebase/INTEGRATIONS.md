# External Integrations

**Analysis Date:** 2026-05-24

## APIs & External Services

**Backend API (Production):**
- Service: `gestion-del-fin-api-production.up.railway.app`
  - What it's used for: All CRUD operations — camps, survivors, inventory, admissions, expeditions, metrics
  - URL: `https://gestion-del-fin-api-production.up.railway.app/api`
  - SDK/Client: axios (custom instance in `src/lib/api.ts`)
  - Auth: Bearer token in `Authorization` header, stored in localStorage key `token`

**Backend API (Local/Dev):**
- Service: Local Express server in `server.ts`
  - What it's used for: Full mock API with in-memory data for development
  - URL: `/api` (proxied through Vite dev server on port 3000)
  - Auth: Mock JWT — any username gets a role; `admin` → `system_admin`, `manager` → `resource_manager`, `travel`/`coordinator` → `travel_coordinator`, anything else → `survivor`
  - All endpoints in `server.ts` lines 48–469

**Google Gemini AI:**
- Service: Google Gemini (generative AI)
  - What it's used for: AI-assisted admission screening (declared but no direct frontend usage found — likely used by the Railway backend or planned)
  - SDK: `@google/genai` ^1.29.0 (declared in `package.json`; no imports in `src/`)
  - Auth: `GEMINI_API_KEY` env var (injected into client bundle via `vite.config.ts` line 11 as `process.env.GEMINI_API_KEY`)

**Image CDN (Unsplash):**
- Service: `images.unsplash.com`
  - What it's used for: Default/placeholder applicant photos and ID card images in admissions
  - URLs found in:
    - `src/features/admission/AdmissionList.tsx` lines 257, 269
    - `server.ts` lines 353-354
  - Auth: None (public CDN URLs)
  - Referrer policy: `no-referrer` on `<img>` tags

## Data Storage

**Databases:**
- No database detected. The local dev server (`server.ts`) uses in-memory JavaScript arrays for all data:
  - `survivors` array — `server.ts:12-15`
  - `camps` array — `server.ts:17-20`
  - `resources` array — `server.ts:22-26`
  - `inventory` array — `server.ts:28-32`
  - `inventoryLogs` array — `server.ts:34-38`
  - `admissions` array — `server.ts:40-42`
  - `expeditions` array — `server.ts:44-46`
- The production Railway backend likely uses a real database (type unknown from client codebase)

**Client-Side Storage:**
- `localStorage` used for:
  - `token` — JWT auth token (`src/lib/api.ts:27`, `src/store/index.ts:18,22`)
  - `api_mode` — toggle between `remote` and `local` API (`src/lib/api.ts:18`)
  - `session_expired` — flag for inactivity timeout UI (`src/App.tsx:45`, `src/features/auth/LoginPage.tsx:24`)
  - Zustand persisted stores:
    - `auth-storage` — user object and token (`src/store/index.ts:12-27`)
    - `camp-storage` — current camp ID (`src/store/index.ts:35-42`)

**File Storage:**
- No file upload capabilities detected. Photo/ID URLs are external links (Unsplash).

**Caching:**
- TanStack React Query provides client-side cache with `staleTime`/`gcTime` defaults
- No dedicated caching layer (Redis, Memcached) detected
- Query client configured with `refetchOnWindowFocus: false` and `retry: 1` (`src/App.tsx:19-26`)

## Authentication & Identity

**Auth Provider:**
- Custom mock authentication
  - Implementation: `POST /api/auth/login` returns `{ user: { username, role, camp_id }, token: "mock-jwt-token" }` (`server.ts:49-58`)
  - Token stored in localStorage, sent as `Bearer` header via axios interceptor (`src/lib/api.ts:26-32`)
  - Logout via `POST /api/auth/logout` clears client state only
  - 401 response interceptor clears token and redirects to `/login` (`src/lib/api.ts:34-42`)
  - Inactivity timeout: 20 minutes of no mouse/keyboard activity triggers auto-logout (`src/App.tsx:39-58`)

**Role-Based Access Control:**
- Roles: `system_admin`, `resource_manager`, `travel_coordinator`, `survivor`
- `ProtectedRoute` component in `src/App.tsx:28-33` wraps routes with optional role checks
- Dashboard and nested routes require authentication; no role restriction on most routes currently

**External Auth Providers:**
- None (no OAuth, OIDC, or third-party auth detected)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, or error monitoring SDK)

**Logs:**
- Server: `console.log` on startup (`server.ts:487`)
- Client: Console logging not detected in source
- No structured logging framework

**Analytics:**
- None detected (no Google Analytics, Plausible, etc.)

## CI/CD & Deployment

**Hosting:**
- Platform: Google AI Studio (hosts the frontend SPA and Node.js server)
  - App URL: `https://ai.studio/apps/f1d6bfbe-c1bb-472e-b56f-4542f336ecdf` (`README.md:9`)
  - AI Studio injects `GEMINI_API_KEY` and `APP_URL` at runtime (`README.md:18`, `.env.example`)
- Backend API: Railway (`gestion-del-fin-api-production.up.railway.app`)

**CI Pipeline:**
- None detected (no `.github/workflows/`, no CI config files)
- Deployment appears manual or platform-managed by AI Studio
- Build command: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` (`package.json:8`)
- Start command: `node dist/server.cjs` (`package.json:9`)

**Docker:**
- No `Dockerfile` or container configuration detected

## Environment Configuration

**Required env vars:**
- `GEMINI_API_KEY` — Google Gemini API key (required, injected by AI Studio)
- `APP_URL` — Deployment URL (injected by AI Studio, used for self-referential links)
- `DISABLE_HMR` — Set to `true` in AI Studio to disable HMR and file watching (`vite.config.ts:21-23`)

**Secrets location:**
- `.env` file at project root (gitignored)
- `.env.local` for local development (`README.md:18`)
- AI Studio Secrets panel for production (per `.env.example` comments)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (no webhook calls, no Stripe/Plaid/etc. callbacks)

## API Mode Switching

**Remote vs Local toggle:**
- UI button in `src/layouts/DashboardLayout.tsx:85-100` switches between:
  - **Remote:** `https://gestion-del-fin-api-production.up.railway.app/api` (production Railway backend)
  - **Local:** `/api` (local Express mock server)
- Persisted in `localStorage` key `api_mode`
- Switching triggers `window.location.reload()` (`src/lib/api.ts:18-19`)

## Axios Client Configuration

**File:** `src/lib/api.ts`
- Base URL: dynamically resolved from `api_mode` in localStorage (`getBaseURL()`, line 4-11)
- Request interceptor: attaches `Bearer {token}` from localStorage token (`lines 26-32`)
- Response interceptor: on 401, clears token and redirects to `/login` (`lines 34-42`)
- All API calls across features use this single `apiClient` instance

---

*Integration audit: 2026-05-24*
