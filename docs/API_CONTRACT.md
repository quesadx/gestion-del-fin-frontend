# API_CONTRACT.md — Gestión del Fin · Backend API & Data Layer

> Load this when working on API functions, TanStack Query hooks, Zustand stores, Axios config, and endpoint wiring.

This contract is aligned with [docs/Endpoints.json](docs/Endpoints.json). If the OpenAPI changes, update this file first and then update the API layer and UI hooks.

---

## BASE URL & AUTH

```text
Base URL: http://localhost:3000/api   (env: VITE_API_URL)
```

Rules:
- `POST /auth/login` is public.
- All other endpoints require `Authorization: Bearer <jwt_token>`.
- Send `Content-Type: application/json` for JSON requests.
- Camp-scoped endpoints use `campId` in the path, not a global `X-Camp-Id` contract.

If the current implementation keeps `X-Camp-Id` as an internal convenience header, document it as an implementation detail only. It is not part of the OpenAPI contract.

---

## STATE SPLIT

```text
Zustand       -> auth session, active camp, UI state
TanStack Query -> everything that comes from the API
```

Rules:
- Never store API response data in Zustand.
- Never fetch API data inside Zustand actions.
- When the active camp changes, call `queryClient.clear()` to drop cached server state.

---

## RESPONSE SHAPE

The OpenAPI document defines responses endpoint by endpoint. Use the documented schema for each route.

Known shared shapes:

```typescript
interface ErrorResponse {
  error: {
    message: string
    statusCode: number
    details?: unknown
  }
}

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  user: {
    username: string
  }
  token: string
}

interface SystemTimeResponse {
  now: string
  iso: string
  today: string
}
```

Do not assume a `success/data` wrapper unless the backend explicitly returns it for a given route.

---

## AXIOS INSTANCE

```typescript
// src/shared/api/axiosInstance.ts
import axios from 'axios'
import { useAuthStore } from '@/features/auth/store/auth.store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

If the app later needs a camp header for legacy compatibility, inject it in a second interceptor only if the backend still requires it.

---

## QUERY CLIENT

```typescript
// src/shared/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

```typescript
// src/app/providers.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/shared/lib/queryClient'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Query key conventions:

```typescript
['camps']
['system', 'time']
['people', campId]
['person', campId, personId]
['resources', campId]
['resource', resourceId]
['inventory', campId]
['inventory-audit', campId]
['professions']
['expeditions', campId]
['admissions', campId]
['users']
```

---

## API FUNCTIONS

API files export plain async functions. TanStack Query hooks wrap these functions.

### auth.api.ts

```typescript
// src/features/auth/api/auth.api.ts
import { api } from '@/shared/api/axiosInstance'

export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', credentials).then((r) => r.data),
}
```

### system.api.ts

```typescript
// src/shared/api/system.api.ts
import { api } from '@/shared/api/axiosInstance'

export const systemApi = {
  getTime: () => api.get<SystemTimeResponse>('/system/time').then((r) => r.data),
}
```

### camps.api.ts

```typescript
// src/features/camps/api/camps.api.ts
import { api } from '@/shared/api/axiosInstance'

export const campsApi = {
  getAll: () => api.get('/camps').then((r) => r.data),
  getById: (id: string) => api.get(`/camps/${id}`).then((r) => r.data),
  create: (payload: unknown) => api.post('/camps', payload).then((r) => r.data),
  update: (id: string, payload: unknown) => api.put(`/camps/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/camps/${id}`).then((r) => r.data),
}
```

### people.api.ts

```typescript
// src/features/people/api/people.api.ts
import { api } from '@/shared/api/axiosInstance'

export const peopleApi = {
  getAllByCamp: (campId: string) => api.get(`/camps/${campId}/people`).then((r) => r.data),
  getById: (campId: string, id: string) => api.get(`/camps/${campId}/people/${id}`).then((r) => r.data),
  create: (campId: string, payload: unknown) => api.post(`/camps/${campId}/people`, payload).then((r) => r.data),
  update: (campId: string, id: string, payload: unknown) => api.put(`/camps/${campId}/people/${id}`, payload).then((r) => r.data),
  remove: (campId: string, id: string) => api.delete(`/camps/${campId}/people/${id}`).then((r) => r.data),
  addStatusLog: (campId: string, payload: unknown) => api.post(`/camps/${campId}/people/status-log`, payload).then((r) => r.data),
  createProfessionReassignment: (campId: string, payload: unknown) => api.post(`/camps/${campId}/people/profession-reassignments`, payload).then((r) => r.data),
  createContributionOverride: (campId: string, payload: unknown) => api.post(`/camps/${campId}/people/contribution-overrides`, payload).then((r) => r.data),
}
```

### resources.api.ts

```typescript
// src/features/inventory/api/resources.api.ts
import { api } from '@/shared/api/axiosInstance'

export const resourcesApi = {
  getAll: () => api.get('/resources').then((r) => r.data),
  getById: (id: string) => api.get(`/resources/${id}`).then((r) => r.data),
  create: (payload: unknown) => api.post('/resources', payload).then((r) => r.data),
  update: (id: string, payload: unknown) => api.put(`/resources/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/resources/${id}`).then((r) => r.data),
}
```

### inventory.api.ts

```typescript
// src/features/inventory/api/inventory.api.ts
import { api } from '@/shared/api/axiosInstance'

export const inventoryApi = {
  getByCamp: (campId: string) => api.get(`/inventory/${campId}`).then((r) => r.data),
  getAuditByCamp: (campId: string) => api.get(`/inventory/audit/${campId}`).then((r) => r.data),
  createAdjustment: (payload: unknown) => api.post('/inventory/adjustment', payload).then((r) => r.data),
}
```

### professions.api.ts

```typescript
// src/features/people/api/professions.api.ts
import { api } from '@/shared/api/axiosInstance'

export const professionsApi = {
  getAll: () => api.get('/professions').then((r) => r.data),
  getById: (id: string) => api.get(`/professions/${id}`).then((r) => r.data),
  create: (payload: unknown) => api.post('/professions', payload).then((r) => r.data),
  update: (id: string, payload: unknown) => api.put(`/professions/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/professions/${id}`).then((r) => r.data),
}
```

### expeditions.api.ts

```typescript
// src/features/explorations/api/expeditions.api.ts
import { api } from '@/shared/api/axiosInstance'

export const expeditionsApi = {
  getAll: () => api.get('/expeditions').then((r) => r.data),
  getById: (id: string) => api.get(`/expeditions/${id}`).then((r) => r.data),
  create: (payload: unknown) => api.post('/expeditions', payload).then((r) => r.data),
  update: (id: string, payload: unknown) => api.put(`/expeditions/${id}`, payload).then((r) => r.data),
  remove: (id: string, payload: unknown) => api.delete(`/expeditions/${id}`, { data: payload }).then((r) => r.data),
  updateStatus: (id: string, payload: unknown) => api.patch(`/expeditions/${id}/status`, payload).then((r) => r.data),
}
```

### admissions.api.ts

```typescript
// src/features/admissions/api/admissions.api.ts
import { api } from '@/shared/api/axiosInstance'

export const admissionsApi = {
  createForCamp: (campId: string, payload: unknown) => api.post(`/admission/camps/${campId}`, payload).then((r) => r.data),
  getByCamp: (campId: string) => api.get(`/admission/camps/${campId}`).then((r) => r.data),
  getById: (id: string) => api.get(`/admission/${id}`).then((r) => r.data),
  review: (id: string, payload: unknown) => api.patch(`/admission/${id}/review`, payload).then((r) => r.data),
}
```

### users.api.ts

```typescript
// src/features/users/api/users.api.ts
import { api } from '@/shared/api/axiosInstance'

export const usersApi = {
  getAll: () => api.get('/users').then((r) => r.data),
  getById: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  create: (payload: unknown) => api.post('/users', payload).then((r) => r.data),
  update: (id: string, payload: unknown) => api.put(`/users/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
}
```

---

## TANSTACK QUERY HOOKS

Hooks should be one file per feature. Use route-scoped query keys that include `campId` where applicable.

Guideline:
- `useQuery` for lists and details.
- `useMutation` for create, update, review, approve, delete, and one-off workflow actions.
- Invalidate only the affected query keys after a mutation.

Example pattern:

```typescript
const query = useQuery({
  queryKey: ['people', campId],
  queryFn: () => peopleApi.getAllByCamp(campId!),
  enabled: !!campId,
})

const createPerson = useMutation({
  mutationFn: (payload: unknown) => peopleApi.create(campId!, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['people', campId] })
  },
})
```

---

## ZUSTAND STORES

Keep stores client-only.

### auth.store.ts

```typescript
// src/features/auth/store/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: { username: string } | null
  token: string | null
  lastActivity: number
  isLocked: boolean

  login: (token: string, user: { username: string }) => void
  logout: () => void
  updateActivity: () => void
  lock: () => void
  unlock: (password: string) => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      lastActivity: Date.now(),
      isLocked: false,

      login: (token, user) => set({ token, user, lastActivity: Date.now(), isLocked: false }),
      logout: () => set({ user: null, token: null, isLocked: false }),
      updateActivity: () => set({ lastActivity: Date.now() }),
      lock: () => set({ isLocked: true }),
      unlock: async () => false,
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
)
```

If the backend later exposes role or camp in auth payloads, add them back explicitly and update [docs/ROLES_ACCESS.md](docs/ROLES_ACCESS.md).

### camp.store.ts

```typescript
// src/features/camps/store/camp.store.ts
import { create } from 'zustand'

interface CampState {
  activeCamp: { id: string; name?: string } | null
  availableCamps: { id: string; name?: string }[]
  serverTime: number
  lastSyncLocal: number

  setActiveCamp: (camp: { id: string; name?: string } | null) => void
  setAvailableCamps: (camps: { id: string; name?: string }[]) => void
  resetCamp: () => void
  setServerTime: (serverTime: number) => void
}

export const useCampStore = create<CampState>()((set) => ({
  activeCamp: null,
  availableCamps: [],
  serverTime: 0,
  lastSyncLocal: 0,

  setActiveCamp: (camp) => set({ activeCamp: camp }),
  setAvailableCamps: (camps) => set({ availableCamps: camps }),
  resetCamp: () => set({ activeCamp: null, serverTime: 0 }),
  setServerTime: (serverTime) => set({ serverTime, lastSyncLocal: Date.now() }),
}))
```

---

## KEY TYPES

Use these as the starting point, then refine them after you implement each endpoint from the OpenAPI schemas.

```typescript
// src/features/auth/types/auth.types.ts
export type Role = 'system_admin' | 'resource_manager' | 'worker' | 'travel_coordinator'

// src/features/people/types/person.types.ts
export type Condition = 'healthy' | 'injured' | 'sick' | 'away'

// src/features/inventory/types/resource.types.ts
export type ResourceType = 'food' | 'water' | 'medicine' | 'ammo' | 'hygiene' | 'defense'

// src/features/explorations/types/exploration.types.ts
export type ExpeditionStatus = 'scheduled' | 'active' | 'returned' | 'failed'
```

Important alignment notes:
- The current front code uses `travel_lead`, but the OpenAPI text says `travel_coordinator` for expedition routes. Verify the backend enum before wiring guards.
- Do not keep `transfers` in the API layer unless the backend adds those endpoints back.

---

## ENDPOINTS REFERENCE

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/auth/login` | Public login, returns `{ user: { username }, token }` | D
| GET | `/system/time` | Public time snapshot | D
| GET | `/camps` | Authenticated list | 
| POST | `/camps` | Create camp |
| GET | `/camps/{id}` | Camp detail |
| PUT | `/camps/{id}` | Update camp |
| DELETE | `/camps/{id}` | Delete camp |
| POST | `/admission/camps/{campId}` | Create admission request |
| GET | `/admission/camps/{campId}` | List admissions by camp |
| GET | `/admission/{id}` | Admission detail |
| PATCH | `/admission/{id}/review` | Review admission |
| GET | `/inventory/{campId}` | Inventory snapshot by camp | 
| GET | `/inventory/audit/{campId}` | Inventory audit trail |
| POST | `/inventory/adjustment` | Manual inventory adjustment |
| GET | `/camps/{campId}/people` | List people in camp |
| POST | `/camps/{campId}/people` | Create person in camp |
| GET | `/camps/{campId}/people/{id}` | Person detail |
| PUT | `/camps/{campId}/people/{id}` | Update person |
| DELETE | `/camps/{campId}/people/{id}` | Delete person |
| POST | `/camps/{campId}/people/status-log` | Add status log |
| POST | `/camps/{campId}/people/profession-reassignments` | Create reassignment |
| POST | `/camps/{campId}/people/contribution-overrides` | Create override |
| GET | `/professions` | List professions |
| POST | `/professions` | Create profession |
| GET | `/professions/{id}` | Profession detail |
| PUT | `/professions/{id}` | Update profession |
| DELETE | `/professions/{id}` | Delete profession |
| GET | `/resources` | List resources |
| POST | `/resources` | Create resource |
| GET | `/resources/{id}` | Resource detail |
| PUT | `/resources/{id}` | Update resource |
| DELETE | `/resources/{id}` | Delete resource |
| GET | `/expeditions` | List expeditions |
| POST | `/expeditions` | Create expedition |
| GET | `/expeditions/{id}` | Expedition detail |
| PUT | `/expeditions/{id}` | Update expedition |
| DELETE | `/expeditions/{id}` | Delete expedition |
| PATCH | `/expeditions/{id}/status` | Update expedition status |
| GET | `/users` | List users |
| POST | `/users` | Create user |
| GET | `/users/{id}` | User detail |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user |

---

## IMPLEMENTATION RULE

Implement one endpoint at a time.

For each endpoint:
1. Add or update the plain API function.
2. Add or update the hook if the UI needs cached state.
3. Wire the existing view or form to the new hook.
4. Remove or replace dummy data for that view.
5. Run the targeted tests/lint for the touched files.
6. Review the diff.
7. Commit only that endpoint change.

Do not start the next endpoint until the current one is reviewed, tested, and committed.
