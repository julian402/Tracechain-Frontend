import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../../api/stats'
import { StatCardSkeleton, Skeleton } from '../../components/ui/Skeleton'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { Lot } from '../../types'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  QUARANTINE: 'bg-yellow-100 text-yellow-700',
  DEPLETED: 'bg-gray-100 text-gray-700'
}
const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo', EXPIRED: 'Vencido', QUARANTINE: 'Cuarentena', DEPLETED: 'Agotado'
}
const PIE_COLORS = ['#16a34a', '#dc2626', '#ca8a04', '#6b7280']

function KPICard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function LotBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
    staleTime: 0,
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-7 w-32" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error al cargar el dashboard</p>
      </div>
    )
  }

  const { kpis, recentLots, activeAlerts, lotsByMonth } = data!

  const depleted = kpis.totalLots - kpis.activeLots - kpis.expiredLots - kpis.quarantineLots
  const pieData = [
    { name: 'Activos', value: kpis.activeLots },
    { name: 'Vencidos', value: kpis.expiredLots },
    { name: 'Cuarentena', value: kpis.quarantineLots },
    { name: 'Agotados', value: Math.max(0, depleted) },
  ].filter((d) => d.value > 0)

  const barData = (lotsByMonth ?? []).map((d) => ({
    ...d,
    mes: d.mes.slice(5),
  }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total lotes" value={kpis.totalLots} color="text-gray-900" />
        <KPICard label="Activos" value={kpis.activeLots} color="text-green-600" />
        <KPICard label="Próximos a vencer" value={kpis.expiringIn7Days} color="text-yellow-600" />
        <KPICard label="Vencidos" value={kpis.expiredLots} color="text-red-600" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Lotes por estado</h2>
          {kpis.totalLots === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
          ) : (
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie data={pieData} cx={80} cy={80} innerRadius={48} outerRadius={72} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'lotes']} />
              </PieChart>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600">{d.name}</span>
                    <span className="font-semibold text-gray-900 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barras */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Lotes creados por mes</h2>
          {barData.every((d) => d.lotes === 0) ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos en los últimos 6 meses</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [v, 'lotes']} />
                <Bar dataKey="lotes" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lotes recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Lotes recientes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLots.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No hay lotes registrados</p>
            ) : (
              recentLots.map((lot: Lot) => (
                <div key={lot.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lot.name}</p>
                    <p className="text-xs text-gray-500">{lot.code} · {lot.quantity} {lot.unit}</p>
                  </div>
                  <LotBadge status={lot.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Alertas
              {activeAlerts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  {activeAlerts.length}
                </span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activeAlerts.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Sin alertas activas</p>
            ) : (
              activeAlerts.map((lot: Lot) => (
                <div key={lot.id} className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lot.name}</p>
                      <p className="text-xs text-gray-500">{lot.code} · {lot.quantity} {lot.unit}</p>
                      <LotBadge status={lot.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stats secundarios */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">En cuarentena</p>
          <p className="text-3xl font-bold text-yellow-600">{kpis.quarantineLots}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total movimientos</p>
          <p className="text-3xl font-bold text-blue-600">{kpis.totalMovements}</p>
        </div>
      </div>
    </div>
  )
}
