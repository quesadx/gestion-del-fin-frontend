import type { Role } from '@/features/auth/types/auth.types';

export const ROLE_ACCESS: Record<string, Role[]> = {
  '/dashboard': ['system_admin', 'resource_manager'],
  '/people': ['system_admin'],
  '/people/new': ['system_admin'],
  '/people/:id': ['system_admin'],
  '/resources': ['resource_manager', 'worker'],
  '/resources/mine': ['worker'],
  '/explorations': ['travel_lead'],
  '/transfers': ['resource_manager', 'travel_lead'],
  '/camps': ['system_admin'],
};

const PARAM_SEGMENT = /:[^/]+/g;

function toPatternRegex(pattern: string) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withParams = escaped.replace(PARAM_SEGMENT, '[^/]+');
  return new RegExp(`^${withParams}$`);
}

export function canAccess(role: Role, path: string): boolean {
  const entry = Object.entries(ROLE_ACCESS).find(([pattern]) => toPatternRegex(pattern).test(path));

  if (!entry) {
    return false;
  }

  return entry[1].includes(role);
}
