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

export function checkPermission(userPerms: string[], needed: string): boolean {
  for (const p of userPerms) {
    if (p === '*') return true;
    if (p === needed) return true;
    if (p.endsWith('.*')) {
      const ns = p.slice(0, -2);
      if (needed === ns || needed.startsWith(`${ns}.`)) return true;
    }
  }
  return false;
}

export const PERM = {
  CAMPS_CREATE: 'camps.create',
  CAMPS_READ: 'camps.read',
  CAMPS_UPDATE: 'camps.update',
  CAMPS_DELETE: 'camps.delete',
  PEOPLE_CREATE: 'people.create',
  PEOPLE_READ: 'people.read',
  PEOPLE_UPDATE: 'people.update',
  PEOPLE_DELETE: 'people.delete',
  PEOPLE_STATUS_LOG: 'people.status_log',
  PEOPLE_PROFESSION_REASSIGN_CREATE: 'people.profession_reassign.create',
  PEOPLE_CONTRIBUTION_OVERRIDE: 'people.contribution_override',
  RESOURCES_ALL: 'resources.*',
  RESOURCES_READ: 'resources.read',
  RESOURCES_CREATE: 'resources.create',
  RESOURCES_UPDATE: 'resources.update',
  RESOURCES_DELETE: 'resources.delete',
  PROFESSIONS_ALL: 'professions.*',
  PROFESSIONS_READ: 'professions.read',
  PROFESSIONS_CREATE: 'professions.create',
  PROFESSIONS_UPDATE: 'professions.update',
  PROFESSIONS_DELETE: 'professions.delete',
  USERS_ALL: 'users.*',
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_AUDIT: 'inventory.audit',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ALL: 'inventory.*',
  TRANSFERS_CREATE: 'transfers.create',
  TRANSFERS_READ: 'transfers.read',
  TRANSFERS_APPROVE: 'transfers.approve',
  TRANSFERS_COMPLETE: 'transfers.complete',
  TRANSFERS_ALL: 'transfers.*',
  EXPEDITIONS_CREATE: 'expeditions.create',
  EXPEDITIONS_READ: 'expeditions.read',
  EXPEDITIONS_UPDATE: 'expeditions.update',
  EXPEDITIONS_DELETE: 'expeditions.delete',
  EXPEDITIONS_MANAGE: 'expeditions.manage',
  EXPEDITIONS_ALL: 'expeditions.*',
  ADMISSION_CREATE: 'admission.create',
  ADMISSION_READ: 'admission.read',
  ADMISSION_REVIEW: 'admission.review',
  ADMISSION_ALL: 'admission.*',
  DASHBOARD_READ: 'dashboard.read',
  ROLES_ALL: 'roles.*',
  ROLES_READ: 'roles.read',
  PERMISSIONS_ALL: 'permissions.*',
  PERMISSIONS_READ: 'permissions.read',
  WILDCARD: '*',
} as const;

export type PermissionKey = (typeof PERM)[keyof typeof PERM];

/**
 * Returns true if the role has the given permission.
 * Supports wildcard "*" (all permissions) and namespace wildcard "inventory.*"
 * (any permission starting with "inventory.").
 */
export function can(role: string | null | undefined, permission: string): boolean {
  if (!role) return false;

  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;

  for (const p of perms) {
    // Full wildcard — role can do everything
    if (p === '*') return true;

    // Exact match
    if (p === permission) return true;

    // Namespace wildcard: "inventory.*" matches "inventory.read", "inventory.create", etc.
    if (p.endsWith('.*')) {
      const ns = p.slice(0, -2); // e.g. "inventory"
      if (permission === ns || permission.startsWith(`${ns}.`)) return true;
    }
  }

  return false;
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
