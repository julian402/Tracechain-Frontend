import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMovements, createMovement } from '../../api/movements'
import { getLots } from '../../api/lots'
import type { Movement } from '../../types'

const movementLabels: Record<string, string> = {
  CREATED: 'Creado',
  TRANSFERRED: 'Traslado',
  TRANSFORMED: 'Transformado',
  SPLIT: 'Fraccionado',
  MERGED: 'Mezclado',
  STATUS_CHANGED: 'Cambio de estado'
}

const movementColors: Record<string, string> = {
  CREATED: 'bg-green-100 text-green-700',
  TRANSFERRED: 'bg-blue-100 text-blue-700',
  TRANSFORMED: 'bg-purple-100 text-purple-700',
  SPLIT: 'bg-orange-100 text-orange-700',
  MERGED: 'bg-pink-100 text-pink-700',
  STATUS_CHANGED: 'bg-yellow-100 text-yellow-700'
}

const initialForm = {
  lotId: '',
  type: 'TRANSFERRED',
  description: '',
  quantity: '',
  fromLocation: '',
  toLocation: ''
}

export default function MovementsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: getMovements
  })

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: getLots
  })

  const createMutation = useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowForm(false)
      setForm(initialForm)
      setFormError('')
    },
    onError: () => {
      setFormError('Error al registrar el movimiento.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate({
      lotId: form.lotId,
      type: form.type as Movement['type'],
      description: form.description,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      fromLocation: form.fromLocation || undefined,
      toLocation: form.toLocation || undefined
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Movimientos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Registrar movimiento
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Cargando movimientos...</p>
        ) : movements.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No hay movimientos registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lote</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ruta</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map((movement: Movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${movementColors[movement.type]}`}>
                      {movementLabels[movement.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {(movement as any).lot?.code ?? movement.lotId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{movement.description}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {movement.quantity != null ? `${movement.quantity}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {movement.fromLocation
                      ? `${movement.fromLocation} → ${movement.toLocation}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Registrar movimiento</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                <select
                  required
                  value={form.lotId}
                  onChange={(e) => setForm({ ...form, lotId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar lote...</option>
                  {lots.map((lot: any) => (
                    <option key={lot.id} value={lot.id}>{lot.name} — {lot.code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(movementLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                  <input
                    value={form.fromLocation}
                    onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Bodega A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                  <input
                    value={form.toLocation}
                    onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Bodega B"
                  />
                </div>
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
                  {createMutation.isPending ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}