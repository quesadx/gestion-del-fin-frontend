export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  RESOURCE_MANAGER: 'resource_manager',
  TRAVEL_COORDINATOR: 'travel_coordinator',
  SURVIVOR: 'survivor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Map of role → array of permission keys they hold
const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: ['*'],
  resource_manager: [
    'inventory.*',
    'transfers.*',
    'camps.read',
    'people.read',
    'expeditions.read',
    'dashboard.read',
    'resources.*',
    'admission.read',
  ],
  travel_coordinator: [
    'expeditions.*',
    'transfers.create',
    'transfers.read',
    'people.read',
    'camps.read',
    'dashboard.read',
    'resources.read',
    'inventory.read',
  ],
  survivor: ['dashboard.read', 'people.read', 'inventory.read', 'resources.read', 'camps.read'],
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
