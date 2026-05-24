import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { canAccess, ROLE_LANDING } from '@/shared/lib/roleGuards';
import { HoloLoader } from '@/components/tactical/HoloLoader';
import { LockScreen } from '@/components/LockScreen';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const isLocked = useAuthStore((state) => state.isLocked);
  const role = useAuthStore((state) => state.role);
  const location = useLocation();

  if (isInitializing) {
    return <HoloLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLocked) {
    return <LockScreen />;
  }

  const path = location.pathname;

  if (!canAccess(role, path)) {
    const landing = role ? (ROLE_LANDING[role] ?? '/dashboard') : '/login';

    return <Navigate to={landing} replace />;
  }

  return <Outlet />;
}
