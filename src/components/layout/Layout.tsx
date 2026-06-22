import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { getRoleColor } from '../../lib/constants'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const DashboardIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const LotsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)
const MovementsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)
const AuditIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)
const InspectionsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)
const ReportsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const InventoryIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
)
const UsersIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const PlansIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)
const OrgsIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const GlobalUsersIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const RolesIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)
const BillingIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

export default function Layout() {
  const { user, organization, isSuperAdmin, logout } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)

  const orgNavItems: NavItem[] = [
    { label: 'Dashboard',    path: '/dashboard',    icon: <DashboardIcon /> },
    ...(can('lots:read')         ? [{ label: 'Lotes',        path: '/lots',        icon: <LotsIcon /> }]        : []),
    ...(can('inventory:read')    ? [{ label: 'Inventario',   path: '/inventory',   icon: <InventoryIcon /> }]   : []),
    ...(can('movements:read')    ? [{ label: 'Movimientos',  path: '/movements',   icon: <MovementsIcon /> }]   : []),
    ...(can('audit:read')        ? [{ label: 'Auditoría',    path: '/audit',       icon: <AuditIcon /> }]       : []),
    ...(can('inspections:read')  ? [{ label: 'Inspecciones', path: '/inspections', icon: <InspectionsIcon /> }] : []),
    ...(can('reports:read') || can('analytics:read') ? [{ label: 'Analítica', path: '/reports', icon: <ReportsIcon /> }] : []),
    ...(can('users:manage')      ? [{ label: 'Usuarios',     path: '/users',       icon: <UsersIcon /> }]       : []),
    ...(can('users:manage') && !isSuperAdmin ? [{ label: 'Mi organización', path: '/billing', icon: <BillingIcon /> }] : []),
  ]

  const platformNavItems: NavItem[] = isSuperAdmin ? [
    { label: 'Organizaciones', path: '/admin/organizations', icon: <OrgsIcon /> },
    { label: 'Usuarios',       path: '/admin/users',         icon: <GlobalUsersIcon /> },
    { label: 'Roles',          path: '/admin/roles',         icon: <RolesIcon /> },
    { label: 'Planes',         path: '/admin/plans',         icon: <PlansIcon /> },
  ] : []

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const logoIcon = (
    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
  )

  const navLink = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      title={collapsed ? item.label : undefined}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) => [
        'flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        collapsed ? 'md:justify-center md:px-0 px-3' : 'px-3',
        isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      ].join(' ')}
    >
      {item.icon}
      <span className={[
        'whitespace-nowrap overflow-hidden transition-all duration-300',
        collapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[160px] opacity-100',
      ].join(' ')}>
        {item.label}
      </span>
    </NavLink>
  )

  const roleName = isSuperAdmin ? 'Super Admin' : (user?.role?.name ?? '')

  return (
    <div className="flex h-screen bg-gray-50">

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed md:relative inset-y-0 left-0 z-40 md:z-auto',
          'flex flex-col bg-white border-r border-gray-200',
          'transition-all duration-300 ease-in-out',
          'w-64',
          collapsed ? 'md:w-16' : 'md:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Botón colapsar — solo desktop */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center hover:bg-green-50 hover:border-green-400 transition-colors"
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <svg
            className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Logo */}
        <div className="h-16 border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
          {logoIcon}
          <div className={[
            'overflow-hidden transition-all duration-300',
            collapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[160px] opacity-100',
          ].join(' ')}>
            <span className="font-bold text-gray-900 whitespace-nowrap block">TraceChain</span>
            {organization && (
              <span className="text-xs text-gray-400 whitespace-nowrap truncate block max-w-[140px]">{organization.name}</span>
            )}
          </div>
          <button
            className="md:hidden ml-auto p-1 text-gray-400 hover:text-gray-600"
            onClick={() => setMobileOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {/* Sección Admin — solo super admin, aparece primero */}
          {platformNavItems.length > 0 && (
            <>
              <div className={['pb-1', collapsed ? 'md:hidden' : ''].join(' ')}>
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</p>
              </div>
              {collapsed && <div className="border-t border-gray-100 my-2" />}
              {platformNavItems.map(navLink)}
              <div className="border-t border-gray-100 my-2" />
            </>
          )}

          {/* Sección Organización */}
          {orgNavItems.length > 0 && (
            <>
              {platformNavItems.length > 0 && (
                <div className={['pb-1', collapsed ? 'md:hidden' : ''].join(' ')}>
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Organización</p>
                </div>
              )}
              {orgNavItems.map(navLink)}
            </>
          )}
        </nav>

        {/* Usuario + logout */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <NavLink
            to="/profile"
            title={collapsed ? (user?.name ?? 'Perfil') : undefined}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => [
              'flex items-center gap-3 mb-1 px-2 py-1.5 rounded-lg transition-colors',
              collapsed ? 'md:justify-center md:px-0' : '',
              isActive ? 'bg-green-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-gray-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={[
              'overflow-hidden whitespace-nowrap transition-all duration-300 min-w-0',
              collapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[160px] opacity-100',
            ].join(' ')}>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              {roleName && (
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getRoleColor(roleName)}`}>
                  {roleName}
                </span>
              )}
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={[
              'w-full flex items-center gap-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors',
              collapsed ? 'md:justify-center md:px-0 px-3' : 'px-3',
            ].join(' ')}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={[
              'whitespace-nowrap overflow-hidden transition-all duration-300',
              collapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[160px] opacity-100',
            ].join(' ')}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar móvil */}
        <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {logoIcon}
          <span className="font-bold text-gray-900">TraceChain</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
