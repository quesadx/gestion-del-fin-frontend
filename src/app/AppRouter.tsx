import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages - Auth
import { LoginPage } from "@/features/auth/pages/LoginPage";

// Pages - Dashboard
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

// Pages - People
import { PeopleListPage } from "@/features/people/pages/PeopleListPage";

// Pages - Inventory
import { InventoryPage } from "@/features/inventory/pages/InventoryPage";

// Pages - Explorations
import { ExplorationsPage } from "@/features/explorations/pages/ExplorationsPage";

// Pages - Transfers
import { TransfersPage } from "@/features/inventory/pages/TransfersPage";

// Guards
import { PrivateRoute } from "@/shared/guards/PrivateRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />

        {/* PRIVATE ROUTES - Protected by JWT */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/people" element={<PeopleListPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/explorations" element={<ExplorationsPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
        </Route>

        {/* CATCH-ALL - Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
