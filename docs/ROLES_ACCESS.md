# ROLES_ACCESS.md — Gestión del Fin · Roles, Guards & Session

> Load this when working on: auth flow, PrivateRoute, RoleGate, SessionGuard, lock screen, AI ingress.

---

## ROLES

```typescript
// Exact strings — must match backend
export type Role =
  | 'system_admin'       // Administrador sistema
  | 'resource_manager'   // Gestión recursos
  | 'worker'             // Trabajador
  | 'travel_lead'        // Encargado de viajes y comunicación
```

---

## ROLE → PAGE ACCESS MAP

```typescript
// src/shared/lib/roleGuards.ts
import type { Role } from '@/features/auth/types/auth.types'

export const ROLE_ACCESS: Record<string, Role[]> = {
  '/dashboard':           ['system_admin', 'resource_manager'],
  '/people':              ['system_admin'],
  '/people/new':          ['system_admin'],
  '/people/:id':          ['system_admin'],
  '/resources':           ['resource_manager', 'worker'],
  '/resources/mine':      ['worker'],
  '/explorations':        ['travel_lead'],
  '/transfers':           ['resource_manager', 'travel_lead'],
  '/camps':               ['system_admin'],
}

export function canAccess(role: Role, path: string): boolean {
  const allowed = ROLE_ACCESS[path]
  if (!allowed) return false
  return allowed.includes(role)
}
```

---

## ROLE CAPABILITIES SUMMARY

| Capability | system_admin | resource_manager | worker | travel_lead |
|---|:---:|:---:|:---:|:---:|
| View dashboard metrics | ✓ | ✓ | — | — |
| Manage survivor ingress | ✓ | — | — | — |
| View all survivors | ✓ | — | — | — |
| Update survivor condition | ✓ | — | — | — |
| View full inventory | — | ✓ | ✓ | — |
| View own assigned resources | — | — | ✓ | — |
| Add resources to warehouse | — | ✓ | — | — |
| Request resource removal | — | — | ✓ | — |
| Approve resource removal | — | ✓ | — | — |
| Schedule explorations | — | — | — | ✓ |
| Log exploration return | — | — | — | ✓ |
| Request inter-camp transfer | — | — | — | ✓ |
| Approve inter-camp transfer | — | ✓ | — | — |
| Manage camp list | ✓ | — | — | — |

---

## PRIVATEROUTE COMPONENT

```typescript
// src/shared/guards/PrivateRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Role } from '@/features/auth/types/auth.types'

interface Props {
  allowedRoles: Role[]
  children: React.ReactNode
}

export function PrivateRoute({ allowedRoles, children }: Props) {
  const { token, role } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
```

### Usage in AppRouter
```tsx
<Route
  path="/people"
  element={
    <PrivateRoute allowedRoles={['system_admin']}>
      <PeopleListPage />
    </PrivateRoute>
  }
/>
<Route
  path="/dashboard"
  element={
    <PrivateRoute allowedRoles={['system_admin', 'resource_manager']}>
      <DashboardPage />
    </PrivateRoute>
  }
/>
```

---

## ROLEGATE COMPONENT

Renders children only if the current user has one of the allowed roles. Use for conditional UI within a page (not for route protection — use PrivateRoute for that).

```typescript
// src/shared/guards/RoleGate.tsx
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { Role } from '@/features/auth/types/auth.types'

interface Props {
  allow: Role[]
  fallback?: React.ReactNode   // optional fallback if role not allowed
  children: React.ReactNode
}

export function RoleGate({ allow, fallback = null, children }: Props) {
  const role = useAuthStore((s) => s.role)
  if (!role || !allow.includes(role)) return <>{fallback}</>
  return <>{children}</>
}
```

### Usage
```tsx
// Dashboard metrics — only for admin and resource manager
<RoleGate allow={['system_admin', 'resource_manager']}>
  <ResourceChart />
</RoleGate>

// Action button — only for resource manager
<RoleGate allow={['resource_manager']} fallback={<span>Read only</span>}>
  <ApproveTransferButton />
</RoleGate>
```

---

## SESSIONGUARD & INACTIVITY

### How it works
- Tracks last user interaction timestamp in `authStore.lastActivity`
- Checks every 10 seconds if idle time >= 20 minutes
- On timeout: calls `authStore.lock()` → renders `LockScreen` overlay
- User must re-enter password to unlock (calls `/auth/verify-session`)
- On successful unlock: resets `lastActivity`, removes `LockScreen`

### useInactivity hook
```typescript
// src/features/auth/hooks/useInactivity.ts
import { useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'

const TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 1_200_000

export function useInactivity() {
  const { updateActivity, lock, isLocked } = useAuthStore()

  useEffect(() => {
    if (isLocked) return  // already locked, stop listening

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'pointermove']
    const handler = () => updateActivity()
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }))

    const interval = setInterval(() => {
      const idle = Date.now() - useAuthStore.getState().lastActivity
      if (idle >= TIMEOUT_MS) lock()
    }, 10_000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      clearInterval(interval)
    }
  }, [isLocked, updateActivity, lock])
}
```

### SessionGuard component
```typescript
// src/shared/guards/SessionGuard.tsx
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useInactivity } from '@/features/auth/hooks/useInactivity'
import { LockScreen } from '@/features/auth/components/LockScreen'

interface Props { children: React.ReactNode }

export function SessionGuard({ children }: Props) {
  useInactivity()
  const isLocked = useAuthStore((s) => s.isLocked)

  return (
    <>
      {children}
      {isLocked && <LockScreen />}
    </>
  )
}
```

### LockScreen behavior
- Full-screen overlay on top of device
- Displays: `SESSION LOCKED` in Press Start 2P, blinking at 1s interval
- Shows: last active camp name, current server time
- Password input (monospace, green border) + UNLOCK button
- On wrong password: `glitch` animation on the input + error message
- On success: `crtOn` animation as screen "powers back on"

---

## AUTH FLOW — COMPLETE SEQUENCE

### Login
```
1. User arrives at /login
2. LoginForm → POST /auth/login → { token, user }
3. authStore.login(token, user)
4. campStore: load available camps → GET /camps
5. If user has one camp: auto-select → redirect to /dashboard or role default
6. If multiple camps: show CampSwitcher first
7. SessionGuard starts inactivity tracking
```

### Camp switch
```
1. User selects different camp from CampSwitcher
2. campStore.resetCamp()
3. resourceStore: clear inventory + alerts
4. uiStore: close modals, clear notifications
5. Navigate to /login?campSwitch=true
6. LoginPage detects param → show "SWITCHING BASE..." header
7. After re-auth: new camp data loads, X-Camp-Id header updates automatically
```

### Logout
```
1. authStore.logout() → clears token, user, role
2. All stores reset to initial state
3. Navigate to /login
```

### Token expiry (handled by Axios interceptor)
```
1. Any 401 response → authStore.logout() → window.location.href = '/login'
```

---

## USESERVERTIME HOOK

Business logic must never use `Date.now()` directly. Use this hook instead.

```typescript
// src/shared/hooks/useServerTime.ts
import { useEffect } from 'react'
import { useCampStore } from '@/features/camps/store/camp.store'
import { api } from '@/shared/api/axiosInstance'

export function useServerTime() {
  const { syncServerTime } = useCampStore()

  useEffect(() => {
    syncServerTime()
    const interval = setInterval(syncServerTime, 60_000)
    return () => clearInterval(interval)
  }, [syncServerTime])
}

// To get current estimated server time anywhere:
export function getServerNow(): number {
  const { serverTime, lastSyncLocal } = useCampStore.getState()
  return serverTime + (Date.now() - lastSyncLocal)
}
```

Mount `useServerTime()` once at the top level inside `SessionGuard` or `DeviceLayout`.
