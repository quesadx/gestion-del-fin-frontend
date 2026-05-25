import { useMemo } from 'react';
import {
  LayoutGrid,
  Building2,
  Users,
  Backpack,
  Warehouse,
  Compass,
  ClipboardCheck,
  Shield,
  Wrench,
  ArrowRightLeft,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
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
    roles: ['system_admin', 'resource_manager', 'worker', 'travel_coordinator'],
  },
  {
    label: 'Camps',
    to: '/camps',
    icon: Building2,
    roles: ['system_admin'],
  },
  {
    label: 'People',
    to: '/people',
    icon: Users,
    roles: ['system_admin'],
  },
  {
    label: 'Resources',
    to: '/resources',
    icon: Backpack,
    roles: ['resource_manager'],
  },
  {
    label: 'Inventory',
    to: '/inventory',
    icon: Warehouse,
    roles: ['resource_manager', 'worker'],
  },
  {
    label: 'Explorations',
    to: '/explorations',
    icon: Compass,
    roles: ['system_admin', 'travel_coordinator'],
  },
  {
    label: 'Admissions',
    to: '/admissions',
    icon: ClipboardCheck,
    roles: ['system_admin'],
  },
  {
    label: 'Users',
    to: '/users',
    icon: Shield,
    roles: ['system_admin'],
  },
  {
    label: 'Professions',
    to: '/professions',
    icon: Wrench,
    roles: ['system_admin'],
  },
  {
    label: 'Transfers',
    to: '/transfers',
    icon: ArrowRightLeft,
    roles: ['system_admin', 'resource_manager', 'travel_coordinator'],
  },
  {
    label: 'Rations',
    to: '/rations',
    icon: Utensils,
    roles: ['system_admin', 'resource_manager', 'worker'],
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
