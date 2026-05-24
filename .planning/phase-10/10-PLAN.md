---
wave: 3
id: phase-10-resource-alerts
depends_on:
  - phase-01
files_modified:
  - src/features/inventory/InventoryList.tsx
  - src/layouts/DashboardLayout.tsx
  - src/features/dashboard/DashboardOverview.tsx
autonomous: true
---

# Phase 10 — Resource Alerts Integration

## Objective

Add prominent resource stock alerts across the app. Current inventory shows OPTIMAL/LOW/CRITICAL per resource. Add global alert banner, nav indicator, and dashboard emphasis.

## Tasks

### Task 1: Global Stock Alert Banner

<read_first>

- src/layouts/DashboardLayout.tsx (banner pattern — existing disconnected banner at lines 208-233)
- src/features/inventory/InventoryList.tsx (existing snapshot query with status field)
- src/features/dashboard/DashboardOverview.tsx (existing stock alerts stat card)
  </read_first>

<action>
Add alert banner below top header in DashboardLayout:
- Query `GET /inventory/{campId}` on mount + refetch periodically
- Count resources with status LOW or CRITICAL
- If any CRITICAL: red banner "CRITICAL STOCK: {resource_names}" with pulse animation
- If any LOW no CRITICAL: amber banner "LOW STOCK: {N} resources below minimum"
- Banner has dismiss button (session-only dismiss via local state)
- Use same AnimatePresence pattern as disconnected banner
- Only visible when `currentCampId` is set
- Guard: `inventory.read` permission
</action>

<acceptance_criteria>

- Banner appears when resources at LOW or CRITICAL status
- CRITICAL resources show red banner with names
- LOW-only resources show amber banner with count
- Dismiss hides banner for session
- No banner when all resources OPTIMAL
- `pnpm check` passes
  </acceptance_criteria>

### Task 2: Nav-Level Alert Indicator

<read_first>

- src/layouts/DashboardLayout.tsx (nav items rendering at bottom)
  </read_first>

<action>
Add small red dot or badge on Inventory nav item when resources are CRITICAL
- Query inventory status alongside alert banner
- If any CRITICAL: show pulsing red dot next to inventory icon
- Reuse same query data as Task 1 (deduplicate with shared hook or query key)
</action>

<acceptance_criteria>

- Red dot appears on Inventory nav when resources CRITICAL
- Dot disappears when no CRITICAL resources
- `pnpm check` passes
  </acceptance_criteria>

### Task 3: Dashboard Alert Emphasis

<read_first>

- src/features/dashboard/DashboardOverview.tsx (existing stock alerts stat card)
  </read_first>

<action>
Enhance existing stock alerts card in DashboardOverview:
- Show count of CRITICAL resources separately (with red styling)
- Show count of LOW resources separately (with amber styling)
- Link "View Details" → navigate to `/inventory`
- If no alerts: show green "All stocks optimal" with checkmark
</action>

<acceptance_criteria>

- Dashboard shows CRITICAL count (red) and LOW count (amber) separately
- "All stocks optimal" shown when no alerts
- Link navigates to inventory page
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: deplete resource below minimum_stock → verify banner + nav dot + dashboard all show alert
- Dismiss banner → verify only banner hidden (nav dot + dashboard still show)
- Restock resource → verify all alerts clear
