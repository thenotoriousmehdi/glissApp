import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/Layout/adminLayout";
import { Spinner } from "./components/ui/spinner";
import { AuthProvider } from "./contexts/AuthProvider";
import { useAuth } from "./contexts/AuthContext";
import { getDefaultRouteForRole } from "./lib/utils";
import Dashboard from "./pages/Dashboard";
import Rendement from "./pages/Rendement";
import Rotation from "./pages/Rotation";
import AddContact from "./pages/AddContact";
import Contacts from "./pages/Contacts";
import DashboardAdmin from "./pages/DashboardAdmin";
import { useNavigate } from "react-router-dom";
import type { User } from "./types/auth";

const Login = lazy(() => import("./pages/Login"));

function AppContent() {
  const { user, loading, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogin = (user: User) => {
    navigate(getDefaultRouteForRole(user.role), { replace: true });
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
              <Navigate to={getDefaultRouteForRole(user.role)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={handleLogin} />
            )
          }
        />



        <Route
          path="/dashboard-admin"
          element={
            user && (user.role === "admin") ? (
              <AdminLayout
                user={user}
                onLogout={handleLogout}
                pageTitle="Tableau de bord"
              >
                <DashboardAdmin />
              </AdminLayout>
            ) : (
              <Navigate to={getDefaultRouteForRole(user?.role)} replace />
            )
          }
        />
        

        <Route
          path="/contacts"
          element={
            user && (user.role === "admin") ? (
              <AdminLayout
                user={user}
                onLogout={handleLogout}
                pageTitle="Contacts"
              >
                <Contacts />
              </AdminLayout>
            ) : (
              <Navigate to={getDefaultRouteForRole(user?.role)} replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            user && (user.role === "chef") ? (
              <AdminLayout
                user={user}
                onLogout={handleLogout}
                pageTitle="Tableau de bord"
              >
                <Dashboard />
              </AdminLayout>
            ) : (
              <Navigate to={getDefaultRouteForRole(user?.role)} replace />
            )
          }
        />


        <Route
          path="/rendement"
          element={
            user && (user.role === "chef") ? (
              <AdminLayout
                user={user}
                onLogout={handleLogout}
                pageTitle="Rendement"
              >
                <Rendement />
              </AdminLayout>
            ) : (
              <Navigate to={getDefaultRouteForRole(user?.role)} replace />
            )
          }
        />


        <Route
          path="/rotation"
          element={
            user && (user.role === "chef") ? (
              <AdminLayout
                user={user}
                onLogout={handleLogout}
                pageTitle="Rotation"
              >
                <Rotation />
              </AdminLayout>
            ) : (
              <Navigate to={getDefaultRouteForRole(user?.role)} replace />
            )
          }
        />


        <Route
          path="/addcontacts"
          element={
            user && (user.role === "animator") ? (
              <AdminLayout
                user={user}
                onLogout={handleLogout}
                pageTitle="Ajouter un contact"
              >
                <AddContact />
              </AdminLayout>
            ) : (
               <Navigate to={getDefaultRouteForRole(user?.role)} replace />
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
