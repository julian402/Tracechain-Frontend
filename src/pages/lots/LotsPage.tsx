import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getLots, createLot } from '../../api/lots'
import { getSuppliers } from '../../api/suppliers'
import { getRawMaterials } from '../../api/rawMaterials'
import { downloadLotsCSV, downloadLotsPDF } from '../../api/reports'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../lib/toast'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { Pagination } from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { ReportDownloadMenu } from '../../components/ui/ReportDownloadMenu'
import { LOT_STATUS_COLORS, LOT_STATUS_LABELS } from '../../lib/constants'
import type { Lot } from '../../types'

const PAGE_SIZE = 10

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
  parentLotId: '',
  supplierId: ''
}

interface IngredientRow {
  rawMaterialBatchId: string
  quantityUsed: string
  unit: string
}

const emptyIngredient: IngredientRow = { rawMaterialBatchId: '', quantityUsed: '', unit: 'kg' }

export default function LotsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const { organization, isSuperAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])
  const [formError, setFormError] = useState('')
  const reportsEnabled = isSuperAdmin || (organization?.plan?.features as Record<string, boolean> | undefined)?.reports === true

  const { data, isLoading } = useQuery({
    queryKey: ['lots', search, status, page],
    queryFn: () => getLots({ page, limit: PAGE_SIZE, search: search || undefined, status: status || undefined }),
    placeholderData: keepPreviousData,
  })

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers, enabled: can('inventory:read') })
  const { data: rawMaterials = [] } = useQuery({ queryKey: ['rawMaterials'], queryFn: getRawMaterials, enabled: can('inventory:read') })

  const lots = data?.data ?? []
  const totalLots = data?.total ?? 0

  const handleFilterChange = (newSearch: string, newStatus: string) => {
    setSearch(newSearch)
    setStatus(newStatus)
    setPage(1)
  }

  const createMutation = useMutation({
    mutationFn: createLot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowForm(false)
      setForm(initialForm)
      setIngredients([])
      setFormError('')
      notify.lotCreated()
    },
    onError: (error) => {
      setFormError('Error al crear el lote. Verifica los datos.')
      notify.apiError(error)
    }
  })

  const addIngredient = () => setIngredients((prev) => [...prev, { ...emptyIngredient }])
  const removeIngredient = (i: number) => setIngredients((prev) => prev.filter((_, idx) => idx !== i))
  const updateIngredient = (i: number, field: keyof IngredientRow, value: string) =>
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const validIngredients = ingredients
      .filter((i) => i.rawMaterialBatchId && i.quantityUsed)
      .map((i) => ({ rawMaterialBatchId: i.rawMaterialBatchId, quantityUsed: Number(i.quantityUsed), unit: i.unit }))
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
      parentLotId: form.parentLotId || undefined,
      supplierId: form.supplierId || undefined,
      ...(validIngredients.length ? { ingredients: validIngredients } : {}),
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Lotes</h1>
        <div className="flex items-center gap-2">
          {can('reports:read') && (
            <ReportDownloadMenu
              disabled={!reportsEnabled}
              options={[
                { label: 'Lotes CSV', description: 'Hoja de cálculo', action: downloadLotsCSV },
                { label: 'Lotes PDF', description: 'Reporte imprimible', action: downloadLotsPDF },
              ]}
            />
          )}
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Nuevo lote
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => handleFilterChange(e.target.value, status)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={status}
          onChange={(e) => handleFilterChange(search, e.target.value)}
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Código', 'Nombre', 'Cantidad', 'Estado', 'Vencimiento', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}
            </tbody>
          </table>
        ) : lots.length === 0 ? (
          <EmptyState message="No hay lotes registrados" />
        ) : (
          <>
          {/* Tabla — desktop */}
          <table className="hidden md:table w-full text-sm">
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
                    <Badge color={LOT_STATUS_COLORS[lot.status]}>
                      {LOT_STATUS_LABELS[lot.status]}
                    </Badge>
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

          {/* Cards — móvil */}
          <div className="md:hidden divide-y divide-gray-100">
            {lots.map((lot: Lot) => (
              <div key={lot.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{lot.name}</p>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{lot.code}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${LOT_STATUS_COLORS[lot.status]}`}>
                    {LOT_STATUS_LABELS[lot.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{lot.quantity} {lot.unit}</span>
                  <span className="text-xs text-gray-400">Vence: {new Date(lot.expirationDate).toLocaleDateString('es-CO')}</span>
                </div>
                <button
                  onClick={() => navigate(`/lots/${lot.id}`)}
                  className="text-green-600 hover:text-green-700 text-xs font-medium"
                >
                  Ver detalle →
                </button>
              </div>
            ))}
          </div>

          <Pagination page={page} totalItems={totalLots} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Modal crear lote */}
      {showForm && (
        <Modal title="Nuevo lote" onClose={() => setShowForm(false)} size="lg">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {can('inventory:read') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor del producto</label>
                    <select
                      value={form.supplierId}
                      onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sin proveedor</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  {/* Materias primas usadas (trazabilidad de elaboración) */}
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Materias primas utilizadas</p>
                        <p className="text-xs text-gray-400">Detalle de elaboración (ej. mezcal con sus insumos)</p>
                      </div>
                      <button type="button" onClick={addIngredient} className="text-sm text-green-600 font-medium hover:text-green-700">
                        + Agregar
                      </button>
                    </div>
                    {ingredients.length === 0 && (
                      <p className="text-xs text-gray-400">No se han agregado materias primas.</p>
                    )}
                    {ingredients.map((ing, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Materia prima</label>
                          <select
                            value={ing.rawMaterialBatchId}
                            onChange={(e) => updateIngredient(i, 'rawMaterialBatchId', e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Seleccionar…</option>
                            {rawMaterials.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.name}{rm.batchNumber ? ` (${rm.batchNumber})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                          <input
                            type="number" step="any" min="0"
                            value={ing.quantityUsed}
                            onChange={(e) => updateIngredient(i, 'quantityUsed', e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
                          <select
                            value={ing.unit}
                            onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                            className="w-full px-1 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="mL">mL</option>
                            <option value="unidades">u</option>
                          </select>
                        </div>
                        <div className="col-span-1">
                          <button type="button" onClick={() => removeIngredient(i)} className="text-red-500 hover:text-red-700 text-sm pb-2">✕</button>
                        </div>
                      </div>
                    ))}
                    {can('inventory:read') && rawMaterials.length === 0 && (
                      <p className="text-xs text-amber-600">No hay materias primas en inventario. Regístralas en Inventario → Materias primas.</p>
                    )}
                  </div>
                </>
              )}

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
        </Modal>
      )}
    </div>
  )
}
