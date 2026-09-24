import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';

// ─── Eager-loaded pages (critical path — shown before auth check) ─────────────
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SearchProviders from './pages/SearchProviders';

// ─── Lazy-loaded pages (only downloaded when navigated to) ───────────────────
// This converts a 91KB monolith initial load into ~30KB
const ProviderDashboard  = lazy(() => import('./pages/ProviderDashboard'));
const UserDashboard      = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const ProviderProfile    = lazy(() => import('./pages/ProviderProfile'));
const ManageSchedule     = lazy(() => import('./pages/ManageSchedule'));
const ProviderAnalytics  = lazy(() => import('./pages/ProviderAnalytics'));
const StaffDashboard     = lazy(() => import('./pages/StaffDashboard'));
const Workspace          = lazy(() => import('./pages/Workspace'));
const InvoicesPage       = lazy(() => import('./pages/InvoicesPage'));
const MessagesPage       = lazy(() => import('./pages/MessagesPage'));

// ─── Route Guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen message="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to the correct dashboard based on role instead of home
      const roleRedirects = {
        admin: '/admin',
        expert: '/hub/dashboard',
        provider: '/hub/dashboard',
        company_owner: '/hub/dashboard',
        company_staff: '/staff/dashboard',
        user: '/dashboard',
      };
      return <Navigate to={roleRedirects[user.role] || '/'} replace />;
    }
  }

  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                success: {
                  style: {
                    background: '#dcfce7',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                  },
                },
                error: {
                  style: {
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                  },
                },
              }}
            />
            <Navbar />

            {/* Suspense fallback shown while lazy chunks download */}
            <Suspense fallback={<LoadingScreen message="Loading..." />}>
              <Routes>
                {/* ── Public routes ── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/search" element={<SearchProviders />} />
                <Route path="/hub/:id" element={<ProviderProfile />} />
                <Route path="/workspace" element={<Workspace />} />

                {/* ── Consumer routes ── */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute role="user">
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/invoices"
                  element={
                    <ProtectedRoute role="user">
                      <InvoicesPage />
                    </ProtectedRoute>
                  }
                />

                {/* ── Chat / Messages ── */}
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  }
                />

                {/* ── Provider / Expert routes ── */}
                <Route
                  path="/hub/dashboard"
                  element={
                    <ProtectedRoute role={['expert', 'company_owner', 'provider']}>
                      <ProviderDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hub/schedule"
                  element={
                    <ProtectedRoute role={['expert', 'company_owner', 'company_staff', 'provider']}>
                      <ManageSchedule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hub/analytics"
                  element={
                    <ProtectedRoute role={['expert', 'company_owner', 'company_staff', 'provider']}>
                      <ProviderAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hub/invoices"
                  element={
                    <ProtectedRoute role={['expert', 'company_owner', 'provider']}>
                      <InvoicesPage />
                    </ProtectedRoute>
                  }
                />

                {/* ── Staff routes ── */}
                <Route
                  path="/staff/dashboard"
                  element={
                    <ProtectedRoute role="company_staff">
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ── Admin routes ── */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ── Legacy redirects ── */}
                <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/admin/workspace" element={<Navigate to="/workspace" replace />} />
                <Route path="/expert/dashboard" element={<Navigate to="/hub/dashboard" replace />} />
                <Route path="/expert/dashboard/schedule" element={<Navigate to="/hub/schedule" replace />} />
                <Route path="/expert/*" element={<Navigate to="/hub/dashboard" replace />} />
                <Route path="/doctor/:id" element={<Navigate to="/hub/:id" replace />} />
                <Route path="/doctor/dashboard" element={<Navigate to="/hub/dashboard" replace />} />
                <Route path="/doctor/*" element={<Navigate to="/hub/dashboard" replace />} />

                {/* ── 404 fallback ── */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
