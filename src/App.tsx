import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCampStore } from './store';
import { ReactNode, Suspense, lazy, useEffect } from 'react';
import { can, PERM } from './lib/permissions';

const PAGE_TITLES: Record<string, string> = {
  '/login': 'Login',
  '/dashboard': 'Dashboard',
  '/population': 'Population',
  '/population/new': 'New Person',
  '/inventory': 'Inventory',
  '/inventory/audit': 'Audit Trail',
  '/admission': 'Admissions',
  '/expeditions': 'Expeditions',
  '/transfers': 'Transfers',
  '/camps': 'Refuges',
  '/resources': 'Resources',
  '/rations': 'Rations',
  '/professions': 'Professions',
  '/users': 'Users',
  '/roles': 'Roles',
  '/permissions': 'Permissions',
};
import { Skeleton } from './components/Skeleton';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/Toaster';
import AppBackground from './components/backgrounds/AppBackground';

// Layouts (lazy)
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));

// Pages (lazy)
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const DashboardOverview = lazy(() => import('./features/dashboard/DashboardOverview'));
const PopulationRoster = lazy(() => import('./features/people/PopulationRoster'));
const PersonDetail = lazy(() => import('./features/people/PersonDetail'));
const NewPersonPage = lazy(() => import('./features/people/NewPersonPage'));
const InventoryList = lazy(() => import('./features/inventory/InventoryList'));
const InventoryAudit = lazy(() => import('./features/inventory/InventoryAudit'));
const AdmissionList = lazy(() => import('./features/admission/AdmissionList'));
const ExpeditionList = lazy(() => import('./features/explorations/ExpeditionList'));
const ExpeditionDetail = lazy(() => import('./features/explorations/ExpeditionDetail'));
const CampManagement = lazy(() => import('./features/camps/CampManagement'));
const CampDetail = lazy(() => import('./features/camps/CampDetail'));
const TransferList = lazy(() => import('./features/transfers/TransferList'));
const ResourcesPage = lazy(() => import('./features/resources/ResourcesPage'));
const RationsPage = lazy(() => import('./features/rations/RationsPage'));
const ProfessionsPage = lazy(() => import('./features/professions/ProfessionsPage'));
const UsersPage = lazy(() => import('./features/users/UsersPage'));
const RolesPage = lazy(() => import('./features/roles/RolesPage'));
const PermissionsPage = lazy(() => import('./features/permissions/PermissionsPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="space-y-8 w-full max-w-md px-8">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-4 space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const axiosError = error as { response?: unknown } | null;
        if (!axiosError?.response) return false;
        return failureCount < 1;
      },
    },
  },
});

const ProtectedRoute = ({ children, permission }: { children: ReactNode; permission?: string }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const InventoryAuditRoute = () => {
  const currentCampId = useCampStore((s) => s.currentCampId);
  return <InventoryAudit key={currentCampId} />;
};

function TitleManager() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    const match = Object.entries(PAGE_TITLES).find(
      ([key]) => key === path || (key.endsWith('/') && path.startsWith(key)),
    );
    const page = match ? match[1] : '';
    document.title = page ? `${page} · GESTION DEL FIN` : 'GESTION DEL FIN';
  }, [location]);
  return null;
}

export default function App() {
  const { logout } = useAuthStore();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          logout();
          localStorage.setItem('session_expired', 'true');
        },
        20 * 60 * 1000,
      );
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(timeout);
    };
  }, [logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TitleManager />
        <div className="relative isolate min-h-screen bg-surface-base">
          <AppBackground />
          <div className="relative z-10">
            <Toaster />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                  </Route>

                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      index
                      element={
                        <ProtectedRoute permission={PERM.DASHBOARD_READ}>
                          <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="dashboard"
                      element={
                        <ProtectedRoute permission={PERM.DASHBOARD_READ}>
                          <DashboardOverview />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="population"
                      element={
                        <ProtectedRoute permission={PERM.PEOPLE_READ}>
                          <PopulationRoster />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="population/new"
                      element={
                        <ProtectedRoute permission={PERM.PEOPLE_CREATE}>
                          <NewPersonPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="population/:id"
                      element={
                        <ProtectedRoute permission={PERM.PEOPLE_READ}>
                          <PersonDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="inventory"
                      element={
                        <ProtectedRoute permission={PERM.INVENTORY_READ}>
                          <InventoryList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="inventory/audit"
                      element={
                        <ProtectedRoute permission={PERM.INVENTORY_AUDIT}>
                          <InventoryAuditRoute />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="admission"
                      element={
                        <ProtectedRoute permission={PERM.ADMISSION_READ}>
                          <AdmissionList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="expeditions/:id"
                      element={
                        <ProtectedRoute permission={PERM.EXPEDITIONS_READ}>
                          <ExpeditionDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="expeditions"
                      element={
                        <ProtectedRoute permission={PERM.EXPEDITIONS_READ}>
                          <ExpeditionList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="transfers"
                      element={
                        <ProtectedRoute permission={PERM.TRANSFERS_READ}>
                          <TransferList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="camps/:id"
                      element={
                        <ProtectedRoute permission={PERM.CAMPS_READ}>
                          <CampDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="camps"
                      element={
                        <ProtectedRoute permission={PERM.CAMPS_READ}>
                          <CampManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="resources"
                      element={
                        <ProtectedRoute permission={PERM.RESOURCES_ALL}>
                          <ResourcesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="rations"
                      element={
                        <ProtectedRoute permission={PERM.INVENTORY_READ}>
                          <RationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="professions"
                      element={
                        <ProtectedRoute permission={PERM.PROFESSIONS_READ}>
                          <ProfessionsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="users"
                      element={
                        <ProtectedRoute permission={PERM.USERS_READ}>
                          <UsersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="roles"
                      element={
                        <ProtectedRoute permission={PERM.ROLES_READ}>
                          <RolesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="permissions"
                      element={
                        <ProtectedRoute permission={PERM.PERMISSIONS_READ}>
                          <PermissionsPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
