export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  RESOURCE_MANAGER: 'resource_manager',
  TRAVEL_COORDINATOR: 'travel_coordinator',
  WORKER: 'worker',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Map of role → array of frontend permission keys (local UI gating only).
// Backend enforces real permissions via permissionMiddleware on every request.
// `dashboard.read` is a local UI permission — the backend gate for /metrics/*
// endpoints uses `metrics.dashboard`, `metrics.resources`, etc. The `worker`
// role has `dashboard.read` to keep the dashboard nav visible; the Dashboard
// component gates individual data fetches by backend-available permissions.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: ['*'],
  resource_manager: [
    'inventory.*',
    'transfers.*',
    'camps.read',
    'people.read',
    'people.profession_reassign.create',
    'expeditions.read',
    'dashboard.read',
    'resources.*',
    'admission.read',
    'admission.create',
    'admission.review',
  ],
  travel_coordinator: [
    'expeditions.*',
    'expeditions.create',
    'transfers.create',
    'transfers.read',
    'people.read',
    'camps.read',
    'dashboard.read',
    'resources.read',
    'inventory.read',
  ],
  worker: ['dashboard.read', 'people.read', 'inventory.read', 'resources.read', 'camps.read'],
};

/**
 * Returns true if the role has the given permission.
 * Supports wildcard "*" (all permissions) and namespace wildcard "inventory.*"
 * (any permission starting with "inventory.").
 */
export function can(role: string | null | undefined, permission: string): boolean {
  if (!role) return false;

  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;

  return matchPermission(perms, permission);
}

function matchPermission(permissions: string[] | null | undefined, permission: string): boolean {
  if (!permissions || permissions.length === 0) return false;

  for (const p of permissions) {
    if (p === '*') return true;
    if (p === permission) return true;

    // Namespace wildcard in stored permissions: "inventory.*" matches "inventory.read"
    if (p.endsWith('.*')) {
      const ns = p.slice(0, -2);
      if (permission === ns || permission.startsWith(`${ns}.`)) return true;
    }

    // Namespace wildcard in requested permission: asking "inventory.*" matches "inventory.read"
    if (permission.endsWith('.*')) {
      const ns = permission.slice(0, -2);
      if (p === ns || p.startsWith(`${ns}.`)) return true;
    }
  }

  return false;
}

export function hasPermission(
  permissions: string[] | null | undefined,
  permission: string,
): boolean {
  return matchPermission(permissions, permission);
}

// ── Convenience helpers ───────────────────────────────────────────────────────

export function isAdmin(role: string | null | undefined): boolean {
  return can(role, '*') || role === ROLES.SYSTEM_ADMIN;
}

export function canManageInventory(role: string | null | undefined): boolean {
  return can(role, 'inventory.*');
}

export function canManageTransfers(role: string | null | undefined): boolean {
  return can(role, 'transfers.*');
}

export function canManageExpeditions(role: string | null | undefined): boolean {
  return can(role, 'expeditions.*');
}

export function canManageAdmissions(role: string | null | undefined): boolean {
  return can(role, 'admission.*');
}
