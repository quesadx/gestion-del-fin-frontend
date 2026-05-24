import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store";
import { ReactNode, useEffect } from "react";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import LoginPage from "./features/auth/LoginPage";
import DashboardOverview from "./features/dashboard/DashboardOverview";
import PopulationRoster from "./features/people/PopulationRoster";
import InventoryList from "./features/inventory/InventoryList";
import AdmissionList from "./features/admission/AdmissionList";
import ExpeditionList from "./features/explorations/ExpeditionList";
import CampManagement from "./features/camps/CampManagement";
import TransferList from "./features/transfers/TransferList";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Never retry network-level failures (server unreachable / ERR_CONNECTION_REFUSED).
      // Retry other transient errors (e.g. 5xx) once.
      retry: (failureCount, error: unknown) => {
        const axiosError = error as { response?: unknown } | null;
        if (!axiosError?.response) return false; // no response = network error
        return failureCount < 1;
      },
    },
  },
});

const ProtectedRoute = ({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: string[];
}) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  const { logout } = useAuthStore();

  // Inactivity tracking (20 minutes)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => {
          logout();
          localStorage.setItem("session_expired", "true");
        },
        20 * 60 * 1000,
      );
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      clearTimeout(timeout);
    };
  }, [logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route
              path="population"
              element={
                <ProtectedRoute>
                  <PopulationRoster />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute>
                  <InventoryList />
                </ProtectedRoute>
              }
            />
            <Route
              path="admission"
              element={
                <ProtectedRoute>
                  <AdmissionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="expeditions"
              element={
                <ProtectedRoute>
                  <ExpeditionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="transfers"
              element={
                <ProtectedRoute>
                  <TransferList />
                </ProtectedRoute>
              }
            />
            <Route
              path="camps"
              element={
                <ProtectedRoute>
                  <CampManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
