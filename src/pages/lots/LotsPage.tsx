import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getLots, searchLots, createLot } from '../../api/lots'
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

const initialForm = {
  name: '',
  quantity: '',
  unit: 'kg',
  productionDate: '',
  expirationDate: '',
  sanitaryRecord: '',
  storageTemp: '',
  storageHumidity: '',
  notes: '',
  parentLotId: ''
}

export default function LotsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['lots', search, status],
    queryFn: () =>
      search || status
        ? searchLots({ search: search || undefined, status: status || undefined })
        : getLots()
  })

  const createMutation = useMutation({
    mutationFn: createLot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowForm(false)
      setForm(initialForm)
      setFormError('')
    },
    onError: () => {
      setFormError('Error al crear el lote. Verifica los datos.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate({
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      productionDate: form.productionDate,
      expirationDate: form.expirationDate,
      sanitaryRecord: form.sanitaryRecord || undefined,
      storageTemp: form.storageTemp ? Number(form.storageTemp) : undefined,
      storageHumidity: form.storageHumidity ? Number(form.storageHumidity) : undefined,
      notes: form.notes || undefined,
      parentLotId: form.parentLotId || undefined
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Lotes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Nuevo lote
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="EXPIRED">Vencido</option>
          <option value="QUARANTINE">Cuarentena</option>
          <option value="DEPLETED">Agotado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Cargando lotes...</p>
        ) : lots.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No hay lotes registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lots.map((lot: Lot) => (
                <tr key={lot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{lot.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{lot.name}</td>
                  <td className="px-4 py-3 text-gray-600">{lot.quantity} {lot.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lot.status]}`}>
                      {statusLabels[lot.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(lot.expirationDate).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/lots/${lot.id}`)}
                      className="text-green-600 hover:text-green-700 text-xs font-medium"
                    >
                      Ver detalle →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear lote */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Nuevo lote</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Lote Mango Premium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input
                    required
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha producción *</label>
                  <input
                    required
                    type="date"
                    value={form.productionDate}
                    onChange={(e) => setForm({ ...form, productionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha vencimiento *</label>
                  <input
                    required
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registro sanitario</label>
                <input
                  value={form.sanitaryRecord}
                  onChange={(e) => setForm({ ...form, sanitaryRecord: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: SAN-2026-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    value={form.storageTemp}
                    onChange={(e) => setForm({ ...form, storageTemp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Humedad (%)</label>
                  <input
                    type="number"
                    value={form.storageHumidity}
                    onChange={(e) => setForm({ ...form, storageHumidity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote padre (ID)</label>
                <input
                  value={form.parentLotId}
                  onChange={(e) => setForm({ ...form, parentLotId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="UUID del lote padre (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}