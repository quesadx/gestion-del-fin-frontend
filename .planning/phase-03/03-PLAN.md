---
wave: 1
id: phase-03-users-crud
depends_on:
  - phase-01
files_modified:
  - src/App.tsx
  - src/layouts/DashboardLayout.tsx
  - src/lib/permissions.ts
  - src/types.ts
  - src/features/users/UsersPage.tsx (new)
autonomous: true
---

# Phase 03 — Users CRUD Page

## Objective

System users management. Admins can list, create, edit, delete users and assign roles.

## Tasks

### Task 1: Create UsersPage

**File:** `src/features/users/UsersPage.tsx`

<read_first>

- src/features/resources/ResourcesPage.tsx (CRUD pattern for reference)
- src/types.ts (User type — check if role field complete)
- src/features/auth/LoginPage.tsx (User type usage)
- src/store/auth.ts (userId extraction pattern)
  </read_first>

<action>
Add/update User type in `src/types.ts`:
```
interface User {
  id: number;
  username: string;
  role: string;
  camp_id: number | null;
  is_active?: boolean;
}
```
Create page with:
- Table list from `GET /users`
- Create modal: username (text), password (text), role (select from known roles), camp_id (optional number)
- Edit modal: username, role, camp_id (no password field — password reset separate)
- Delete with confirmation
- Inline TanStack hooks: `useQuery(['users'], ...)`, mutations
- API calls via `apiClient`
- Guard: system_admin only
</action>

<acceptance_criteria>

- `GET /users` renders user table with username + role columns
- Create submits `POST /users` → list refreshes
- Edit submits `PUT /users/{id}` → row updates
- Delete confirmation → `DELETE /users/{id}` → row removed
- system_admin only — other roles redirected
  </acceptance_criteria>

### Task 2: Route + Nav

<read_first>

- src/App.tsx
- src/layouts/DashboardLayout.tsx
  </read_first>

<action>
Add route `path="users"` with ProtectedRoute checking system_admin
Add nav item: icon `Shield` from lucide-react, label "Users"
System admin sees item; hidden from others
</action>

<acceptance_criteria>

- `/users` renders page
- Nav visible only for system_admin
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: create user → login as new user → verify role-enforced access
- Verify duplicate username handling
