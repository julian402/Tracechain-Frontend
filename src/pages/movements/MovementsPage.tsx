import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getMovements, createMovement } from '../../api/movements'
import { getLots } from '../../api/lots'
import { downloadMovementsCSV } from '../../api/reports'
import { usePermissions } from '../../hooks/usePermissions'
import { notify } from '../../lib/toast'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { Pagination } from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { MOVEMENT_TYPE_COLORS, MOVEMENT_TYPE_LABELS } from '../../lib/constants'
import type { Movement } from '../../types'

const PAGE_SIZE = 10

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
  const { can } = usePermissions()
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const handleExportCSV = async () => {
    setExporting(true)
    try { await downloadMovementsCSV(); notify.success('CSV movimientos descargado') }
    catch (e) { notify.apiError(e) }
    finally { setExporting(false) }
  }
  const [filterType, setFilterType] = useState('')
  const [filterLot, setFilterLot] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')

  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['movements', page, filterType, filterLot, filterFrom, filterTo],
    queryFn: () => getMovements({
      page,
      limit: PAGE_SIZE,
      type: filterType || undefined,
      lotCode: filterLot || undefined,
      fromDate: filterFrom || undefined,
      toDate: filterTo || undefined,
    }),
    placeholderData: keepPreviousData,
  })

  const movements = movementsData?.data ?? []
  const totalMovements = movementsData?.total ?? 0

  const handleFilterChange = () => setPage(1)

  const { data: lotsData } = useQuery({
    queryKey: ['lots'],
    queryFn: () => getLots({ limit: 200 }),
  })
  const lots = lotsData?.data ?? []

  const createMutation = useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowForm(false)
      setForm(initialForm)
      setFormError('')
      notify.movementCreated()
    },
    onError: (error) => {
      setFormError('Error al registrar el movimiento.')
      notify.apiError(error)
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Movimientos</h1>
        <div className="flex items-center gap-2">
          {can('reports:read') && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              title="Exportar CSV"
              className="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              <span>↓</span> {exporting ? '...' : 'CSV'}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shrink-0"
          >
            + Registrar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); handleFilterChange() }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(MOVEMENT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Código de lote..."
            value={filterLot}
            onChange={(e) => { setFilterLot(e.target.value); handleFilterChange() }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => { setFilterFrom(e.target.value); handleFilterChange() }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="date"
              value={filterTo}
              onChange={(e) => { setFilterTo(e.target.value); handleFilterChange() }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {(filterType || filterLot || filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterType(''); setFilterLot(''); setFilterFrom(''); setFilterTo(''); setPage(1) }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <>
          <table className="hidden md:table w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Tipo', 'Lote', 'Descripción', 'Cantidad', 'Ruta', 'Fecha'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}
            </tbody>
          </table>
          <div className="md:hidden divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          </>
        ) : movements.length === 0 ? (
          <EmptyState message="No hay movimientos registrados" />
        ) : (
          <>
          {/* Tabla — desktop */}
          <table className="hidden md:table w-full text-sm">
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
                    <Badge color={MOVEMENT_TYPE_COLORS[movement.type]}>
                      {MOVEMENT_TYPE_LABELS[movement.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {movement.lot?.code ?? movement.lotId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{movement.description}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {movement.quantity != null ? `${movement.quantity}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {movement.fromLocation ? `${movement.fromLocation} → ${movement.toLocation}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards — móvil */}
          <div className="md:hidden divide-y divide-gray-100">
            {movements.map((movement: Movement) => (
              <div key={movement.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${MOVEMENT_TYPE_COLORS[movement.type]}`}>
                    {MOVEMENT_TYPE_LABELS[movement.type]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{movement.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-mono">{movement.lot?.code ?? movement.lotId.slice(0, 8)}</span>
                  {movement.quantity != null && <span>{movement.quantity}</span>}
                  {movement.fromLocation && <span>{movement.fromLocation} → {movement.toLocation}</span>}
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} totalItems={totalMovements} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <Modal title="Registrar movimiento" onClose={() => setShowForm(false)}>
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
                  {lots.map((lot) => (
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
        </Modal>
      )}
    </div>
  )
}
