import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInspectionById, updateInspectionStatus } from '../../api/inspections'
import { usePermissions } from '../../hooks/usePermissions'
import { notify } from '../../lib/toast'
import { Badge } from '../../components/ui/Badge'
import {
  VISIT_TYPE_LABELS, FINDING_TYPE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS,
  VISIT_STATUS_LABELS, VISIT_STATUS_COLORS
} from '../../lib/constants'
import type { VisitStatus } from '../../types'

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('es-CO') : '—')

export default function InspectionDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const { can } = usePermissions()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => getInspectionById(id),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status: VisitStatus) => updateInspectionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] })
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
      notify.success('Estado actualizado')
    },
    onError: (error) => notify.apiError(error),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Inspección no encontrada.</p>
        <Link to="/inspections" className="text-green-600 hover:underline text-sm">← Volver a inspecciones</Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link to="/inspections" className="text-sm text-gray-500 hover:underline">← Volver a inspecciones</Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{VISIT_TYPE_LABELS[inspection.visitType]}</h1>
            <Badge color={VISIT_STATUS_COLORS[inspection.status] ?? 'bg-gray-100 text-gray-700'}>
              {VISIT_STATUS_LABELS[inspection.status] ?? inspection.status}
            </Badge>
          </div>
          {can('inspections:update') && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Estado:</label>
              <select
                value={inspection.status}
                disabled={statusMutation.isPending}
                onChange={(e) => statusMutation.mutate(e.target.value as VisitStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Object.entries(VISIT_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Datos generales</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Field label="Entidad auditora" value={inspection.auditorEntity} />
          <Field label="Auditor" value={inspection.auditorName} />
          <Field label="Fecha de visita" value={fmtDate(inspection.visitDate)} />
          <Field label="N° acta / referencia" value={inspection.actReference || '—'} />
          <Field label="Proceso auditado" value={inspection.auditedProcess || '—'} />
          <Field label="Lote" value={inspection.lot ? `${inspection.lot.code} — ${inspection.lot.name}` : '—'} />
          <Field label="Responsable" value={inspection.responsible?.name || 'Sin asignar'} />
          <Field label="Fecha compromiso" value={fmtDate(inspection.commitmentDate)} />
          <Field label="Registrado por" value={inspection.createdBy?.name || '—'} />
          <Field label="Creada" value={fmtDate(inspection.createdAt)} />
        </dl>
        {inspection.objective && (
          <div className="mt-4 text-sm">
            <p className="text-gray-500 mb-1">Objetivo</p>
            <p className="text-gray-800">{inspection.objective}</p>
          </div>
        )}
        {inspection.correctiveActions && (
          <div className="mt-4 text-sm">
            <p className="text-gray-500 mb-1">Acciones correctivas propuestas</p>
            <p className="text-gray-800">{inspection.correctiveActions}</p>
          </div>
        )}
      </div>

      {/* Hallazgos / observaciones */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Hallazgos y observaciones ({inspection.findings?.length ?? 0})
        </h2>
        {inspection.findings?.length ? (
          <div className="space-y-3">
            {inspection.findings.map((f) => (
              <div key={f.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge color={PRIORITY_COLORS[f.priority]}>{PRIORITY_LABELS[f.priority]}</Badge>
                  <span className="text-xs text-gray-500">{FINDING_TYPE_LABELS[f.type]}</span>
                  {f.deadline && (
                    <span className="text-xs text-gray-400 ml-auto">Límite: {fmtDate(f.deadline)}</span>
                  )}
                </div>
                <p className="text-sm text-gray-800">{f.description}</p>
                {f.criteria && <p className="text-xs text-gray-500 mt-1">Criterio: {f.criteria}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  Registrado por {inspection.createdBy?.name ?? '—'}
                  {f.createdAt ? ` · ${fmtDate(f.createdAt)}` : ''}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sin hallazgos registrados.</p>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  )
}
