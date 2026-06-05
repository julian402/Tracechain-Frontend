import { useQuery } from '@tanstack/react-query'
import { getMyOrganization } from '../../api/organizations'
import { useAuth } from '../../hooks/useAuth'
import { env } from '../../env'

const buildSupersetDashboardUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return ''
  try {
    const url = new URL(rawUrl)
    url.searchParams.set('standalone', '3')
    return url.toString()
  } catch {
    return rawUrl
  }
}

export default function ReportsPage() {
  const { organization, isSuperAdmin } = useAuth()
  const { data: currentOrganization } = useQuery({
    queryKey: ['my-organization', organization?.id],
    queryFn: getMyOrganization,
    enabled: !!organization?.id,
  })
  const org = currentOrganization ?? organization
  const analyticsEnabled = isSuperAdmin || (org?.plan?.features as Record<string, boolean> | undefined)?.analytics === true
  const canUseGlobalDemoDashboard = !!org?.slug && org.slug === env.supersetFallbackOrgSlug
  const rawDashboardUrl = org?.analyticsConfig?.dashboardUrl || (canUseGlobalDemoDashboard ? env.supersetDashboardUrl : '')
  const dashboardUrl = buildSupersetDashboardUrl(rawDashboardUrl)

  return (
    <div className="p-0 md:p-4 h-[calc(100vh-3.5rem)] md:h-screen">
      {!analyticsEnabled || !dashboardUrl ? (
        <div className="h-full flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md shadow-sm">
            <div className="w-12 h-12 bg-green-50 rounded-xl border border-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h8m-8 0V7a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H5a2 2 0 00-2 2v6a2 2 0 002 2h6m0-10v10m0 0h8a2 2 0 002-2v-4" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-2">Analítica avanzada disponible</p>
            <p className="text-sm text-gray-500">
              Para acceder a dashboards personalizados de reportes, adquiere este módulo adicional o contacta al administrador de la plataforma.
            </p>
          </div>
        </div>
      ) : (
        <iframe
          src={dashboardUrl}
          title="Dashboard de analítica"
          className="w-full h-full border-0 bg-white md:rounded-xl md:border md:border-gray-200"
          allowFullScreen
        />
      )}
    </div>
  )
}
