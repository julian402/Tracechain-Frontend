import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial, type RawMaterialPayload } from '../../api/rawMaterials'
import { getSuppliers } from '../../api/suppliers'
import { usePermissions } from '../../hooks/usePermissions'
import { notify } from '../../lib/toast'
import { EmptyState } from '../../components/ui/EmptyState'
import type { RawMaterialBatch } from '../../types'

interface FormState {
  name: string
  batchNumber: string
  quantity: string
  unit: string
  receivedDate: string
  expirationDate: string
  supplierId: string
  notes: string
}

const emptyForm: FormState = {
  name: '', batchNumber: '', quantity: '', unit: 'kg', receivedDate: '', expirationDate: '', supplierId: '', notes: '',
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('es-CO') : '—')

export default function RawMaterialsTab() {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RawMaterialBatch | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const { data: materials = [], isLoading } = useQuery({ queryKey: ['rawMaterials'], queryFn: getRawMaterials })
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['rawMaterials'] })

  const mutation = useMutation({
    mutationFn: (payload: RawMaterialPayload) =>
      editing ? updateRawMaterial(editing.id, payload) : createRawMaterial(payload),
    onSuccess: () => { invalidate(); notify.success(editing ? 'Materia prima actualizada' : 'Materia prima registrada'); closeForm() },
    onError: (error) => notify.apiError(error),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteRawMaterial(id),
    onSuccess: () => { invalidate(); notify.success('Materia prima eliminada') },
    onError: (error) => notify.apiError(error),
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (m: RawMaterialBatch) => {
    setEditing(m)
    setForm({
      name: m.name,
      batchNumber: m.batchNumber ?? '',
      quantity: String(m.quantity),
      unit: m.unit,
      receivedDate: m.receivedDate ? m.receivedDate.slice(0, 10) : '',
      expirationDate: m.expirationDate ? m.expirationDate.slice(0, 10) : '',
      supplierId: m.supplierId ?? '',
      notes: m.notes ?? '',
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      batchNumber: form.batchNumber || undefined,
      receivedDate: form.receivedDate || undefined,
      expirationDate: form.expirationDate || undefined,
      supplierId: form.supplierId || null,
      notes: form.notes || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Lotes de materia prima almacenados en inventario.</p>
        {can('inventory:create') && (
          <button onClick={openCreate} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            + Registrar materia prima
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-gray-400">Cargando…</div>
        ) : materials.length === 0 ? (
          <EmptyState message="No hay materias primas registradas" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Lote', 'Cantidad', 'Proveedor', 'Vencimiento', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{m.batchNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.quantity} {m.unit}</td>
                  <td className="px-4 py-3 text-gray-600">{m.supplier?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(m.expirationDate)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can('inventory:update') && (
                      <button onClick={() => openEdit(m)} className="text-green-600 hover:underline text-sm mr-3">Editar</button>
                    )}
                    {can('inventory:delete') && (
                      <button
                        onClick={() => { if (confirm(`¿Eliminar "${m.name}"?`)) removeMutation.mutate(m.id) }}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editing ? 'Editar materia prima' : 'Registrar materia prima'}</h2>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  placeholder="Agave, azúcar, levadura…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° de lote</label>
                <input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Sin proveedor</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                <input type="number" step="any" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="mL">mL</option>
                  <option value="unidades">unidades</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de recepción</label>
                <input type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
                <input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button type="button" onClick={closeForm} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={mutation.isPending} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {mutation.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
