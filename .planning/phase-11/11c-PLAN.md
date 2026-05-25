---
phase: 11
sub_phase: c
wave: 3
depends_on: [11b]
files_modified:
  - src/features/people/PopulationRoster.tsx
  - src/features/people/PersonDetail.tsx
  - src/features/inventory/InventoryList.tsx
  - src/features/resources/ResourcesPage.tsx
  - src/features/rations/RationsPage.tsx
  - src/features/professions/ProfessionsPage.tsx
  - src/features/camps/CampManagement.tsx
  - src/features/camps/CampDetail.tsx
  - src/features/explorations/ExpeditionList.tsx
  - src/features/explorations/ExpeditionDetail.tsx
  - src/features/admission/AdmissionList.tsx
  - src/features/users/UsersPage.tsx
  - src/features/roles/RolesPage.tsx
  - src/features/permissions/PermissionsPage.tsx
autonomous: true
---

# Plan 11c: Add Permission Guards to All Components

**Goal:** Add permission checks using `useCan()`, `Can`, or `can()` to every action button, modal, and UI element across all 14+ feature components. Use `PERM` constants for every check. Follow the UX pattern: hidden by default for primary action buttons, disabled with tooltip for critical operational actions (explicitly noted per task).

**must_haves:**

- Every action button listed in CONTEXT.md is gated by the specified permission key
- No inline permission strings — all use `PERM` constants
- Layout stability maintained — flex/grid handles hidden elements naturally
- `pnpm check` passes — lint, spell, build succeed
- Zero `canLegacy()` calls in any of the 14 files

---

## Pattern Reference

**Standard pattern** (primary action buttons — hidden):

```tsx
import { useCan, PERM } from '../../lib/permissions';
const canCreate = useCan(PERM.PEOPLE_CREATE);
// In JSX:
{canCreate && <button onClick={...}>NEW</button>}
```

**Can component pattern** (alternative, cleaner for single-button cases):

```tsx
import { Can, PERM } from '../../lib/permissions';
<Can permission={PERM.PEOPLE_CREATE}>
  <button onClick={...}>NEW</button>
</Can>
```

**Disabled + tooltip pattern** (critical operational actions):

```tsx
{canDeploy ? (
  <button onClick={...}>DEPLOY</button>
) : (
  <button disabled title="No tienes permiso para realizar esta acción">DEPLOY</button>
)}
```

**can() non-reactive** (for mutation conditions, not inside JSX render logic):

```tsx
import { can, PERM } from '../../lib/permissions';
const showAction = can(PERM.PEOPLE_DELETE);
```

---

## Tasks

---

### 11c-T01 — Guard `PopulationRoster.tsx` action buttons

<task>
<description>Add permission checks to NEW SURVIVOR, edit, delete, transfer, and reassign buttons</description>

<read_first>

- src/features/people/PopulationRoster.tsx (current state — understand button locations: NEW SURVIVOR in header, edit/delete/transfer in row actions, reassign button)
- src/lib/permissions.ts (after 11b — PERM constants, useCan, Can, can)
  </read_first>

<action>
Add guards in `src/features/people/PopulationRoster.tsx`:

1. Import `useCan` and `PERM` from `../../lib/permissions`
2. Add hooks at top of component:
   - `const canCreatePerson = useCan(PERM.PEOPLE_CREATE);`
   - `const canUpdatePerson = useCan(PERM.PEOPLE_UPDATE);`
   - `const canDeletePerson = useCan(PERM.PEOPLE_DELETE);`
   - `const canCreateTransfer = useCan(PERM.TRANSFERS_CREATE);`

3. Gate the NEW SURVIVOR button (should be around line ~170-180 area, a large `UserPlus` icon button) with `canCreatePerson` — wrap with `{canCreatePerson && (...)}`

4. Gate the edit button in each row action (Edit2 icon, around line ~350-400 area) with `canUpdatePerson`

5. Gate the delete button in each row action (Trash2 icon) with `canDeletePerson`

6. Gate the transfer button in each row action (ArrowLeftRight icon) with `canCreateTransfer`

7. The REASSIGN button (line ~199 area using `can(user?.role, 'people.profession_reassign.create')`) — migrate this to `can(PERM.PEOPLE_PROFESSION_REASSIGN_CREATE)` using the store-backed can()

All buttons should be hidden (not disabled) when permission is denied — per the standard hidden pattern.
</action>

<acceptance_criteria>

- NEW SURVIVOR button not rendered when user lacks `PERM.PEOPLE_CREATE`
- Edit button (Edit2 icon in row) not rendered when user lacks `PERM.PEOPLE_UPDATE`
- Delete button (Trash2 icon in row) not rendered when user lacks `PERM.PEOPLE_DELETE`
- Transfer button (ArrowLeftRight icon in row) not rendered when user lacks `PERM.TRANSFERS_CREATE`
- REASSIGN button gated by `can(PERM.PEOPLE_PROFESSION_REASSIGN_CREATE)`
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `PopulationRoster.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T02 — Guard `PersonDetail.tsx` action buttons

<task>
<description>Add permission checks to EDIT PROFILE, DELETE RECORD, TRANSFER, LOG STATUS, REASSIGN PROFESSION, OVERRIDE CONTRIBUTION buttons</description>

<read_first>

- src/features/people/PersonDetail.tsx (current state — full file to understand button layout: EDIT PROFILE, DELETE RECORD, TRANSFER in header; LOG STATUS CHANGE, REASSIGN PROFESSION, OVERRIDE CONTRIBUTION in action sections)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/people/PersonDetail.tsx`:

1. Import `useCan` and `PERM` (keep existing `can` import if still used)
2. Add hooks:
   - `const canUpdate = useCan(PERM.PEOPLE_UPDATE);`
   - `const canDelete = useCan(PERM.PEOPLE_DELETE);`
   - `const canTransfer = useCan(PERM.TRANSFERS_CREATE);`
   - `const canLogStatus = useCan(PERM.PEOPLE_STATUS_LOG);`
   - `const canReassignProfession = useCan(PERM.PEOPLE_PROFESSION_REASSIGN_CREATE);`
   - `const canOverrideContribution = useCan(PERM.PEOPLE_CONTRIBUTION_OVERRIDE);`

3. Gate EDIT PROFILE button with `canUpdate`
4. Gate DELETE RECORD button with `canDelete`
5. Gate TRANSFER button with `canTransfer`
6. Gate LOG STATUS CHANGE button with `canLogStatus`
7. Gate REASSIGN PROFESSION button with `canReassignProfession`
8. Gate OVERRIDE CONTRIBUTION button with `canOverrideContribution`

**Special case:** On line 44, `const hasReadPermission = can(user?.role, 'people.read');` — migrate this to `const hasReadPermission = can(PERM.PEOPLE_READ);` using the store-backed `can()` (imported as non-reactive helper).

All buttons hidden when denied, following the standard hidden pattern.
</action>

<acceptance_criteria>

- EDIT PROFILE button not rendered when user lacks `PERM.PEOPLE_UPDATE`
- DELETE RECORD button not rendered when user lacks `PERM.PEOPLE_DELETE`
- TRANSFER button not rendered when user lacks `PERM.TRANSFERS_CREATE`
- LOG STATUS CHANGE button not rendered when user lacks `PERM.PEOPLE_STATUS_LOG`
- REASSIGN PROFESSION button not rendered when user lacks `PERM.PEOPLE_PROFESSION_REASSIGN_CREATE`
- OVERRIDE CONTRIBUTION button not rendered when user lacks `PERM.PEOPLE_CONTRIBUTION_OVERRIDE`
- `hasReadPermission` uses `can(PERM.PEOPLE_READ)` — store-backed, no `user?.role` param
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `PersonDetail.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T03 — Guard `InventoryList.tsx` action buttons

<task>
<description>Add permission checks to MANUAL ADJUST and VIEW AUDIT TRAIL buttons</description>

<read_first>

- src/features/inventory/InventoryList.tsx (current state — MANUAL ADJUST is the plus/minus button or modal trigger in header area; VIEW AUDIT TRAIL is the History icon button)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/inventory/InventoryList.tsx`:

1. Import `useCan` and `PERM`
2. Add hooks:
   - `const canAdjust = useCan(PERM.INVENTORY_ADJUST);`
   - `const canAudit = useCan(PERM.INVENTORY_AUDIT);`

3. Gate MANUAL ADJUST button (the `ArrowDownUp` icon button or the "+ ADJUST" button in the header) with `canAdjust`
4. Gate VIEW AUDIT TRAIL button (`History` icon, navigates to `/inventory/audit`) with `canAudit`

All buttons hidden when denied.
</action>

<acceptance_criteria>

- MANUAL ADJUST button not rendered when user lacks `PERM.INVENTORY_ADJUST`
- VIEW AUDIT TRAIL button not rendered when user lacks `PERM.INVENTORY_AUDIT`
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `InventoryList.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T04 — Guard `ResourcesPage.tsx` action buttons

<task>
<description>Add permission checks to NEW RESOURCE TYPE, edit, and delete buttons</description>

<read_first>

- src/features/resources/ResourcesPage.tsx (current state — NEW button in header, edit/delete in each resource row)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/resources/ResourcesPage.tsx`:

1. Import `useCan` and `PERM`
2. Add hooks:
   - `const canCreate = useCan(PERM.RESOURCES_CREATE);`
   - `const canUpdate = useCan(PERM.RESOURCES_UPDATE);`
   - `const canDelete = useCan(PERM.RESOURCES_DELETE);`

3. Gate the NEW RESOURCE TYPE button (Plus icon, header area) with `canCreate`
4. Gate edit buttons (Edit2 icon in each row) with `canUpdate`
5. Gate delete buttons (Trash2 icon in each row) with `canDelete`

All buttons hidden when denied.
</action>

<acceptance_criteria>

- NEW RESOURCE TYPE button not rendered when user lacks `PERM.RESOURCES_CREATE`
- Edit buttons not rendered when user lacks `PERM.RESOURCES_UPDATE`
- Delete buttons not rendered when user lacks `PERM.RESOURCES_DELETE`
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `ResourcesPage.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T05 — Guard `RationsPage.tsx` NEW RATION button

<task>
<description>Add permission check to the NEW RATION button</description>

<read_first>

- src/features/rations/RationsPage.tsx (current state — NEW RATION button in header)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/rations/RationsPage.tsx`:

1. Import `useCan` and `PERM`
2. Add hook: `const canAdjust = useCan(PERM.INVENTORY_ADJUST);`
3. Gate the NEW RATION button with `canAdjust`

Button hidden when denied.
</action>

<acceptance_criteria>

- NEW RATION button not rendered when user lacks `PERM.INVENTORY_ADJUST`
- Run `pnpm exec tsc --noEmit` — no type errors in `RationsPage.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T06 — Guard `ProfessionsPage.tsx` action buttons

<task>
<description>Add permission checks to NEW PROFESSION, edit, and delete buttons</description>

<read_first>

- src/features/professions/ProfessionsPage.tsx (current state — NEW button in header, edit/delete in each row)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/professions/ProfessionsPage.tsx`:

1. Import `useCan` and `PERM`
2. Add hooks:
   - `const canCreate = useCan(PERM.PROFESSIONS_CREATE);`
   - `const canUpdate = useCan(PERM.PROFESSIONS_UPDATE);`
   - `const canDelete = useCan(PERM.PROFESSIONS_DELETE);`

3. Gate NEW PROFESSION button with `canCreate`
4. Gate edit buttons with `canUpdate`
5. Gate delete buttons with `canDelete`

All buttons hidden when denied.
</action>

<acceptance_criteria>

- NEW PROFESSION button not rendered when user lacks `PERM.PROFESSIONS_CREATE`
- Edit buttons not rendered when user lacks `PERM.PROFESSIONS_UPDATE`
- Delete buttons not rendered when user lacks `PERM.PROFESSIONS_DELETE`
- Run `pnpm exec tsc --noEmit` — no type errors in `ProfessionsPage.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T07 — Guard `CampManagement.tsx` action buttons

<task>
<description>Add permission checks to REGISTER NEW REFUGE and edit buttons</description>

<read_first>

- src/features/camps/CampManagement.tsx (current state — REGISTER button in header, edit button in rows, existing `canDelete` check for delete button via `can(user?.role, 'camps.delete')` at line ~60)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/camps/CampManagement.tsx`:

1. Import `useCan` and `PERM`
2. Add hooks:
   - `const canCreateCamp = useCan(PERM.CAMPS_CREATE);`
   - `const canUpdateCamp = useCan(PERM.CAMPS_UPDATE);`
3. Migrate existing delete check on line ~60 from `can(user?.role, 'camps.delete')` to `can(PERM.CAMPS_DELETE)`

4. Gate REGISTER NEW REFUGE button with `canCreateCamp`
5. Gate edit buttons with `canUpdateCamp`
6. Delete button already handled by keyword `canDelete` — migrate its `can()` call

All buttons hidden when denied.
</action>

<acceptance_criteria>

- REGISTER NEW REFUGE button not rendered when user lacks `PERM.CAMPS_CREATE`
- Edit buttons not rendered when user lacks `PERM.CAMPS_UPDATE`
- Delete uses `can(PERM.CAMPS_DELETE)` — no `user?.role` param
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `CampManagement.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T08 — Guard `CampDetail.tsx` action buttons

<task>
<description>Add permission checks to edit and delete actions on the camp detail page</description>

<read_first>

- src/features/camps/CampDetail.tsx (current state — edit/delete buttons in detail view, existing `can(user?.role, 'camps.read')` at line ~17)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/camps/CampDetail.tsx`:

1. Import `useCan` and `PERM`
2. Migrate existing read check on line ~17 from `can(user?.role, 'camps.read')` to `can(PERM.CAMPS_READ)`
3. Add hooks: `const canUpdate = useCan(PERM.CAMPS_UPDATE);` and `const canDelete = useCan(PERM.CAMPS_DELETE);`
4. Gate edit button with `canUpdate`
5. Gate delete button with `canDelete`

All buttons hidden when denied.
</action>

<acceptance_criteria>

- Edit button not rendered when user lacks `PERM.CAMPS_UPDATE`
- Delete button not rendered when user lacks `PERM.CAMPS_DELETE`
- Read permission uses `can(PERM.CAMPS_READ)` — no `user?.role` param
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `CampDetail.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T09 — Guard `ExpeditionList.tsx` action buttons

<task>
<description>Add permission checks to DEPLOY, RETURN/LOST, edit, and delete buttons. Critical action buttons use disabled+tooltip pattern.</description>

<read_first>

- src/features/explorations/ExpeditionList.tsx (current state — DEPLOY, RETURN/LOST are critical operational status-change buttons; edit/delete are row-level; existing `can(user?.role, 'expeditions.create')` at line ~33 for CONFIGURE MISSION)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/explorations/ExpeditionList.tsx`:

1. Import `useCan` and `PERM`
2. Migrate existing check on line ~33 from `can(user?.role, 'expeditions.create')` to `can(PERM.EXPEDITIONS_CREATE)`
3. Add hooks:
   - `const canManage = useCan(PERM.EXPEDITIONS_MANAGE);` — for DEPLOY, RETURN/LOST
   - `const canUpdate = useCan(PERM.EXPEDITIONS_UPDATE);`
   - `const canDelete = useCan(PERM.EXPEDITIONS_DELETE);`

4. **Critical action pattern** for DEPLOY and RETURN/LOST buttons: use disabled+tooltip when denied
   - If `canManage`: render normal button
   - If `!canManage`: render `<button disabled title="No tienes permiso para realizar esta acción">DEPLOY</button>` (or RETURN/LOST)

5. Gate edit buttons with `canUpdate` — hidden pattern
6. Gate delete buttons with `canDelete` — hidden pattern

The CONFIGURE MISSION button already exists and is gated by `canCreate` — keep its guard, just migrate the `can()` call.
</action>

<acceptance_criteria>

- DEPLOY button disabled + tooltip when user lacks `PERM.EXPEDITIONS_MANAGE`
- RETURN/LOST button disabled + tooltip when user lacks `PERM.EXPEDITIONS_MANAGE`
- Edit buttons not rendered when user lacks `PERM.EXPEDITIONS_UPDATE`
- Delete buttons not rendered when user lacks `PERM.EXPEDITIONS_DELETE`
- CONFIGURE MISSION uses `can(PERM.EXPEDITIONS_CREATE)` — no `user?.role` param
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `ExpeditionList.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T10 — Guard `ExpeditionDetail.tsx` action buttons

<task>
<description>Add permission checks to status-change and edit action buttons</description>

<read_first>

- src/features/explorations/ExpeditionDetail.tsx (current state — status change buttons, edit actions; existing `can(user?.role, 'expeditions.read')` at line ~44)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/explorations/ExpeditionDetail.tsx`:

1. Import `useCan` and `PERM`
2. Migrate existing line ~44 from `can(user?.role, 'expeditions.read')` to `can(PERM.EXPEDITIONS_READ)`
3. Add hooks: `const canManage = useCan(PERM.EXPEDITIONS_MANAGE);` and `const canUpdate = useCan(PERM.EXPEDITIONS_UPDATE);`
4. Gate status-change buttons (deploy, return, cancel, etc.) with `canManage` — disabled+tooltip pattern (critical actions)
5. Gate edit actions with `canUpdate` — hidden pattern
   </action>

<acceptance_criteria>

- Status-change buttons disabled + tooltip when user lacks `PERM.EXPEDITIONS_MANAGE`
- Edit actions hidden when user lacks `PERM.EXPEDITIONS_UPDATE`
- Read permission uses `can(PERM.EXPEDITIONS_READ)` — no `user?.role` param
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `ExpeditionDetail.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T11 — Guard `AdmissionList.tsx` action buttons

<task>
<description>Add permission checks to APPROVE/REJECT and REGISTER INTAKE buttons. APPROVE/REJECT use disabled+tooltip pattern.</description>

<read_first>

- src/features/admission/AdmissionList.tsx (current state — APPROVE/REJECT are critical operational buttons; REGISTER INTAKE is in header; existing `can(user?.role, 'admission.create') && can(user?.role, 'admission.review')` at line ~32)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/admission/AdmissionList.tsx`:

1. Import `useCan` and `PERM`
2. Migrate existing line ~32: replace `can(user?.role, 'admission.create') && can(user?.role, 'admission.review')` with two separate hooks:
   - `const canCreate = useCan(PERM.ADMISSION_CREATE);`
   - `const canReview = useCan(PERM.ADMISSION_REVIEW);`

3. Gate REGISTER INTAKE button with `canCreate` — hidden pattern
4. Gate APPROVE/REJECT buttons with `canReview` — **disabled+tooltip pattern** (critical actions, per RESEARCH section 9)

5. Ensure the existing `can` import (if used elsewhere) is updated to the new store-backed API.
   </action>

<acceptance_criteria>

- REGISTER INTAKE button not rendered when user lacks `PERM.ADMISSION_CREATE`
- APPROVE button disabled + tooltip when user lacks `PERM.ADMISSION_REVIEW`
- REJECT button disabled + tooltip when user lacks `PERM.ADMISSION_REVIEW`
- Zero `can(user?.role, ...)` or `canLegacy(...)` calls in the file
- Run `pnpm exec tsc --noEmit` — no type errors in `AdmissionList.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T12 — Guard `UsersPage.tsx` action buttons

<task>
<description>Add permission checks to NEW USER, edit, and delete buttons</description>

<read_first>

- src/features/users/UsersPage.tsx (current state — NEW USER button in header, edit/delete in each user row)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/users/UsersPage.tsx`:

1. Import `useCan` and `PERM`
2. Add hooks:
   - `const canCreateUser = useCan(PERM.USERS_CREATE);`
   - `const canUpdateUser = useCan(PERM.USERS_UPDATE);`
   - `const canDeleteUser = useCan(PERM.USERS_DELETE);`

3. Gate NEW USER button with `canCreateUser`
4. Gate edit buttons with `canUpdateUser`
5. Gate delete buttons with `canDeleteUser`

All buttons hidden when denied.
</action>

<acceptance_criteria>

- NEW USER button not rendered when user lacks `PERM.USERS_CREATE`
- Edit buttons not rendered when user lacks `PERM.USERS_UPDATE`
- Delete buttons not rendered when user lacks `PERM.USERS_DELETE`
- Run `pnpm exec tsc --noEmit` — no type errors in `UsersPage.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T13 — Guard `RolesPage.tsx` action buttons

<task>
<description>Add permission checks to NEW ROLE, edit, and delete buttons</description>

<read_first>

- src/features/roles/RolesPage.tsx (current state — NEW ROLE button in header, edit/delete in each role row)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/roles/RolesPage.tsx`:

1. Import `useCan` and `PERM`
2. Add hooks:
   - `const canCreate = useCan(PERM.ROLES_ALL);`
   - `const canUpdate = useCan(PERM.ROLES_ALL);`
   - `const canDelete = useCan(PERM.ROLES_ALL);`

3. Gate NEW ROLE button with `canCreate`
4. Gate edit buttons with `canUpdate`
5. Gate delete buttons with `canDelete`

All buttons hidden when denied.
</action>

<acceptance_criteria>

- NEW ROLE button not rendered when user lacks `PERM.ROLES_ALL`
- Edit buttons not rendered when user lacks `PERM.ROLES_ALL`
- Delete buttons not rendered when user lacks `PERM.ROLES_ALL`
- Run `pnpm exec tsc --noEmit` — no type errors in `RolesPage.tsx`
  </acceptance_criteria>

</task>

---

### 11c-T14 — Guard `PermissionsPage.tsx` action buttons

<task>
<description>Add permission checks to NEW PERMISSION, edit, and delete buttons</description>

<read_first>

- src/features/permissions/PermissionsPage.tsx (current state — NEW PERMISSION button in header, edit/delete in each permission row)
- src/lib/permissions.ts (PERM constants)
  </read_first>

<action>
Add guards in `src/features/permissions/PermissionsPage.tsx`:

1. Import `useCan` and `PERM`
2. Add hooks:
   - `const canCreate = useCan(PERM.PERMISSIONS_ALL);`
   - `const canUpdate = useCan(PERM.PERMISSIONS_ALL);`
   - `const canDelete = useCan(PERM.PERMISSIONS_ALL);`

3. Gate NEW PERMISSION button with `canCreate`
4. Gate edit buttons with `canUpdate`
5. Gate delete buttons with `canDelete`

All buttons hidden when denied.
</action>

<acceptance_criteria>

- NEW PERMISSION button not rendered when user lacks `PERM.PERMISSIONS_ALL`
- Edit buttons not rendered when user lacks `PERM.PERMISSIONS_ALL`
- Delete buttons not rendered when user lacks `PERM.PERMISSIONS_ALL`
- Run `pnpm exec tsc --noEmit` — no type errors in `PermissionsPage.tsx`
  </acceptance_criteria>

</task>

---

## Verification

After all 11c tasks are complete:

```bash
pnpm exec tsc --noEmit
```

Expected: Zero TypeScript errors.

```bash
grep -r "canLegacy" src/ --include="*.tsx" --include="*.ts"
```

Expected: No matches — all call sites migrated.

```bash
grep -rP "can\(.*\?\.role" src/ --include="*.tsx"
```

Expected: No matches — zero `can(user?.role, ...)` calls remain.

```bash
pnpm check
```

Expected: Lint, spell, and build pass. Zero errors.
