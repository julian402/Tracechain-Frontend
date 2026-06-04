import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicLot } from '../../api/lots'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  EXPIRED: 'bg-red-100 text-red-700 border-red-200',
  QUARANTINE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DEPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
}
const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo', EXPIRED: 'Vencido', QUARANTINE: 'Cuarentena', DEPLETED: 'Agotado'
}

export default function PublicLotPage() {
  const { qrCode } = useParams<{ qrCode: string }>()
  const { data: lot, isLoading, isError } = useQuery({
    queryKey: ['public-lot', qrCode],
    queryFn: () => getPublicLot(qrCode!),
    enabled: !!qrCode,
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !lot) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Lote no encontrado</h1>
        <p className="text-gray-500">El código QR no corresponde a ningún lote registrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900">TraceChain</span>
          <span className="text-gray-400 text-sm ml-auto">Trazabilidad verificada</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Estado */}
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${statusColors[lot.status]}`}>
          <div className="w-3 h-3 rounded-full bg-current opacity-60" />
          <div>
            <p className="font-semibold">{statusLabels[lot.status]}</p>
            <p className="text-xs opacity-75">Estado actual del lote</p>
          </div>
        </div>

        {/* Info principal */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{lot.name}</h1>
          <p className="text-sm font-mono text-gray-500 mb-4">{lot.code}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Cantidad</p>
              <p className="font-semibold text-gray-900">{lot.quantity} {lot.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Registro sanitario</p>
              <p className="font-semibold text-gray-900">{lot.sanitaryRecord ?? 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Fecha de producción</p>
              <p className="font-semibold text-gray-900">
                {new Date(lot.productionDate).toLocaleDateString('es-CO')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Fecha de vencimiento</p>
              <p className="font-semibold text-gray-900">
                {new Date(lot.expirationDate).toLocaleDateString('es-CO')}
              </p>
            </div>
            {lot.storageTemp != null && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Temperatura</p>
                <p className="font-semibold text-gray-900">{lot.storageTemp} °C</p>
              </div>
            )}
            {lot.storageHumidity != null && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Humedad</p>
                <p className="font-semibold text-gray-900">{lot.storageHumidity}%</p>
              </div>
            )}
          </div>

          {lot.notes && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-0.5">Notas</p>
              <p className="text-sm text-blue-900">{lot.notes}</p>
            </div>
          )}
        </div>

        {/* Historial de movimientos */}
        {lot.movements && lot.movements.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Historial de movimientos</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {lot.movements.map((m) => (
                <div key={m.id} className="p-4 flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.type}</p>
                    <p className="text-sm text-gray-600">{m.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(m.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Información verificada por TraceChain · {new Date().toLocaleDateString('es-CO')}
        </p>
      </main>
    </div>
  )
}
