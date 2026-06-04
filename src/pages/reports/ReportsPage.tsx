import { useAuth } from '../../hooks/useAuth'
import { env } from '../../env'

export default function ReportsPage() {
  const { organization, isSuperAdmin } = useAuth()
  const analyticsEnabled = isSuperAdmin || (organization?.plan?.features as Record<string, boolean>)?.analytics === true

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analítica</h1>
        <p className="text-sm text-gray-500 mt-0.5">Dashboards interactivos conectados con Apache Superset</p>
      </div>

      {!analyticsEnabled ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Analítica avanzada</p>
          <p className="text-xs text-gray-500">Los dashboards de Apache Superset están disponibles para organizaciones con analítica activa.</p>
        </div>
      ) : !env.supersetDashboardUrl ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-amber-800 mb-1">Superset no configurado</p>
          <p className="text-xs text-amber-700">
            Define <code className="bg-amber-100 px-1 rounded">VITE_SUPERSET_DASHBOARD_URL</code> en el `.env` del frontend.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-[72vh] min-h-[520px]">
          <iframe
            src={env.supersetDashboardUrl}
            title="Apache Superset dashboard"
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}
