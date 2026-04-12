import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";

/**
 * PrivateRoute Guard Component
 *
 * Protects routes that require authentication (JWT token).
 * If no token is present, redirects to /login.
 * If token exists, renders the nested route via <Outlet />.
 *
 * Usage in AppRouter:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export function PrivateRoute() {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
