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
  '/explorations/:id': ['system_admin', 'travel_coordinator'],
  '/admissions': ['system_admin'],
  '/users': ['system_admin'],
  '/professions': ['system_admin'],
  '/transfers': ['system_admin', 'resource_manager', 'travel_coordinator'],
  '/rations': ['system_admin', 'resource_manager'],
};

export const ROLE_LANDING: Record<string, string> = {
  system_admin: '/dashboard',
  resource_manager: '/dashboard',
  worker: '/inventory',
  travel_coordinator: '/explorations',
};

function buildRouteRegexes(): Array<{ regex: RegExp; roles: Role[] }> {
  const entries = Object.entries(ROLE_ACCESS);

  return entries.map(([pattern, roles]) => {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withParams = escaped.replace(/:id/g, '\\d+');
    const regex = new RegExp('^' + withParams + '$');

    return { regex, roles };
  });
}

const ROUTE_REGEXES = buildRouteRegexes();

export function canAccess(role: Role | null, path: string): boolean {
  if (!role) {
    return false;
  }

  for (const { regex, roles } of ROUTE_REGEXES) {
    if (regex.test(path) && roles.includes(role)) {
      return true;
    }
  }

  return false;
}
