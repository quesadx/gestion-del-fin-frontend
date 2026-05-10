import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canAccess } from '@/shared/lib/roleGuards';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import type { Role } from '@/features/auth/types/auth.types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const role = useAuthStore((state) => state.role);
  const location = useLocation();

  if (isInitializing) {
    return <ScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (allowedRoles && allowedRoles.length > 0 && role) {
    const path = location.pathname;
    if (!canAccess(role, path)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
