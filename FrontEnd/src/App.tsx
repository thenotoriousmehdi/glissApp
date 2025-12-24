import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/Layout/adminLayout";
import { Spinner } from "./components/ui/spinner";
import { AuthProvider } from "./contexts/AuthProvider";
import { useAuth } from "./contexts/AuthContext";

import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import Merchs from "./pages/Merchs";
import Clients from "./pages/Clients";
import Missions from "./pages/Missions";
import Routess from "./pages/Routess";
import Map from "./pages/Map";
import Reclamations from "./pages/Reclamations";

const Login = lazy(() => import("./pages/Login"));

function AppContent() {
  const { user, loading, logout } = useAuth();

  const handleLogin = () => {
    window.location.href = "/dashboard";
  };
  
  const handleLogout = async () => {
    console.log("👋 Logout");
    await logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner className="size-8" />
        </div>
      }
    >
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLoginSuccess={handleLogin} />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Tableau de bord">
                  <Dashboard />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/devices"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Appareils">
                  <Devices />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/reports"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Rapports">
                  <Reports />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/products"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Produits">
                  <Products />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/merchs"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Marchandiseurs">
                  <Merchs />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/clients"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Clients">
                  <Clients />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/missions"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Missions">
                  <Missions />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/routess"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Routes">
                  <Routess />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/map"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Map">
                  <Map />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/reclamations"
            element={
              user ? (
                <AdminLayout user={user} onLogout={handleLogout} pageTitle="Réclamations">
                  <Reclamations />
                </AdminLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}