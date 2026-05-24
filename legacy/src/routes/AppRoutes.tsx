import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AppShell } from '@/layouts/AppShell';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { HoloLoader } from '@/components/tactical/HoloLoader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  import('@/features/inventory/pages/InventoryAuditPage').then((m) => ({
    default: m.InventoryAuditPage,
  })),
);

const ResourcesPage = lazy(() =>
  import('@/features/resources/pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })),
);

const TransfersPage = lazy(() =>
  import('@/features/transfers/pages/TransfersPage').then((m) => ({ default: m.TransfersPage })),
);

const ExplorationsPage = lazy(() =>
  import('@/features/explorations/pages/ExplorationsPage').then((m) => ({
    default: m.ExplorationsPage,
  })),
);

const ExplorationDetailPage = lazy(() =>
  import('@/features/explorations/pages/ExplorationDetailPage').then((m) => ({
    default: m.ExplorationDetailPage,
  })),
);

const AdmissionsPage = lazy(() =>
  import('@/features/admission/pages/AdmissionsPage').then((m) => ({ default: m.AdmissionsPage })),
);

const UsersPage = lazy(() =>
  import('@/features/users/pages/UsersPage').then((m) => ({ default: m.UsersPage })),
);

const ProfessionsPage = lazy(() =>
  import('@/features/professions/pages/ProfessionsPage').then((m) => ({
    default: m.ProfessionsPage,
  })),
);

const RationsPage = lazy(() =>
  import('@/features/rations/pages/RationsPage').then((m) => ({ default: m.RationsPage })),
);

function LazyFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[40vh]">
      <HoloLoader />
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

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route
              path="/dashboard"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <DashboardPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/camps"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <CampsPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/camps/:id"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <CampDetailPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/people"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <PeopleListPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/people/new"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <PersonCreatePage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/people/:id"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <PersonDetailPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/resources"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <ResourcesPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/inventory"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <InventoryPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/inventory/audit"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <InventoryAuditPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/explorations"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <ExplorationsPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/explorations/:id"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <ExplorationDetailPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admissions"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <AdmissionsPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/users"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <UsersPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/professions"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <ProfessionsPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/transfers"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <TransfersPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/rations"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<LazyFallback />}>
                    <RationsPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
