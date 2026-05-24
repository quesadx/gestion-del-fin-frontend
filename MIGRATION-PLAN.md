# Migration Plan: Align Frontend → Backend Contract (2026-05-24)

**Source:** `contract-updated-24-05.md`
**Status:** Analysis complete — 19 issues found, 6 BREAKING

---

## Wave 1: Type Definitions (no runtime impact)

### 1.1 Fix `Person.status` enum

**File:** `src/types.ts:90`
**Current:** `'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD' | 'WOUNDED' | 'MISSING' | 'DECEASED'`
**Target:** `'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD'`
**Contract enum:** `persons_status` = `SICK, HEALTHY, INJURED, AWAY, DEAD`
**Risk:** MEDIUM — cascade fix in status log modal, edit forms, filter UI

### 1.2 Fix `Expedition.status` enum

**File:** `src/types.ts:150`
**Current:** `'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED' | 'PLANNING' | 'ACTIVE' | 'LOST'`
**Target:** `'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED'`
**Contract enum:** `expeditions_status` = `PLANNED, ONGOING, RETURNED, CANCELLED`
**Risk:** MEDIUM — cascade fix in ExpeditionList, ExpeditionDetail status conditions

### 1.3 Fix `UserRole` enum

**File:** `src/types.ts:1-6`
**Current:** `system_admin, resource_manager, travel_coordinator, survivor`
**Target:** `system_admin, resource_manager, travel_coordinator, worker`
**Contract roles:** `system_admin, worker, resource_manager, travel_coordinator`
**Risk:** LOW — `survivor` maps to `worker`; used in permissions.ts

### 1.4 Fix `Resource` Decimal types

**File:** `src/types.ts:25-32`
**Current:** `daily_ration: number; minimum_stock: number`
**Target:** `daily_ration: string | number; minimum_stock: string | number`
**Contract:** Prisma Decimal returns as string (`"0.50"`, `"100.00"`)
**Risk:** LOW — Number() conversion still works but type must accept string

### 1.5 Fix `InventoryItem` type

**File:** `src/types.ts:34-40`
**Current:** `{ id, camp_id, resource_type_id, quantity, last_updated }`
**Target:** Match real API shape: `{ resource_type_id, resource_name, unit, quantity, minimum_stock, is_below_minimum, resource_type: {...} }`
**Contract:** Custom shape (NOT OpenAPI `InventoryItem`)
**Risk:** MEDIUM — used in InventoryList, DashboardOverview, CampDetail

### 1.6 Fix `InventorySnapshot.status`

**File:** `src/types.ts:51`
**Current:** `'OPTIMAL' | 'LOW' | 'CRITICAL'`
**Target:** `'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCKED'`
**Contract:** `OK (>=min), LOW (<min), CRITICAL (<min*0.5), OVERSTOCKED (>min*3)`
**Risk:** LOW — just rename OPTIMAL→OK, add OVERSTOCKED

### 1.7 Fix `Admission` type

**File:** `src/types.ts:98-126`
**Issues:**

- Remove `status` field (not in contract)
- Add `correction_reason?: string | null`
- Add `reviewed_by?: number | null`
- Add `reviewed_at?: string | null`
  **Risk:** MEDIUM — AdmissionList uses `admission.status`

---

## Wave 2: Payload Fixes (BREAKING — wrong fields sent)

### 2.1 Status-log POST: remove `changed_by`

**File:** `src/features/people/PersonDetail.tsx:158-163`
**Current payload:** `{ person_id, new_status, reason, changed_by }`
**Target payload:** `{ person_id, new_status, reason }`
**Contract:** No `changed_by` field in status-log schema

### 2.2 Profession-reassign POST: remove `changed_by`, add `from_profession_id`

**File:** `src/features/people/PersonDetail.tsx:188-195`
**Current payload:** `{ person_id, to_profession_id, reason, start_date, end_date, changed_by }`
**Target payload:** `{ person_id, from_profession_id, to_profession_id, reason, start_date, end_date }`
**Contract:** Requires `from_profession_id`, NO `changed_by`

### 2.3 Contribution-override POST: remove `changed_by`

**File:** `src/features/people/PersonDetail.tsx:224-232`
**Current payload:** `{ person_id, resource_type_id, amount, reason, start_date, end_date, changed_by }`
**Target payload:** `{ person_id, resource_type_id, amount, reason, start_date, end_date }`
**Contract:** No `changed_by` field in override schema

---

## Wave 3: UI Status Map Fixes

### 3.1 Person status filter options

**Files:** `PopulationRoster.tsx`, `PersonDetail.tsx`
**Current options:** HEALTHY, WOUNDED, SICK, MISSING, DECEASED (+ INJURED, AWAY, DEAD in select)
**Target options:** HEALTHY, SICK, INJURED, AWAY, DEAD
**Mapping:** WOUNDED→INJURED, MISSING→AWAY, DECEASED→DEAD

### 3.2 Expedition status buttons/conditions

**Files:** `ExpeditionList.tsx`, `ExpeditionDetail.tsx`
**Remove:** All references to PLANNING→PLANNED, ACTIVE→ONGOING, LOST→CANCELLED
**Target:** PLANNED, ONGOING, RETURNED, CANCELLED only

### 3.3 Admission decision normalization

**File:** `AdmissionList.tsx:21-33`
**Remove:** `admission.status` usage — use `admission.final_decision` only
**Remove:** `APPROVED`→`ACCEPTED` mapping (contract has no APPROVED)

---

## Wave 4: Permission Map Alignment

### 4.1 Fix permission keys

**File:** `src/lib/permissions.ts:11-34`
**Current:** `admissions.*`, `admissions.read`
**Target:** `admission.*`, `admission.read`, `admission.create`, `admission.review`
**Contract:** Permission names: `admission.create`, `admission.read`, `admission.review`

---

## Wave 5: Inventory Type Usage Fixes

### 5.1 CampDetail inventory query type

**File:** `src/features/camps/CampDetail.tsx:44-51`
**Current:** Uses `InventoryItem[]` type with `unwrapList<InventoryItem>`
**Fix:** Update for real inventory shape (`resource_type_id` instead of `id`)

### 5.2 DashboardOverview inventory join

**File:** `src/features/dashboard/DashboardOverview.tsx:68-99`
**Current:** Uses `InventoryItem` type, accesses `item.quantity` and `item.id`
**Fix:** Use `resource_type_id` as key, match real API shape

---

## Wave 6: Optional Enhancements

### 6.1 Roles CRUD page

New page for `/api/roles` endpoints (POST/GET/PUT/DELETE)
**Contract note:** GET returns `{ permissions: [{id, name, description}] }` NOT `{ permission_ids: [1,2,3] }`

### 6.2 Permissions CRUD page

New page for `/api/permissions` endpoints

---

## Migration Order (by dependency)

```
Wave 1 (types) → no deps, safe first
  ↓
Wave 3 (UI) → depends on Wave 1 types
  ↓
Wave 2 (payload) → depends on Wave 1 + Wave 3 for correct field names
  ↓
Wave 4 (permissions) → independent, safe anytime
  ↓
Wave 5 (inventory) → depends on Wave 1 InventoryItem type
  ↓
Wave 6 (new pages) → independent, last
```

---

## Verification Gates

After each wave:

1. `pnpm run check` — no TypeScript errors
2. `pnpm run build` — vite build succeeds
3. Manual: test affected CRUD flow via browser

## Commit Plan (one per wave)

- `fix(types): align Person/Expedition/Resource/UserRole enums with contract`
- `fix(types): correct InventoryItem admission and inventory shapes to real API`
- `fix(ui): remove non-contract person statuses WOUNDED/MISSING/DECEASED`
- `fix(ui): remove non-contract expedition statuses PLANNING/ACTIVE/LOST`
- `fix(api): remove changed_by from status-log reassign override payloads`
- `fix(api): add from_profession_id to profession-reassign payload`
- `fix(permissions): align role permission keys with contract`
- `fix(inventory): use real API response shape in CampDetail and Dashboard`
