import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  activateOrganization,
  suspendOrganization,
  type CreateOrgPayload,
  type UpdateOrgPayload,
} from '../../api/organizations'
import { getPlanCatalog, getPlans } from '../../api/plans'
import { useAuth } from '../../hooks/useAuth'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { notify } from '../../lib/toast'
import { getApiMessage } from '../../lib/apiError'
import { normalizeSlug } from '../../lib/validation'
import type { Organization, Plan, PlanLimitDef } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
}

interface OrgFormState {
  name: string
  slug: string
  planId: string
  customLimits: Record<string, string>
}

const emptyForm: OrgFormState = { name: '', slug: '', planId: '', customLimits: {} }

const normalizeLimits = (limits: Record<string, string>) => {
  return Object.fromEntries(
    Object.entries(limits)
      .filter(([, value]) => value.trim() !== '')
      .map(([key, value]) => [key, Number(value)])
  ) as Record<string, number | null>
}

const getEffectiveLimit = (org: Organization, plans: Plan[], key: string) => {
  const custom = org.customLimits?.[key]
  if (custom !== undefined) return custom
  const plan = plans.find((item) => item.id === org.planId)
  return plan?.limits?.[key] ?? null
}

function LimitsFields({
  limits,
  values,
  onChange,
  selectedPlan,
}: {
  limits: PlanLimitDef[]
  values: Record<string, string>
  onChange: (limits: Record<string, string>) => void
  selectedPlan?: Plan
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Cupos personalizados</h3>
        <p className="text-xs text-gray-500">Déjalo vacío para usar el límite del plan. Usa 0 si quieres bloquear ese recurso.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {limits.map((limit) => (
          <div key={limit.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{limit.label}</label>
            <input
              type="number"
              min={0}
              value={values[limit.key] ?? ''}
              onChange={(event) => onChange({ ...values, [limit.key]: event.target.value })}
              placeholder={selectedPlan?.limits?.[limit.key] == null ? 'Ilimitado por plan' : String(selectedPlan.limits[limit.key])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">{limit.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  const { isSuperAdmin } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [editOrg, setEditOrg] = useState<Organization | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editError, setEditError] = useState('')

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
    enabled: isSuperAdmin,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
  })

  const { data: planCatalog } = useQuery({
    queryKey: ['plan-catalog'],
    queryFn: getPlanCatalog,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['organizations'] })

  const createMutation = useMutation({
    mutationFn: (data: CreateOrgPayload) => createOrganization(data),
    onSuccess: () => { invalidate(); notify.success('Organización creada'); setShowCreate(false); setForm(emptyForm) },
    onError: (e) => { setFormError(getApiMessage(e, 'Error al crear la organización')); notify.apiError(e) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrgPayload }) => updateOrganization(id, data),
    onSuccess: () => { invalidate(); notify.success('Organización actualizada'); setEditOrg(null); setEditError('') },
    onError: (e) => { setEditError(getApiMessage(e, 'Error al actualizar la organización')); notify.apiError(e) },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activateOrganization(id) : suspendOrganization(id),
    onSuccess: () => { invalidate(); notify.success('Estado actualizado') },
    onError: (e) => notify.apiError(e),
  })

  const activePlans = plans.filter((p) => p.isActive)
  const limitDefs = planCatalog?.limits ?? []
  const selectedCreatePlan = activePlans.find((plan) => plan.id === form.planId)
  const selectedEditPlan = activePlans.find((plan) => plan.id === editForm.planId)

  const openCreate = () => {
    setForm(emptyForm)
    setFormError('')
    setShowCreate(true)
  }

  const openEdit = (org: Organization) => {
    setEditOrg(org)
    setEditForm({
      name: org.name,
      slug: org.slug,
      planId: org.planId,
      customLimits: Object.fromEntries(
        Object.entries(org.customLimits ?? {}).map(([key, value]) => [key, value == null ? '' : String(value)])
      ),
    })
    setEditError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const customLimits = normalizeLimits(form.customLimits)
    createMutation.mutate({
      name: form.name,
      slug: form.slug.trim() || undefined,
      planId: form.planId,
      ...(Object.keys(customLimits).length > 0 ? { customLimits } : {}),
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editOrg) return
    setEditError('')
    updateMutation.mutate({
      id: editOrg.id,
      data: {
        name: editForm.name,
        slug: editForm.slug.trim() || undefined,
        planId: editForm.planId,
        customLimits: normalizeLimits(editForm.customLimits),
      },
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de empresas registradas en la plataforma</p>
        </div>
        <button
          onClick={openCreate}
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
                    <p className="text-xs text-gray-400 font-mono">{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color="bg-indigo-100 text-indigo-700">{org.plan?.name ?? '—'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {org.usersCount ?? 0}
                    <span className="text-gray-400"> / {getEffectiveLimit(org, plans, 'users') ?? '∞'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {org.lotsCount ?? 0}
                    <span className="text-gray-400"> / {getEffectiveLimit(org, plans, 'lots') ?? '∞'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLORS[org.status]}>{STATUS_LABELS[org.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs">
                      <button onClick={() => openEdit(org)} className="text-indigo-600 hover:underline font-medium">
                        Editar
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
        <Modal title="Nueva organización" onClose={() => { setShowCreate(false); setFormError('') }} size="lg">
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
                onChange={(e) => setForm({ ...form, slug: normalizeSlug(e.target.value) })}
                placeholder="frutas-del-valle (se genera automáticamente)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-400">Se guarda en minúsculas y solo permite letras, números y guiones.</p>
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
            {limitDefs.length > 0 && (
              <LimitsFields
                limits={limitDefs}
                values={form.customLimits}
                onChange={(customLimits) => setForm({ ...form, customLimits })}
                selectedPlan={selectedCreatePlan}
              />
            )}
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

      {/* Modal editar organización */}
      {editOrg && (
        <Modal title={`Editar organización: ${editOrg.name}`} onClose={() => setEditOrg(null)} size="lg">
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{editError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: normalizeSlug(e.target.value) })}
                  pattern="^[a-z0-9-]+$"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="mt-1 text-xs text-gray-400">Se guarda en minúsculas y solo permite letras, números y guiones.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan base *</label>
              <select
                required
                value={editForm.planId}
                onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {activePlans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ${p.price}/{p.billingPeriod}</option>
                ))}
              </select>
            </div>
            {limitDefs.length > 0 && (
              <LimitsFields
                limits={limitDefs}
                values={editForm.customLimits}
                onChange={(customLimits) => setEditForm({ ...editForm, customLimits })}
                selectedPlan={selectedEditPlan}
              />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditOrg(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
