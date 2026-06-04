import { useState } from 'react'
import { downloadLotsCSV, downloadLotsPDF, downloadMovementsCSV, downloadAuditCSV } from '../../api/reports'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../lib/toast'

const SUPERSET_URL = import.meta.env.VITE_SUPERSET_DASHBOARD_URL as string | undefined

interface ExportItem {
  label: string
  format: string
  fn: () => Promise<void>
}

const EXPORTS: ExportItem[] = [
  { label: 'Lotes', format: 'CSV', fn: downloadLotsCSV },
  { label: 'Lotes', format: 'PDF', fn: downloadLotsPDF },
  { label: 'Movimientos', format: 'CSV', fn: downloadMovementsCSV },
  { label: 'Auditoría', format: 'CSV', fn: downloadAuditCSV },
]

export default function ReportsPage() {
  const { can } = usePermissions()
  const { organization, isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const analyticsEnabled = isSuperAdmin || (organization?.plan?.features as Record<string, boolean>)?.analytics === true
  const reportsEnabled = isSuperAdmin || (organization?.plan?.features as Record<string, boolean>)?.reports === true

  const handleDownload = async (item: ExportItem) => {
    const key = `${item.label}-${item.format}`
    setLoading(key)
    try {
      await item.fn()
      notify.success(`${item.label} ${item.format} descargado`)
    } catch (e) {
      notify.apiError(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analítica</h1>
        <p className="text-sm text-gray-500 mt-0.5">Dashboards interactivos y exportaciones de datos</p>
      </div>

      {/* Sección Superset */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dashboards</h2>
          {!analyticsEnabled && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Requiere plan Pro</span>
          )}
        </div>

        {!analyticsEnabled ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Analítica avanzada</p>
            <p className="text-xs text-gray-500 mb-4">Dashboards interactivos con Apache Superset disponibles en el plan Pro.</p>
            <a
              href="mailto:soporte@tracechain.co?subject=Upgrade%20a%20Pro"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Contactar para mejorar plan
            </a>
          </div>
        ) : !SUPERSET_URL ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-sm font-semibold text-amber-800 mb-1">Superset no configurado</p>
            <p className="text-xs text-amber-700">
              Define <code className="bg-amber-100 px-1 rounded">VITE_SUPERSET_DASHBOARD_URL</code> en el archivo <code className="bg-amber-100 px-1 rounded">.env</code> del frontend para activar los dashboards embebidos.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 600 }}>
            <iframe
              src={SUPERSET_URL}
              title="Dashboard Superset"
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        )}
      </section>

      {/* Sección Exportaciones */}
      {can('reports:read') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Exportaciones</h2>
            {!reportsEnabled && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Requiere plan Pro</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPORTS.map((item) => {
              const key = `${item.label}-${item.format}`
              const formatColor = item.format === 'PDF'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${formatColor}`}>
                      {item.format}
                    </span>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(item)}
                    disabled={loading === key || !reportsEnabled}
                    className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {loading === key ? 'Descargando...' : 'Descargar'}
                  </button>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400">
            También puedes exportar directamente desde cada sección (Lotes, Movimientos, Auditoría).
          </p>
        </section>
      )}
    </div>
  )
}
