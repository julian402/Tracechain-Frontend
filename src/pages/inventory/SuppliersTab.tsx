import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type SupplierPayload } from '../../api/suppliers'
import { usePermissions } from '../../hooks/usePermissions'
import { notify } from '../../lib/toast'
import { EmptyState } from '../../components/ui/EmptyState'
import type { Supplier } from '../../types'

const emptyForm: SupplierPayload = { name: '', taxId: '', contact: '', phone: '', email: '', notes: '' }

export default function SuppliersTab() {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierPayload>(emptyForm)

  const { data: suppliers = [], isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })

  const mutation = useMutation({
    mutationFn: (payload: SupplierPayload) =>
      editing ? updateSupplier(editing.id, payload) : createSupplier(payload),
    onSuccess: () => {
      invalidate()
      notify.success(editing ? 'Proveedor actualizado' : 'Proveedor creado')
      closeForm()
    },
    onError: (error) => notify.apiError(error),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => { invalidate(); notify.success('Proveedor eliminado') },
    onError: (error) => notify.apiError(error),
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (s: Supplier) => {
    setEditing(s)
    setForm({ name: s.name, taxId: s.taxId ?? '', contact: s.contact ?? '', phone: s.phone ?? '', email: s.email ?? '', notes: s.notes ?? '' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      ...form,
      taxId: form.taxId || undefined,
      contact: form.contact || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      notes: form.notes || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Proveedores de materias primas de tu organización.</p>
        {can('inventory:create') && (
          <button onClick={openCreate} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            + Nuevo proveedor
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-gray-400">Cargando…</div>
        ) : suppliers.length === 0 ? (
          <EmptyState message="No hay proveedores registrados" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'NIT / ID', 'Contacto', 'Teléfono', 'Correo', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.taxId || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.contact || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {can('inventory:update') && (
                      <button onClick={() => openEdit(s)} className="text-green-600 hover:underline text-sm mr-3">Editar</button>
                    )}
                    {can('inventory:delete') && (
                      <button
                        onClick={() => { if (confirm(`¿Eliminar proveedor "${s.name}"?`)) removeMutation.mutate(s.id) }}
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
              <h2 className="font-semibold text-gray-900">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIT / ID</label>
                <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
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
