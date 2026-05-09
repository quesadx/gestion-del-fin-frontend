import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AppShell } from '@/layouts/AppShell';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { navigationRef } from '@/shared/api/axiosInstance';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);

const CampsPage = lazy(() =>
  import('@/features/camps/pages/CampsPage').then((m) => ({ default: m.CampsPage })),
);

const CampDetailPage = lazy(() =>
  import('@/features/camps/pages/CampDetailPage').then((m) => ({ default: m.CampDetailPage })),
);

const PeopleListPage = lazy(() =>
  import('@/features/people/pages/PeopleListPage').then((m) => ({ default: m.PeopleListPage })),
);

const PersonDetailPage = lazy(() =>
  import('@/features/people/pages/PersonDetailPage').then((m) => ({ default: m.PersonDetailPage })),
);

const PersonCreatePage = lazy(() =>
  import('@/features/people/pages/PersonCreatePage').then((m) => ({ default: m.PersonCreatePage })),
);

const InventoryPage = lazy(() =>
  import('@/features/inventory/pages/InventoryPage').then((m) => ({ default: m.InventoryPage })),
);

const InventoryAuditPage = lazy(() =>
  import('@/features/inventory/pages/InventoryAuditPage').then((m) => ({ default: m.InventoryAuditPage })),
);

const ResourcesPage = lazy(() =>
  import('@/features/inventory/pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })),
);

const ExplorationsPage = lazy(() =>
  import('@/features/explorations/pages/ExplorationsPage').then((m) => ({ default: m.ExplorationsPage })),
);

const AdmissionsPage = lazy(() =>
  import('@/features/admission/pages/AdmissionsPage').then((m) => ({ default: m.AdmissionsPage })),
);

const UsersPage = lazy(() =>
  import('@/features/users/pages/UsersPage').then((m) => ({ default: m.UsersPage })),
);

const ProfessionsPage = lazy(() =>
  import('@/features/professions/pages/ProfessionsPage').then((m) => ({ default: m.ProfessionsPage })),
);

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[40vh]">
      <ScreenLoader />
    </div>
  );
}

function NavigationBinder() {
  const navigate = useNavigate();

  useEffect(() => {
    navigationRef.current = navigate;
    return () => {
      navigationRef.current = null;
    };
  }, [navigate]);

  return null;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <NavigationBinder />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Routes that require auth only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            {/* System admin routes */}
            <Route
              path="/camps"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <CampsPage />
                </Suspense>
              }
            />
            <Route
              path="/camps/:id"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <CampDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/people"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <PeopleListPage />
                </Suspense>
              }
            />
            <Route
              path="/people/new"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <PersonCreatePage />
                </Suspense>
              }
            />
            <Route
              path="/people/:id"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <PersonDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/resources"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <ResourcesPage />
                </Suspense>
              }
            />
            <Route
              path="/inventory"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <InventoryPage />
                </Suspense>
              }
            />
            <Route
              path="/inventory/audit"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <InventoryAuditPage />
                </Suspense>
              }
            />
            <Route
              path="/explorations"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <ExplorationsPage />
                </Suspense>
              }
            />
            <Route
              path="/admissions"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <AdmissionsPage />
                </Suspense>
              }
            />
            <Route
              path="/users"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <UsersPage />
                </Suspense>
              }
            />
            <Route
              path="/professions"
              element={
                <Suspense fallback={<LazyFallback />}>
                  <ProfessionsPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
