import { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/features/auth/types/auth.types';

export interface NavItem {
  label: string;
  to: string;
  icon?: LucideIcon;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutGrid,
    roles: ['system_admin', 'resource_manager', 'worker', 'travel_lead'],
  },
];

export function useNavItems(role: Role | null) {
  return useMemo(() => {
    if (!role) {
      return [];
    }

    return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
  }, [role]);
}
