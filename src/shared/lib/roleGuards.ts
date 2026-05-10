import type { Role } from '@/features/auth/types/auth.types';

export const ROLE_ACCESS: Record<string, Role[]> = {
  '/dashboard': ['system_admin', 'resource_manager'],
  '/camps': ['system_admin'],
  '/camps/:id': ['system_admin'],
  '/people': ['system_admin'],
  '/people/new': ['system_admin'],
  '/people/:id': ['system_admin'],
  '/resources': ['resource_manager'],
  '/inventory': ['resource_manager', 'worker'],
  '/inventory/audit': ['resource_manager'],
  '/explorations': ['system_admin', 'travel_coordinator'],
  '/admissions': ['system_admin'],
  '/users': ['system_admin'],
  '/professions': ['system_admin'],
  '/transfers': ['system_admin', 'resource_manager', 'travel_coordinator'],
};

export function canAccess(role: Role, path: string): boolean {
  const allowed = ROLE_ACCESS[path];

  if (!allowed) {
    return false;
  }

  return allowed.includes(role);
}
