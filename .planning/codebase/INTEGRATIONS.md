# External Integrations

**Analysis Date:** 2026-05-19

## APIs & External Services

### Backend API (Primary)

- **Service:** NestJS/Express backend (custom API)
- **What it's used for:** All business logic — authentication, camp management, people management, inventory/warehouse operations, resource tracking, exploration management, admission processing (including AI), transfers between camps, rations, system time
- **SDK/Client:** Axios 1.13.6 (`src/shared/api/axiosInstance.ts`)
- **Auth:** JWT Bearer token (from login response, attached via Axios request interceptor)
- **Dev URL:** `http://localhost:3000` (proxied via Vite dev server)
- **Prod URL:** Configured via `VITE_API_URL` environment variable

**API Endpoints Consumed** (grouped by feature):

| Feature      | API Paths                                                                                                                                                                                                                                | Files                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Auth         | `POST /auth/login`                                                                                                                                                                                                                       | `src/features/auth/api/auth.api.ts`                                                             |
| System       | `GET /system/time`                                                                                                                                                                                                                       | `src/features/system/api/system.api.ts`, `src/shared/api/system.api.ts`                         |
| Camps        | `GET /camps`, `GET /camps/:id`, `POST /camps`, `PUT /camps/:id`, `DELETE /camps/:id`                                                                                                                                                     | `src/features/camps/api/camps.api.ts`                                                           |
| People       | (via barrel)                                                                                                                                                                                                                             | `src/features/people/api/people.api.ts`                                                         |
| Inventory    | `GET /inventory/:campId`, `GET /inventory/audit/:campId`, `POST /inventory/adjustment`                                                                                                                                                   | `src/features/inventory/api/inventory.api.ts`                                                   |
| Resources    | (via barrel)                                                                                                                                                                                                                             | `src/features/resources/api/resources.api.ts`                                                   |
| Transfers    | `GET /transfers`, `GET /transfers/:id`, `POST /transfers`, `PATCH /transfers/:id/schedule`, `PATCH /transfers/:id/approve-source`, `PATCH /transfers/:id/approve-target`, `PATCH /transfers/:id/complete`, `PATCH /transfers/:id/reject` | `src/features/transfers/api/transfers.api.ts`                                                   |
| Explorations | `GET /expeditions`, `GET /expeditions/:id`, `POST /expeditions`, `PUT /expeditions/:id`, `PATCH /expeditions/:id/status`, `DELETE /expeditions/:id`                                                                                      | `src/features/explorations/api/explorations.api.ts`                                             |
| Admissions   | `GET /admission/camps/:campId`, `GET /admission/:id`, `POST /admission/camps/:campId`, `PATCH /admission/:id/review`                                                                                                                     | `src/features/admission/api/admission.api.ts`                                                   |
| Users        | (via barrel)                                                                                                                                                                                                                             | `src/features/users/api/users.api.ts`                                                           |
| Professions  | (via barrel)                                                                                                                                                                                                                             | `src/features/professions/api/professions.api.ts`, `src/features/people/api/professions.api.ts` |

**Axios Instance Configuration:**

- Base URL: `import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'`
- Timeout: 10 seconds
- Content-Type: `application/json`
- Request interceptor: Attaches `Authorization: Bearer <token>` from Zustand auth store
- Response interceptor: On 401, triggers logout and redirects to `/login` (with deduplication flag `isHandling401`)

**Type Definitions:**

- `src/shared/api/types.ts` — Shared API types: `ErrorResponse`, `LoginRequest`, `LoginResponse`, `SystemTimeResponse`, `PaginationQuery`

### AI Service (Person Admission)

- **Service:** Backend-hosted AI (no frontend SDK — not OpenAI, not Anthropic, not Gemini)
- **What it's used for:**
  - Evaluating person admission applications (RF-04)
  - Deciding whether to accept or reject a person
  - Assigning role/profession automatically
- **Integration point:** `POST /admission/camps/:campId` (submits applicant data to backend, backend calls AI)
- **Review flow:** `PATCH /admission/:id/review` — user can override AI decision
- **AI context config:** Each camp can have an `ai_context_prompt` field (stored in backend) that provides rules/context for the AI evaluation. UI allows setting this in camp create/edit forms (`src/features/camps/pages/CampsPage.tsx`, `src/features/camps/pages/CampDetailPage.tsx`).
- **Explainability:** The `AdmissionsPage` (`src/features/admission/pages/AdmissionsPage.tsx`) displays AI criteria and decisions. Backend is responsible for providing explainable AI output (RNF-07).

## Data Storage

**Databases:**

- Not applicable — this is a frontend application. All data persistence is on the backend.
- No local storage database (no IndexedDB, no SQLite).
- Session data (auth token, user, role) persisted to `localStorage` via Zustand persist middleware (key: `gdf.auth`).

**File Storage:**

- All file uploads (photos, ID cards) are handled by the backend API endpoints.
- No client-side file storage.

**Caching:**

- TanStack Query in-memory cache with `staleTime: 30_000` (30 seconds) configured in `src/shared/lib/queryClient.ts`
- Zustand auth store persisted to `localStorage` (`gdf.auth` key) — only `user`, `token`, and `role` fields are persisted (via `partialize`)
- Camp store (`src/features/camps/store/camp.store.ts`) is purely in-memory (not persisted)
- No service worker caching or offline support

## Authentication & Identity

**Auth Provider:**

- Custom JWT-based authentication via backend API
- Flow:
  1. User submits credentials to `POST /auth/login`
  2. Backend returns JWT token + user info (`LoginResponse` in `src/shared/api/types.ts`)
  3. Client decodes JWT payload to extract `role` and `userId` (`src/features/auth/auth.service.ts`)
  4. Token, user, and role stored in Zustand `useAuthStore` (persisted to `localStorage`)
  5. Axios request interceptor attaches `Authorization: Bearer <token>` to all requests
  6. On 401 response, Axios response interceptor clears auth state and redirects to `/login`
- **Valid roles:** `system_admin`, `resource_manager`, `worker`, `travel_coordinator` (defined in `src/features/auth/types/auth.types.ts`)
- **Session timeout:** 20 minutes of inactivity (`VITE_SESSION_TIMEOUT_MS`, default `1200000`). Tracked via `lastActivity` timestamp updated on mouse/key/scroll/touch events. After timeout, session locks and user is logged out. Implemented in `src/features/auth/auth-context.tsx`.
- **Role-based access:** Route-level protection via `src/shared/lib/roleGuards.ts` — maps routes to allowed roles. `ProtectedRoute` component (`src/routes/ProtectedRoute.tsx`) enforces access.

## Monitoring & Observability

**Error Tracking:**

- No external error tracking service (no Sentry, no LogRocket, no Datadog)
- Client-side logging: Custom logger (`src/shared/utils/logger.ts`) prefixes with `[GDF]`, logs `info`/`warn` only in dev mode, `error` always

**Logs:**

- Console-based only (via custom `logger` utility)
- Network errors surfaced via toast notifications (`src/shared/lib/toast.tsx`)

## CI/CD & Deployment

**Hosting:**

- **Vercel** (per requirement RNF-06)
- No `vercel.json` configuration file found — Vercel deployment not yet configured
- Build command: `pnpm build` (runs `tsc -b && vite build`)
- Output directory: `dist/`
- Fallback: SPA must serve `index.html` for all routes

**CI Pipeline:**

- No CI workflow files found (no `.github/workflows/` directory)
- Per RNF-05: Playwright E2E tests should run in CI automatically
- **Playwright:** Not yet installed (no `playwright` in `devDependencies`, no playwright config files, no test files found)
- Per RNF-06: Deployment should be automated/reproducible — not yet set up

**CI Requirements (not yet implemented):**

- Install dependencies: `pnpm install`
- Lint: `pnpm lint`
- Spell check: `pnpm spell`
- Build: `pnpm build`
- E2E tests: `pnpm exec playwright test` (once configured)
- Deploy to Vercel via GitHub integration or Vercel CLI

## Environment Configuration

**Required env vars** (from `.env.example`):
| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:3000/api` | Backend API base URL (used in production; dev uses Vite proxy) |
| `VITE_APP_NAME` | `Gestión del Fin` | Application display name |
| `VITE_SESSION_TIMEOUT_MS` | `1200000` | Session auto-logout timeout in milliseconds |

**Secrets location:**

- `.env.local` — local environment overrides (gitignored)
- `.env.example` — template committed to git
- Production: Environment variables in Vercel project settings
- **Note:** JWT token is stored in `localStorage` under key `gdf.auth` — this is acceptable for this project context but is not a secret storage mechanism

## Webhooks & Callbacks

**Incoming:**

- None — no webhook endpoints in the frontend (SPA cannot receive webhooks)

**Outgoing:**

- None — no outgoing webhooks or callbacks to external services

## AI & External Intelligence Services

### AI for Person Admission (RF-04, RNF-07)

- **Provider:** Backend-hosted AI service (not directly accessed from frontend)
- **Frontend integration:**
  - Camp creation/editing includes `ai_context_prompt` field (`src/features/camps/pages/CampsPage.tsx:360-365`, `src/features/camps/pages/CampDetailPage.tsx:322-327`) — sets rules/context for AI evaluation
  - Admission submission (`src/features/admission/api/admission.api.ts`) sends person data to `POST /admission/camps/:campId` — backend handles AI processing
  - Review UI displays AI decision and criteria (`src/features/admission/pages/AdmissionsPage.tsx`) — user can accept or override
  - Final decision sent via `PATCH /admission/:id/review`
- **Explainability (RNF-07):** Backend must return AI criteria and reasoning. Frontend displays these in the admissions review UI. No AI SDK in the client-side bundle.

---

_Integration audit: 2026-05-19_
