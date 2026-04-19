import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { PeopleListPage } from "@/features/people/pages/PeopleListPage";
import { InventoryPage } from "@/features/inventory/pages/InventoryPage";
import { ExplorationsPage } from "@/features/explorations/pages/ExplorationsPage";
import { TransfersPage } from "@/features/inventory/pages/TransfersPage";

import { PrivateRoute } from "@/shared/guards/PrivateRoute";
import { PrivateLayout } from "@/shared/ui/layout/PrivateLayout";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/people" element={<PeopleListPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/explorations" element={<ExplorationsPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
