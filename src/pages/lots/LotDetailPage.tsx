import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLotById, getLotTree, changeLotStatus, updateLot } from '../../api/lots'
import { getQrImage } from '../../api/qr'
import { notify } from '../../lib/toast'
import { Skeleton } from '../../components/ui/Skeleton'
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
const movementLabels: Record<string, string> = {
  CREATED: 'Creado', TRANSFERRED: 'Traslado', TRANSFORMED: 'Transformado',
  SPLIT: 'Fraccionado', MERGED: 'Mezclado', STATUS_CHANGED: 'Cambio de estado'
}

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Lot>>({})

  const { data: lot, isLoading } = useQuery({
    queryKey: ['lot', id],
    queryFn: () => getLotById(id!),
  })

  const { data: tree } = useQuery({
    queryKey: ['lot-tree', id],
    queryFn: () => getLotTree(id!),
  })

  const { data: qrData } = useQuery({
    queryKey: ['qr', lot?.qrCode],
    queryFn: () => getQrImage(lot!.qrCode),
    enabled: !!lot?.qrCode,
    staleTime: Infinity,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => changeLotStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot', id] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      notify.lotStatusUpdated()
    },
    onError: (error) => notify.apiError(error),
  })

  const editMutation = useMutation({
    mutationFn: (data: Partial<Lot>) => updateLot(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot', id] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      setShowEdit(false)
      notify.success('Lote actualizado')
    },
    onError: (error) => notify.apiError(error),
  })

  const openEdit = () => {
    if (!lot) return
    setEditForm({
      name: lot.name,
      quantity: lot.quantity,
      unit: lot.unit,
      productionDate: lot.productionDate.slice(0, 10),
      expirationDate: lot.expirationDate.slice(0, 10),
      sanitaryRecord: lot.sanitaryRecord ?? '',
      storageTemp: lot.storageTemp,
      storageHumidity: lot.storageHumidity,
      notes: lot.notes ?? '',
    })
    setShowEdit(true)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
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
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <button onClick={() => navigate('/dashboard')} className="hover:text-gray-700">Dashboard</button>
        <span>/</span>
        <button onClick={() => navigate('/lots')} className="hover:text-gray-700">Lotes</button>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{lot.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{lot.name}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lot.status]}`}>
              {statusLabels[lot.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono">{lot.code}</p>
        </div>

        <button
          onClick={openEdit}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Editar
        </button>

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

        {/* Sidebar derecho */}
        <div className="space-y-4">
          {/* Árbol de trazabilidad */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Árbol de trazabilidad</h2>
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
            <div className="p-2 bg-green-50 rounded-lg border-2 border-green-200 mb-4">
              <p className="text-sm font-medium text-green-800">{lot.name}</p>
              <p className="text-xs text-green-600">{lot.code} · Actual</p>
            </div>
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
            <h2 className="font-semibold text-gray-900 mb-3">Código QR</h2>
            {qrData?.qrImage ? (
              <div className="flex flex-col items-center gap-3">
                <img src={qrData.qrImage} alt="QR Code" className="w-40 h-40" />
                <a
                  href={qrData.qrImage}
                  download={`qr-${lot.code}.png`}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Descargar imagen
                </a>
              </div>
            ) : (
              <Skeleton className="h-40 w-40 mx-auto" />
            )}
            <p className="text-xs text-gray-400 font-mono break-all mt-2 text-center">{lot.qrCode}</p>
            <a
              href={`/public/${lot.qrCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Ver vista pública →
            </a>
          </div>
        </div>
      </div>

      {/* Modal editar lote */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Editar lote</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); editMutation.mutate(editForm) }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input
                    required
                    type="number"
                    value={editForm.quantity ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                  <select
                    value={editForm.unit ?? 'kg'}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="unidades">unidades</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha producción</label>
                  <input
                    type="date"
                    value={String(editForm.productionDate ?? '')}
                    onChange={(e) => setEditForm({ ...editForm, productionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha vencimiento</label>
                  <input
                    type="date"
                    value={String(editForm.expirationDate ?? '')}
                    onChange={(e) => setEditForm({ ...editForm, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registro sanitario</label>
                <input
                  value={editForm.sanitaryRecord ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, sanitaryRecord: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    value={editForm.storageTemp ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, storageTemp: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Humedad (%)</label>
                  <input
                    type="number"
                    value={editForm.storageHumidity ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, storageHumidity: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={3}
                  value={editForm.notes ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {editMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
