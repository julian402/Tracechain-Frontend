import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import { ScrollToTop } from './components/ScrollToTop'
import Layout from './components/layout/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'

const LoginPage       = lazy(() => import('./pages/auth/LoginPage'))
const DashboardPage   = lazy(() => import('./pages/dashboard/DashboardPage'))
const LotsPage        = lazy(() => import('./pages/lots/LotsPage'))
const LotDetailPage   = lazy(() => import('./pages/lots/LotDetailPage'))
const MovementsPage   = lazy(() => import('./pages/movements/MovementsPage'))
const AuditPage       = lazy(() => import('./pages/audit/AuditPage'))
const InspectionsPage = lazy(() => import('./pages/inspections/InspectionsPage'))
const UsersPage       = lazy(() => import('./pages/users/UsersPage'))
const ProfilePage     = lazy(() => import('./pages/profile/ProfilePage'))
const ReportsPage     = lazy(() => import('./pages/reports/ReportsPage'))
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
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/dashboard" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <ScrollToTop />
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
              <Route path="profile"     element={<ProfilePage />} />
              <Route path="reports"     element={<ReportsPage />} />
              <Route path="users" element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              } />
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
