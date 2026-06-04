import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/auth/loginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LotsPage from './pages/lots/LostPage'
import LotDetailPage from './pages/lots/LotDetailPage'
import MovementsPage from './pages/movements/MovementsPage'
import AuditPage from './pages/audit/AuditPage'
import Layout from './components/layout/Layout'

const queryClient = new QueryClient()

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="lots" element={<LotsPage />} />
            <Route path="lots/:id" element={<LotDetailPage />} />
            <Route path="movements" element={<MovementsPage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App