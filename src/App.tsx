import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import { usePermissions } from './hooks/usePermissions'
import { getCurrentSession } from './api/auth'
import { ScrollToTop } from './components/ScrollToTop'
import Layout from './components/layout/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'

const LoginPage       = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage    = lazy(() => import('./pages/auth/RegisterPage'))
const DashboardPage   = lazy(() => import('./pages/dashboard/DashboardPage'))
const LotsPage        = lazy(() => import('./pages/lots/LotsPage'))
const LotDetailPage   = lazy(() => import('./pages/lots/LotDetailPage'))
const MovementsPage   = lazy(() => import('./pages/movements/MovementsPage'))
const AuditPage       = lazy(() => import('./pages/audit/AuditPage'))
const InspectionsPage = lazy(() => import('./pages/inspections/InspectionsPage'))
const InspectionDetailPage = lazy(() => import('./pages/inspections/InspectionDetailPage'))
const InventoryPage   = lazy(() => import('./pages/inventory/InventoryPage'))
const UsersPage       = lazy(() => import('./pages/users/UsersPage'))
const ProfilePage     = lazy(() => import('./pages/profile/ProfilePage'))
const ReportsPage     = lazy(() => import('./pages/reports/ReportsPage'))
const PlansPage             = lazy(() => import('./pages/admin/PlansPage'))
const OrganizationsPage     = lazy(() => import('./pages/admin/OrganizationsPage'))
const GlobalUsersPage       = lazy(() => import('./pages/admin/GlobalUsersPage'))
const RolesPage             = lazy(() => import('./pages/roles/RolesPage'))
const PlanPage              = lazy(() => import('./pages/billing/PlanPage'))
const PublicLotPage   = lazy(() => import('./pages/public/PublicLotPage'))
const NotFoundPage    = lazy(() => import('./pages/NotFoundPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
})

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-64">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin } = useAuth()
  return isSuperAdmin ? <>{children}</> : <Navigate to="/dashboard" />
}

const PermissionRoute = ({ permission, children }: { permission: string; children: React.ReactNode }) => {
  const { can } = usePermissions()
  return can(permission) ? <>{children}</> : <Navigate to="/dashboard" />
}

function App() {
  const { token, isAuthenticated, setAuth, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !token) return

    getCurrentSession()
      .then((session) => {
        setAuth(session.user, session.token, session.organization, session.permissions)
      })
      .catch(() => {
        logout()
      })
  }, [isAuthenticated, setAuth, logout])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <ScrollToTop />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/public/:qrCode" element={<PublicLotPage />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard"   element={<DashboardPage />} />
                <Route path="lots"        element={<LotsPage />} />
                <Route path="lots/:id"    element={<LotDetailPage />} />
                <Route path="movements"   element={<MovementsPage />} />
                <Route path="audit"       element={<AuditPage />} />
                <Route path="inspections" element={<InspectionsPage />} />
                <Route path="inspections/:id" element={
                  <PermissionRoute permission="inspections:read">
                    <InspectionDetailPage />
                  </PermissionRoute>
                } />
                <Route path="inventory" element={
                  <PermissionRoute permission="inventory:read">
                    <InventoryPage />
                  </PermissionRoute>
                } />
                <Route path="profile"     element={<ProfilePage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="users" element={
                  <PermissionRoute permission="users:manage">
                    <UsersPage />
                  </PermissionRoute>
                } />
                <Route path="roles" element={<Navigate to="/admin/roles" />} />
                <Route path="billing" element={
                  <PermissionRoute permission="users:manage">
                    <PlanPage />
                  </PermissionRoute>
                } />
                {/* Admin — solo super admin */}
                <Route path="admin/roles" element={
                  <SuperAdminRoute><RolesPage /></SuperAdminRoute>
                } />
                <Route path="admin/plans" element={
                  <SuperAdminRoute><PlansPage /></SuperAdminRoute>
                } />
                <Route path="admin/organizations" element={
                  <SuperAdminRoute><OrganizationsPage /></SuperAdminRoute>
                } />
                <Route path="admin/users" element={
                  <SuperAdminRoute><GlobalUsersPage /></SuperAdminRoute>
                } />
                <Route path="admin/usuarios" element={<Navigate to="/admin/users" />} />
                <Route path="admin/organizaciones" element={<Navigate to="/admin/organizations" />} />
                <Route path="admin/planes" element={<Navigate to="/admin/plans" />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
