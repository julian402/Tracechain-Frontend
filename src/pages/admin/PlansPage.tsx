import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { notify } from '../../lib/toast'
import { getApiMessage } from '../../lib/apiError'
import {
  getPlans,
  getPlanCatalog,
  createPlan,
  updatePlan,
  deletePlan,
  type PlanPayload,
} from '../../api/plans'
import type { Plan, PlanCatalog, BillingPeriod } from '../../types'

const BILLING_LABELS: Record<BillingPeriod, string> = {
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
  ONE_TIME: 'Pago único',
}

interface FormState {
  key: string
  name: string
  description: string
  price: number
  currency: string
  billingPeriod: BillingPeriod
  isActive: boolean
  sortOrder: number
  limits: Record<string, number | null>
  features: Record<string, boolean>
  stripeProductId: string
  stripePriceId: string
}

const emptyForm = (catalog?: PlanCatalog): FormState => ({
  key: '',
  name: '',
  description: '',
  price: 0,
  currency: 'USD',
  billingPeriod: 'MONTHLY',
  isActive: true,
  sortOrder: 0,
  limits: Object.fromEntries((catalog?.limits ?? []).map((l) => [l.key, l.default])),
  features: Object.fromEntries((catalog?.features ?? []).map((f) => [f.key, false])),
  stripeProductId: '',
  stripePriceId: '',
})

const fromPlan = (plan: Plan, catalog?: PlanCatalog): FormState => ({
  key: plan.key,
  name: plan.name,
  description: plan.description ?? '',
  price: plan.price,
  currency: plan.currency,
  billingPeriod: plan.billingPeriod,
  isActive: plan.isActive,
  sortOrder: plan.sortOrder,
  limits: {
    ...Object.fromEntries((catalog?.limits ?? []).map((l) => [l.key, l.default])),
    ...plan.limits,
  },
  features: {
    ...Object.fromEntries((catalog?.features ?? []).map((f) => [f.key, false])),
    ...plan.features,
  },
  stripeProductId: plan.stripeProductId ?? '',
  stripePriceId: plan.stripePriceId ?? '',
})

const toPayload = (form: FormState): PlanPayload => ({
  key: form.key.trim().toUpperCase(),
  name: form.name.trim(),
  description: form.description.trim() || null,
  price: Number(form.price) || 0,
  currency: form.currency.trim().toUpperCase() || 'USD',
  billingPeriod: form.billingPeriod,
  isActive: form.isActive,
  sortOrder: Number(form.sortOrder) || 0,
  limits: form.limits,
  features: form.features,
  stripeProductId: form.stripeProductId.trim() || null,
  stripePriceId: form.stripePriceId.trim() || null,
})

const formatLimit = (value: number | null | undefined) =>
  value == null || value < 0 ? 'Ilimitado' : String(value)

export default function PlansPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Plan | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null)

  const { data: catalog } = useQuery({ queryKey: ['plan-catalog'], queryFn: getPlanCatalog })
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['plans'], queryFn: getPlans })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['plans'] })

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => { invalidate(); notify.success('Plan creado'); closeForm() },
    onError: (error) => { setFormError(getApiMessage(error, 'No se pudo crear el plan')); notify.apiError(error) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlanPayload> }) => updatePlan(id, data),
    onSuccess: () => { invalidate(); notify.success('Plan actualizado'); closeForm() },
    onError: (error) => { setFormError(getApiMessage(error, 'No se pudo actualizar el plan')); notify.apiError(error) },
  })
  const deleteMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => { invalidate(); notify.success('Plan eliminado'); setConfirmDelete(null) },
    onError: (error) => { notify.apiError(error); setConfirmDelete(null) },
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm(catalog))
    setFormError('')
    setShowForm(true)
  }
  const openEdit = (plan: Plan) => {
    setEditing(plan)
    setForm(fromPlan(plan, catalog))
    setFormError('')
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const payload = toPayload(form)
    if (editing) {
      const { key: _key, ...data } = payload
      updateMutation.mutate({ id: editing.id, data })
    } else {
      createMutation.mutate(payload)
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const limitDefs = catalog?.limits ?? []
  const featureDefs = catalog?.features ?? []

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price),
    [plans],
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Planes</h1>
          <p className="text-sm text-gray-500">Define límites, funciones y precios de cada plan.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
        >
          Nuevo plan
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando planes…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <Badge color={plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{plan.key}</p>
                </div>
                <p className="text-lg font-bold text-gray-900 whitespace-nowrap">
                  ${plan.price}
                  <span className="text-xs font-normal text-gray-400"> /{BILLING_LABELS[plan.billingPeriod]}</span>
                </p>
              </div>

              {plan.description && <p className="text-sm text-gray-500 mt-2">{plan.description}</p>}

              <div className="mt-4 space-y-1.5 text-sm flex-1">
                {limitDefs.map((l) => (
                  <div key={l.key} className="flex justify-between text-gray-600">
                    <span>{l.label}</span>
                    <span className="font-medium text-gray-900">{formatLimit(plan.limits[l.key])}</span>
                  </div>
                ))}
                {featureDefs.map((f) => (
                  <div key={f.key} className="flex justify-between text-gray-600">
                    <span>{f.label}</span>
                    <span className={plan.features[f.key] ? 'text-green-600' : 'text-gray-300'}>
                      {plan.features[f.key] ? '✓' : '—'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(plan)} className="text-sm text-green-700 hover:underline">Editar</button>
                <button onClick={() => setConfirmDelete(plan)} className="text-sm text-red-600 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? `Editar plan: ${editing.name}` : 'Nuevo plan'} onClose={closeForm} size="lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{formError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-gray-600">Clave</span>
                <input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  disabled={!!editing}
                  placeholder="EJ: STARTER"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase disabled:bg-gray-100"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Nombre</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm text-gray-600">Descripción</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-sm text-gray-600">Precio</span>
                <input
                  type="number" min={0} step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Moneda</span>
                <input
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  maxLength={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Facturación</span>
                <select
                  value={form.billingPeriod}
                  onChange={(e) => setForm({ ...form, billingPeriod: e.target.value as BillingPeriod })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {(catalog?.billingPeriods ?? ['MONTHLY', 'YEARLY', 'ONE_TIME']).map((p) => (
                    <option key={p} value={p}>{BILLING_LABELS[p]}</option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Límites <span className="font-normal text-gray-400">(vacío = ilimitado)</span></p>
              <div className="grid grid-cols-2 gap-3">
                {limitDefs.map((l) => (
                  <label key={l.key} className="block" title={l.description}>
                    <span className="text-sm text-gray-600">{l.label}</span>
                    <input
                      type="number" min={0}
                      value={form.limits[l.key] ?? ''}
                      onChange={(e) => setForm({
                        ...form,
                        limits: { ...form.limits, [l.key]: e.target.value === '' ? null : Number(e.target.value) },
                      })}
                      placeholder="Ilimitado"
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Funciones</p>
              <div className="space-y-2">
                {featureDefs.map((f) => (
                  <label key={f.key} className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-sm text-gray-700" title={f.description}>{f.label}</span>
                    <input
                      type="checkbox"
                      checked={!!form.features[f.key]}
                      onChange={(e) => setForm({ ...form, features: { ...form.features, [f.key]: e.target.checked } })}
                      className="h-4 w-4 accent-green-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500">Opciones avanzadas (Stripe / orden)</summary>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="block">
                  <span className="text-sm text-gray-600">Orden</span>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 accent-green-600"
                  />
                  <span className="text-sm text-gray-700">Plan activo</span>
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Stripe Product ID</span>
                  <input
                    value={form.stripeProductId}
                    onChange={(e) => setForm({ ...form, stripeProductId: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Stripe Price ID</span>
                  <input
                    value={form.stripePriceId}
                    onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </label>
              </div>
            </details>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={closeForm} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Eliminar plan" onClose={() => setConfirmDelete(null)} size="sm" sheet={false}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              ¿Eliminar el plan <strong>{confirmDelete.name}</strong>? No se puede eliminar si hay organizaciones que lo usan.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
