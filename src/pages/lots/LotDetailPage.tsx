import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLotById, getLotTree, changeLotStatus } from '../../api/lots'
import type { Lot } from '../../types'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  QUARANTINE: 'bg-yellow-100 text-yellow-700',
  DEPLETED: 'bg-gray-100 text-gray-700'
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  EXPIRED: 'Vencido',
  QUARANTINE: 'Cuarentena',
  DEPLETED: 'Agotado'
}

const movementLabels: Record<string, string> = {
  CREATED: 'Creado',
  TRANSFERRED: 'Traslado',
  TRANSFORMED: 'Transformado',
  SPLIT: 'Fraccionado',
  MERGED: 'Mezclado',
  STATUS_CHANGED: 'Cambio de estado'
}

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: lot, isLoading } = useQuery({
    queryKey: ['lot', id],
    queryFn: () => getLotById(id!)
  })

  const { data: tree } = useQuery({
    queryKey: ['lot-tree', id],
    queryFn: () => getLotTree(id!)
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => changeLotStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot', id] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (!lot) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Lote no encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/lots')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Volver
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{lot.name}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lot.status]}`}>
              {statusLabels[lot.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">{lot.code}</p>
        </div>

        {/* Cambiar estado */}
        <select
          value={lot.status}
          onChange={(e) => statusMutation.mutate(e.target.value)}
          disabled={statusMutation.isPending}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="ACTIVE">Activo</option>
          <option value="EXPIRED">Vencido</option>
          <option value="QUARANTINE">Cuarentena</option>
          <option value="DEPLETED">Agotado</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info del lote */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos generales */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información del lote</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Cantidad</p>
                <p className="font-medium text-gray-900">{lot.quantity} {lot.unit}</p>
              </div>
              <div>
                <p className="text-gray-500">Registro sanitario</p>
                <p className="font-medium text-gray-900">{lot.sanitaryRecord ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha producción</p>
                <p className="font-medium text-gray-900">
                  {new Date(lot.productionDate).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fecha vencimiento</p>
                <p className="font-medium text-gray-900">
                  {new Date(lot.expirationDate).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Temperatura</p>
                <p className="font-medium text-gray-900">{lot.storageTemp != null ? `${lot.storageTemp} °C` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Humedad</p>
                <p className="font-medium text-gray-900">{lot.storageHumidity != null ? `${lot.storageHumidity}%` : 'N/A'}</p>
              </div>
              {lot.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500">Notas</p>
                  <p className="font-medium text-gray-900">{lot.notes}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Creado por</p>
                <p className="font-medium text-gray-900">{lot.createdBy?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha registro</p>
                <p className="font-medium text-gray-900">
                  {new Date(lot.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
          </div>

          {/* Historial de movimientos */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Historial de movimientos</h2>
            </div>
            {!lot.movements || lot.movements.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Sin movimientos registrados</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {lot.movements.map((movement) => (
                  <div key={movement.id} className="p-4 flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {movementLabels[movement.type] ?? movement.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{movement.description}</p>
                      {movement.fromLocation && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {movement.fromLocation} → {movement.toLocation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Árbol de trazabilidad */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Árbol de trazabilidad</h2>

            {/* Ancestros */}
            {tree?.ancestors && tree.ancestors.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Lotes padre</p>
                {tree.ancestors.map((ancestor: Lot) => (
                  <div
                    key={ancestor.id}
                    onClick={() => navigate(`/lots/${ancestor.id}`)}
                    className="p-2 bg-blue-50 rounded-lg mb-2 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-blue-800">{ancestor.name}</p>
                    <p className="text-xs text-blue-600">{ancestor.code}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Lote actual */}
            <div className="p-2 bg-green-50 rounded-lg border-2 border-green-200 mb-4">
              <p className="text-sm font-medium text-green-800">{lot.name}</p>
              <p className="text-xs text-green-600">{lot.code} · Actual</p>
            </div>

            {/* Descendientes */}
            {tree?.descendants && tree.descendants.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Lotes derivados</p>
                {tree.descendants.map((descendant: Lot) => (
                  <div
                    key={descendant.id}
                    onClick={() => navigate(`/lots/${descendant.id}`)}
                    className="p-2 bg-gray-50 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{descendant.name}</p>
                    <p className="text-xs text-gray-500">{descendant.code}</p>
                  </div>
                ))}
              </div>
            )}

            {(!tree?.ancestors?.length && !tree?.descendants?.length) && (
              <p className="text-sm text-gray-500">Este lote no tiene relaciones</p>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Código QR</h2>
            <p className="text-xs text-gray-500 font-mono break-all">{lot.qrCode}</p>
            <a
              href={`http://localhost:3000/api/lots/public/${lot.qrCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver vista pública →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}