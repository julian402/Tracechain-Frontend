import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyOrganization, updateMyOrganization } from '../../api/organizations'
import { usePermissions } from '../../hooks/usePermissions'
import { PLAN_LABELS } from '../../lib/constants'
import { notify } from '../../lib/toast'
import { getApiMessage } from '../../lib/apiError'

interface LimitEntry   { key: string; label: string; max: number | null; used: number | null; reached: boolean }
interface FeatureEntry { key: string; label: string; enabled: boolean }

function UsageBar({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct     = max == null ? 0 : Math.min((used / max) * 100, 100)
  const danger  = max != null && used >= max * 0.9
  const warn    = max != null && used >= max * 0.7
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-sm font-semibold ${danger ? 'text-red-600' : warn ? 'text-yellow-600' : 'text-gray-800'}`}>
          {used}{max != null ? ` / ${max}` : ''}
        </span>
      </div>
      {max != null && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : warn ? 'bg-yellow-400' : 'bg-green-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function OrgPage() {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const [editing, setEditing] = useState(false)
  const [form, setForm]   = useState({ name: '', slug: '' })
  const [formError, setFormError] = useState('')

  const { data: myOrg, isLoading } = useQuery({
    queryKey: ['my-org'],
    queryFn: getMyOrganization,
    staleTime: 0,
    refetchOnMount: true,
  })

  const updateMutation = useMutation({
    mutationFn: updateMyOrganization,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['my-org'] })
      setEditing(false)
      setFormError('')
      notify.success('Organización actualizada')
      // Actualiza el nombre en el sidebar si cambió
      const stored = localStorage.getItem('organization')
      if (stored) {
        try {
          const org = JSON.parse(stored)
          localStorage.setItem('organization', JSON.stringify({ ...org, name: updated.name, slug: updated.slug }))
        } catch { /* ignore */ }
      }
    },
    onError: (e: unknown) => setFormError(getApiMessage(e, 'Error al guardar')),
  })

  const openEdit = () => {
    setForm({ name: myOrg?.name ?? '', slug: myOrg?.slug ?? '' })
    setFormError('')
    setEditing(true)
  }

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  const plan        = myOrg?.plan
  const limitsArr   = ((myOrg as any)?.limits  ?? []) as LimitEntry[]
  const featuresArr = ((myOrg as any)?.features ?? []) as FeatureEntry[]
  const canEdit     = can('users:manage')

  return (
    <div className="p-6 space-y-2">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Mi organización</h1>
        <p className="text-sm text-gray-500 mt-0.5">Información y plan de tu organización</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Columna izquierda: info de la org ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Datos de la organización</h2>
            {canEdit && !editing && (
              <button onClick={openEdit} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <form
              onSubmit={e => { e.preventDefault(); updateMutation.mutate(form) }}
              className="space-y-4"
            >
              {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Slug <span className="text-gray-400 font-normal">(solo letras, números y guiones)</span>
                </label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  pattern="^[a-z0-9-]+$"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">Nombre</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{myOrg?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Slug</dt>
                <dd className="mt-0.5 text-sm text-gray-700 font-mono">{myOrg?.slug ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Estado</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    myOrg?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {myOrg?.status === 'ACTIVE' ? 'Activa' : 'Suspendida'}
                  </span>
                </dd>
              </div>
              {myOrg?.createdAt && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Creada el</dt>
                  <dd className="mt-0.5 text-sm text-gray-700">
                    {new Date(myOrg.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* ── Columna derecha: plan + uso + CTA ── */}
        <div className="space-y-4">
          {/* Plan card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Plan actual</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {plan ? (PLAN_LABELS[plan.key] ?? plan.name) : '—'}
                </span>
                {plan && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    plan.key === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {plan.key}
                  </span>
                )}
              </div>
              {plan && plan.price > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">
                  {plan.currency} {plan.price.toLocaleString('es-CO')} / {plan.billingPeriod === 'MONTHLY' ? 'mes' : plan.billingPeriod === 'YEARLY' ? 'año' : 'único'}
                </p>
              )}
            </div>

            {/* Uso */}
            {limitsArr.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uso</p>
                {limitsArr.map(l => <UsageBar key={l.key} label={l.label} used={l.used ?? 0} max={l.max} />)}
              </div>
            )}

            {/* Features */}
            {featuresArr.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Funcionalidades</p>
                {featuresArr.map(f => (
                  <div key={f.key} className={`flex items-center gap-2 ${f.enabled ? '' : 'opacity-45'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      f.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {f.enabled ? '✓' : '✕'}
                    </span>
                    <span className={`text-xs ${f.enabled ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{f.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA upgrade */}
          {plan?.key === 'FREE' && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <p className="text-sm font-bold text-gray-900 mb-0.5">¿Listo para crecer?</p>
              <p className="text-xs text-gray-600 mb-3">
                Con el plan Pro: hasta 1,000 lotes, 50 usuarios y todas las funcionalidades desbloqueadas.
              </p>
              <a
                href="mailto:soporte@tracechain.co?subject=Upgrade%20a%20Pro"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Contactar para mejorar plan
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
