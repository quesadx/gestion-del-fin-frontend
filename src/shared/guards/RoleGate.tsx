import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { Role } from '@/features/auth/types/auth.types';

interface RoleGateProps {
  allow: Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ allow, fallback = null, children }: RoleGateProps) {
  const role = useAuthStore((state) => state.role);

  if (!role || !allow.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
