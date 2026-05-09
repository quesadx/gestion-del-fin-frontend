import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import type { Role } from '@/features/auth/types/auth.types';

interface ProtectedRouteProps {
  requiredRoles?: Role[];
}

export function ProtectedRoute({ requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && (!role || !requiredRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
