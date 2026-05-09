import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AppShell } from '@/layouts/AppShell';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { ROLE_ACCESS } from '@/shared/lib/roleGuards';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);

export function AppRoutes() {
  const dashboardRoles = ROLE_ACCESS['/dashboard'];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route element={<ProtectedRoute requiredRoles={dashboardRoles} />}>
              <Route
                path="/dashboard"
                element={
                  <Suspense
                    fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}
                  >
                    <DashboardPage />
                  </Suspense>
                }
              />
            </Route>
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
