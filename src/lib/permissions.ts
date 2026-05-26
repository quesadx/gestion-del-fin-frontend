import { useDeniedPermissionsStore } from '../store/deniedPermissions';
import { useAuthStore } from '../store/auth';

function matchPermission(permissions: string[] | null | undefined, permission: string): boolean {
  if (!permissions || permissions.length === 0) return false;

  for (const p of permissions) {
    if (p === '*') return true;
    if (p === permission) return true;

    if (p.endsWith('.*')) {
      const ns = p.slice(0, -2);
      if (permission === ns || permission.startsWith(`${ns}.`)) return true;
    }

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
  const denied = useDeniedPermissionsStore.getState().denied;
  if (denied.has(permission)) return false;
  return matchPermission(permissions, permission);
}

export function canAccessCamp(campId: number): boolean {
  const { isAdmin, user } = useAuthStore.getState();
  if (isAdmin) return true;
  return campId === user?.camp_id;
}
