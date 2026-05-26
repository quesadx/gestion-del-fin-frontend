export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  RESOURCE_MANAGER: 'resource_manager',
  TRAVEL_COORDINATOR: 'travel_coordinator',
  WORKER: 'worker',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Map of role → array of backend permission keys (local UI gating only).
// Backend enforces real permissions via permissionMiddleware on every request.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: ['*'],
  resource_manager: [
    'inventory.*',
    'transfers.*',
    'camps.read',
    'people.read',
    'people.profession_reassign.create',
    'expeditions.read',
    'metrics.dashboard',
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
    'metrics.dashboard',
    'resources.read',
    'inventory.read',
  ],
  worker: ['metrics.dashboard', 'people.read', 'inventory.read', 'resources.read', 'camps.read'],
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

import { useDeniedPermissionsStore } from '../store/deniedPermissions';
import { useAuthStore } from '../store/auth';

export function hasPermission(
  permissions: string[] | null | undefined,
  permission: string,
): boolean {
  const denied = useDeniedPermissionsStore.getState().denied;
  if (denied.has(permission)) return false;
  return matchPermission(permissions, permission);
}

/**
 * Returns true if the current user can access camp-scoped data for the
 * given camp ID. Non-admin users can only access their own camp.
 */
export function canAccessCamp(campId: number): boolean {
  const { isAdmin, user } = useAuthStore.getState();
  if (isAdmin) return true;
  return campId === user?.camp_id;
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
