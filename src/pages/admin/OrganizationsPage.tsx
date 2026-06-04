import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrganizations, createOrganization, changeOrgPlan, activateOrganization, suspendOrganization, type CreateOrgPayload } from '../../api/organizations'
import { getPlans } from '../../api/plans'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { notify } from '../../lib/toast'
import { getApiMessage } from '../../lib/apiError'
import type { Organization } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
}

const emptyForm: CreateOrgPayload & { slug: string } = { name: '', slug: '', planId: '' }

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [changePlanOrg, setChangePlanOrg] = useState<Organization | null>(null)
  const [newPlanId, setNewPlanId] = useState('')

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['organizations'] })

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => { invalidate(); notify.success('Organización creada'); setShowCreate(false); setForm(emptyForm) },
    onError: (e) => { setFormError(getApiMessage(e, 'Error al crear la organización')); notify.apiError(e) },
  })

  const planMutation = useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) => changeOrgPlan(id, planId),
    onSuccess: () => { invalidate(); notify.success('Plan actualizado'); setChangePlanOrg(null) },
    onError: (e) => notify.apiError(e),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activateOrganization(id) : suspendOrganization(id),
    onSuccess: () => { invalidate(); notify.success('Estado actualizado') },
    onError: (e) => notify.apiError(e),
  })

  const openChangePlan = (org: Organization) => {
    setChangePlanOrg(org)
    setNewPlanId(org.planId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate({ name: form.name, slug: form.slug.trim() || undefined, planId: form.planId })
  }

  const activePlans = plans.filter((p) => p.isActive)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de empresas registradas en la plataforma</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          + Nueva organización
        </button>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{orgs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Activas</p>
          <p className="text-2xl font-bold text-green-600">{orgs.filter((o) => o.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Suspendidas</p>
          <p className="text-2xl font-bold text-red-500">{orgs.filter((o) => o.status === 'SUSPENDED').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Planes</p>
          <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Organización', 'Plan', 'Usuarios', 'Lotes', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}
            </tbody>
          </table>
        ) : orgs.length === 0 ? (
          <EmptyState message="No hay organizaciones registradas" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organización</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuarios</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lotes</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{(org as any).slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color="bg-indigo-100 text-indigo-700">{(org as any).plan?.name ?? '—'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(org as any).usersCount ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{(org as any).lotsCount ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLORS[org.status]}>{STATUS_LABELS[org.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs">
                      <button onClick={() => openChangePlan(org)} className="text-indigo-600 hover:underline font-medium">
                        Cambiar plan
                      </button>
                      {org.status === 'ACTIVE' ? (
                        <button
                          onClick={() => statusMutation.mutate({ id: org.id, active: false })}
                          className="text-red-500 hover:underline font-medium"
                        >
                          Suspender
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMutation.mutate({ id: org.id, active: true })}
                          className="text-green-600 hover:underline font-medium"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear organización */}
      {showCreate && (
        <Modal title="Nueva organización" onClose={() => { setShowCreate(false); setFormError('') }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Frutas del Valle S.A.S."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="frutas-del-valle (se genera automáticamente)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
              <select
                required
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona un plan</option>
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ${p.price}/{p.billingPeriod}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {createMutation.isPending ? 'Creando...' : 'Crear organización'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal cambiar plan */}
      {changePlanOrg && (
        <Modal title={`Cambiar plan: ${changePlanOrg.name}`} onClose={() => setChangePlanOrg(null)} size="sm">
          <div className="p-6 space-y-4">
            <select
              value={newPlanId}
              onChange={(e) => setNewPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setChangePlanOrg(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
              <button
                onClick={() => planMutation.mutate({ id: changePlanOrg.id, planId: newPlanId })}
                disabled={planMutation.isPending || newPlanId === changePlanOrg.planId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {planMutation.isPending ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
