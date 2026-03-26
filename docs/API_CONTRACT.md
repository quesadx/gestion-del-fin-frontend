# API_CONTRACT.md — Gestión del Fin · Backend API & Data Layer

> Load this when working on: API functions, TanStack Query hooks, Zustand stores, Axios config.

---

## BASE URL & HEADERS

```
Base URL: http://localhost:3000/api   (env: VITE_API_URL)
```

Every request except `/auth/login` requires:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Camp-Id: <camp_uuid>
```

`X-Camp-Id` enables multi-tenant isolation. Injected automatically by the Axios interceptor.

---

## STATE SPLIT — THE KEY RULE

```
Zustand  → auth session, active camp, UI state (never API data)
TanStack Query → everything that comes from the API
```

When the camp changes: call `queryClient.clear()` — one call invalidates all cached server data.

---

## STANDARD RESPONSE ENVELOPE

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ApiError {
  success: false
  message: string
  errors?: { field: string; message: string }[]  // Zod field errors
  statusCode: number
}
```

---

## AXIOS INSTANCE

```typescript
// src/shared/api/axiosInstance.ts
import axios from 'axios'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useCampStore } from '@/features/camps/store/camp.store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  const campId = useCampStore.getState().activeCamp?.id
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (campId) config.headers['X-Camp-Id'] = campId
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

---

## TANSTACK QUERY CLIENT

```typescript
// src/shared/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // data stays fresh 30s
      retry: 2,                 // retry failed requests twice
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

### Query key conventions
```typescript
// Always include campId so queries are isolated per camp
['resources', campId]
['people', campId]
['explorations', campId]
['transfers', campId]
['dashboard', campId]
['person', campId, personId]      // single resource
['resource', campId, resourceId]
```

### Camp switch — cache invalidation
```typescript
// When user switches camp, clear ALL server state in one call
import { queryClient } from '@/shared/lib/queryClient'
queryClient.clear()
```

---

## API FUNCTIONS (plain Axios — no hooks here)

API files export plain async functions. TanStack Query hooks call these functions.

### auth.api.ts
```typescript
// features/auth/api/auth.api.ts
import { api } from '@/shared/api/axiosInstance'
import type { User } from '../types/auth.types'

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials)
      .then(r => r.data.data),

  logout: () => api.post('/auth/logout'),

  verifySession: (password: string) =>
    api.post<ApiResponse<{ valid: boolean }>>('/auth/verify-session', { password })
      .then(r => r.data.data),
}
```

### people.api.ts
```typescript
// features/people/api/people.api.ts
import { api } from '@/shared/api/axiosInstance'
import type { Survivor, IngressEvalRequest, AIAnalysisResult } from '../types/person.types'

export const peopleApi = {
  getAll: () =>
    api.get<ApiResponse<Survivor[]>>('/people').then(r => r.data.data),

  getById: (id: string) =>
    api.get<ApiResponse<Survivor>>(`/people/${id}`).then(r => r.data.data),

  create: (payload: CreateSurvivorPayload) =>
    api.post<ApiResponse<Survivor>>('/people', payload).then(r => r.data.data),

  updateCondition: (id: string, condition: Condition) =>
    api.patch<ApiResponse<Survivor>>(`/people/${id}/condition`, { condition })
      .then(r => r.data.data),

  evaluateIngress: (data: IngressEvalRequest) =>
    api.post<ApiResponse<AIAnalysisResult>>('/people/ingress-eval', data)
      .then(r => r.data.data),
}
```

### resources.api.ts
```typescript
// features/inventory/api/resources.api.ts
import { api } from '@/shared/api/axiosInstance'
import type { Resource } from '../types/resource.types'

export const resourcesApi = {
  getAll: () =>
    api.get<ApiResponse<Resource[]>>('/resources').then(r => r.data.data),

  getMine: () =>
    api.get<ApiResponse<Resource[]>>('/resources/mine').then(r => r.data.data),

  addEntry: (payload: ResourceEntryPayload) =>
    api.post<ApiResponse<Resource>>('/resources/entry', payload).then(r => r.data.data),

  requestExit: (payload: ResourceExitPayload) =>
    api.post<ApiResponse<void>>('/resources/exit', payload).then(r => r.data.data),
}
```

---

## TANSTACK QUERY HOOKS (one file per feature)

Query hooks live in `features/[x]/hooks/`. They wrap API functions with `useQuery`/`useMutation`.

### useResources.ts
```typescript
// features/inventory/hooks/useResources.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCampStore } from '@/features/camps/store/camp.store'
import { resourcesApi } from '../api/resources.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Role } from '@/features/auth/types/auth.types'

const WORKER_ROLES: Role[] = ['worker']

export function useResources() {
  const campId = useCampStore(s => s.activeCamp?.id)
  const role = useAuthStore(s => s.role)
  const queryClient = useQueryClient()

  // Workers get only their assigned resources
  const fetcher = role && WORKER_ROLES.includes(role)
    ? resourcesApi.getMine
    : resourcesApi.getAll

  const query = useQuery({
    queryKey: ['resources', campId],
    queryFn: fetcher,
    enabled: !!campId,
    staleTime: 30_000,
  })

  // Derived — no store needed
  const lowStock = query.data?.filter(r => r.quantity < r.minThreshold) ?? []

  const addEntry = useMutation({
    mutationFn: resourcesApi.addEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', campId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', campId] })
    },
  })

  const requestExit = useMutation({
    mutationFn: resourcesApi.requestExit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', campId] })
    },
  })

  return { ...query, lowStock, addEntry, requestExit }
}
```

### usePeople.ts
```typescript
// features/people/hooks/usePeople.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCampStore } from '@/features/camps/store/camp.store'
import { peopleApi } from '../api/people.api'

export function usePeople() {
  const campId = useCampStore(s => s.activeCamp?.id)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['people', campId],
    queryFn: peopleApi.getAll,
    enabled: !!campId,
  })

  const updateCondition = useMutation({
    mutationFn: ({ id, condition }: { id: string; condition: Condition }) =>
      peopleApi.updateCondition(id, condition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', campId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', campId] })
    },
  })

  return { ...query, updateCondition }
}

export function usePerson(personId: string) {
  const campId = useCampStore(s => s.activeCamp?.id)
  return useQuery({
    queryKey: ['person', campId, personId],
    queryFn: () => peopleApi.getById(personId),
    enabled: !!campId && !!personId,
  })
}
```

### useAIDecision.ts
```typescript
// features/people/hooks/useAIDecision.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCampStore } from '@/features/camps/store/camp.store'
import { peopleApi } from '../api/people.api'

export function useAIDecision() {
  const campId = useCampStore(s => s.activeCamp?.id)
  const queryClient = useQueryClient()

  const evaluate = useMutation({
    mutationFn: peopleApi.evaluateIngress,
    // result stays in mutation.data — no caching needed for one-off evaluation
  })

  const confirm = useMutation({
    mutationFn: peopleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', campId] })
    },
  })

  return { evaluate, confirm }
}
```

---

## ZUSTAND STORES (client state only)

### auth.store.ts
```typescript
// features/auth/store/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '../types/auth.types'

interface AuthState {
  user: User | null
  token: string | null
  role: Role | null
  lastActivity: number
  isLocked: boolean

  login: (token: string, user: User) => void
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
      role: null,
      lastActivity: Date.now(),
      isLocked: false,

      login: (token, user) =>
        set({ token, user, role: user.role, lastActivity: Date.now(), isLocked: false }),

      logout: () =>
        set({ user: null, token: null, role: null, isLocked: false }),

      updateActivity: () => set({ lastActivity: Date.now() }),

      lock: () => set({ isLocked: true }),

      unlock: async (password) => {
        const { authApi } = await import('../api/auth.api')
        const result = await authApi.verifySession(password)
        if (result.valid) {
          set({ isLocked: false, lastActivity: Date.now() })
        }
        return result.valid
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token, user: s.user, role: s.role }),
    }
  )
)
```

### camp.store.ts
```typescript
// features/camps/store/camp.store.ts
import { create } from 'zustand'
import type { Camp } from '../types/camp.types'

interface CampState {
  activeCamp: Camp | null
  availableCamps: Camp[]
  serverTime: number      // last known server Unix ms
  lastSyncLocal: number   // local Date.now() at sync time

  setActiveCamp: (camp: Camp) => void
  setAvailableCamps: (camps: Camp[]) => void
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

### uiStore — `app/` level
```typescript
interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  notifications: AppNotification[]

  toggleSidebar: () => void
  openModal: (id: string) => void
  closeModal: () => void
  pushNotification: (n: AppNotification) => void
  dismissNotification: (id: string) => void
}
```

---

## KEY TYPES

```typescript
// features/auth/types/auth.types.ts
export type Role = 'system_admin' | 'resource_manager' | 'worker' | 'travel_lead'
export interface User { id: string; username: string; role: Role; campId: string }

// features/people/types/person.types.ts
export type Condition = 'healthy' | 'injured' | 'sick' | 'away'
export interface Survivor {
  id: string; name: string; age: number; profession: string
  role: Role; condition: Condition; campId: string
  daysActive: number; createdAt: number
}
export interface IngressEvalRequest {
  name: string; age: number; skills: string[]
  physicalState: string; itemsFoundWith: string[]
  context: string; imageUrls?: string[]
}
export interface AIAnalysisResult {
  decision: 'ADMIT' | 'REJECT' | 'QUARANTINE'
  confidence: number         // 0-100
  reasons: string[]
  suggestedRole?: Role
  suggestedProfession?: string
  flaggedRisks?: string[]
}

// features/inventory/types/resource.types.ts
export type ResourceType = 'food' | 'water' | 'medicine' | 'ammo' | 'hygiene' | 'defense'
export interface Resource {
  id: string; type: ResourceType; name: string
  quantity: number; minThreshold: number; unit: string; campId: string
}

// features/explorations/types/exploration.types.ts
export type ExplorationStatus = 'scheduled' | 'active' | 'returned' | 'failed'
export interface Exploration {
  id: string; campId: string; teamIds: string[]
  scheduledDays: number; bufferDays: number
  status: ExplorationStatus; departureDate: number; returnDate?: number
  resourcesFound?: Partial<Record<ResourceType, number>>
}
```

---

## ENDPOINTS REFERENCE

| Method | Endpoint | Role | Query key |
|---|---|---|---|
| POST | `/auth/login` | Public | — |
| GET | `/system/time` | All | — |
| GET | `/camps` | All | `['camps']` |
| GET | `/people` | system_admin | `['people', campId]` |
| POST | `/people` | system_admin | invalidates `['people', campId]` |
| PATCH | `/people/:id/condition` | system_admin | invalidates `['people', campId]` |
| POST | `/people/ingress-eval` | system_admin | — (mutation only) |
| GET | `/resources` | resource_manager, worker | `['resources', campId]` |
| GET | `/resources/mine` | worker | `['resources', campId]` |
| POST | `/resources/entry` | resource_manager | invalidates `['resources', campId]` |
| POST | `/resources/exit` | worker | invalidates `['resources', campId]` |
| GET | `/explorations` | travel_lead | `['explorations', campId]` |
| POST | `/explorations` | travel_lead | invalidates `['explorations', campId]` |
| PATCH | `/explorations/:id/return` | travel_lead | invalidates `['explorations', campId]`, `['resources', campId]` |
| GET | `/transfers` | resource_manager, travel_lead | `['transfers', campId]` |
| POST | `/transfers/request` | travel_lead | invalidates `['transfers', campId]` |
| PATCH | `/transfers/:id/approve` | resource_manager | invalidates `['transfers', campId]`, `['resources', campId]` |
