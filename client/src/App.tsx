import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { ControlTower } from "./pages/ControlTower";
import { StoreDrilldown } from "./pages/StoreDrilldown";
import { CategoryDrilldown } from "./pages/CategoryDrilldown";
import { ProductDrilldown } from "./pages/ProductDrilldown";
import { CommercialCommandCenter } from "./pages/CommercialCommandCenter";
import { AskAi } from "./pages/AskAi";
import { RedFlags } from "./pages/RedFlags";
import { Actions } from "./pages/Actions";
import { ReportBuilder } from "./pages/ReportBuilder";
import { DataControlCenter } from "./pages/DataControlCenter";
import { AuditTrail } from "./pages/AuditTrail";
import { More } from "./pages/More";
import { LoadingState } from "./components/shared";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingState />;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<ControlTower />} />
        <Route path="/store/:storeId" element={<StoreDrilldown />} />
        <Route path="/category/:categoryId" element={<CategoryDrilldown />} />
        <Route path="/product/:productId" element={<ProductDrilldown />} />
        <Route path="/commercial" element={<CommercialCommandCenter />} />
        <Route path="/ask-ai" element={<AskAi />} />
        <Route path="/red-flags" element={<RedFlags />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/reports" element={<ReportBuilder />} />
        <Route path="/data-control-center" element={<DataControlCenter />} />
        <Route path="/audit" element={<AuditTrail />} />
        <Route path="/more" element={<More />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
