import { useAuthStore } from '../store';
import { createElement, Fragment, type ReactNode } from 'react';

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

export function can(permission: string): boolean {
  const permissions = useAuthStore.getState().permissions;
  if (permissions.length === 0) return false;
  return checkPermission(permissions, permission);
}

export function hasPermission(permission: string): boolean {
  return can(permission);
}

// ── React hooks ──────────────────────────────────────────────────────────────

export function useCan(permission: string): boolean {
  const permissions = useAuthStore((s) => s.permissions);
  const loaded = useAuthStore((s) => s.permissionsLoaded);
  if (!loaded) return false;
  return checkPermission(permissions, permission);
}

export function usePermissions() {
  const permissions = useAuthStore((s) => s.permissions);
  const loaded = useAuthStore((s) => s.permissionsLoaded);
  const error = useAuthStore((s) => s.permissionsError);

  return {
    can: (p: string) => checkPermission(permissions, p),
    loaded,
    error,
    isAdmin: checkPermission(permissions, '*'),
  };
}

export function useIsAdmin(): boolean {
  return useCan('*');
}

export function Can({
  permission,
  fallback,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}): ReactNode {
  const allowed = useCan(permission);
  if (!allowed) return createElement(Fragment, null, fallback ?? null);
  return createElement(Fragment, null, children);
}

// ── Store-backed isAdmin (replaces role-param version) ──────────────────────

export function isAdmin(): boolean {
  return can('*');
}
