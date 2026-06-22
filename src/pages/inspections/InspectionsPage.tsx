import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createInspection, getInspections, type Finding, type CreateVisitPayload } from '../../api/inspections'
import { getLots } from '../../api/lots'
import { getUsers } from '../../api/users'
import type { VisitStatus } from '../../types'
import { notify } from '../../lib/toast'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  VISIT_TYPE_LABELS, FINDING_TYPE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS,
  VISIT_STATUS_LABELS, VISIT_STATUS_COLORS
} from '../../lib/constants'

const steps = ['Datos generales', 'Hallazgos', 'Compromisos', 'Envío']

const emptyFinding: Finding = {
  type: 'NO_CONFORMIDAD',
  priority: 'ALTA',
  criteria: '',
  description: '',
  deadline: ''
}

const initialForm: CreateVisitPayload = {
  visitType: 'AUDITORIA',
  visitDate: '',
  actReference: '',
  auditorEntity: '',
  auditorName: '',
  auditedProcess: '',
  objective: '',
  responsibleId: '',
  commitmentDate: '',
  correctiveActions: '',
  lotId: '',
  findings: [{ ...emptyFinding }]
}


export default function InspectionsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<CreateVisitPayload>(initialForm)
  const [success, setSuccess] = useState(false)
  const [statusFilter, setStatusFilter] = useState<VisitStatus | ''>('')
  const [mine, setMine] = useState(false)

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections', statusFilter, mine],
    queryFn: () => getInspections({ status: statusFilter || undefined, mine })
  })

  const { data: lotsData } = useQuery({
    queryKey: ['lots'],
    queryFn: () => getLots({ limit: 200 }),
  })
  const lots = lotsData?.data ?? []

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const mutation = useMutation({
    mutationFn: createInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
      queryClient.invalidateQueries({ queryKey: ['audit'] })
      setSuccess(true)
      notify.inspectionCreated()
    },
    onError: (error) => notify.apiError(error),
  })

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, 3))
  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const addFinding = () => {
    setForm({ ...form, findings: [...form.findings, { ...emptyFinding }] })
  }

  const removeFinding = (index: number) => {
    setForm({ ...form, findings: form.findings.filter((_, i) => i !== index) })
  }

  const updateFinding = (index: number, field: keyof Finding, value: string) => {
    const updated = form.findings.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    )
    setForm({ ...form, findings: updated })
  }

  const handleSubmit = () => {
    const payload = {
      ...form,
      lotId: form.lotId || undefined,
      actReference: form.actReference || undefined,
      auditedProcess: form.auditedProcess || undefined,
      objective: form.objective || undefined,
      responsibleId: form.responsibleId || undefined,
      commitmentDate: form.commitmentDate || undefined,
      correctiveActions: form.correctiveActions || undefined,
      findings: form.findings.map(f => ({
        ...f,
        criteria: f.criteria || undefined,
        deadline: f.deadline || undefined
      }))
    }
    mutation.mutate(payload)
  }

  const handleClose = () => {
    setShowForm(false)
    setCurrentStep(0)
    setForm(initialForm)
    setSuccess(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inspecciones y hallazgos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registro de visitas de auditoría, interventoría e inspección</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Nueva inspección
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VisitStatus | '')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(VISIT_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => setMine(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Solo mis pendientes
        </label>
      </div>

      {/* Lista de inspecciones */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Tipo', 'Estado', 'Entidad auditora', 'Responsable', 'Lote', 'Hallazgos', 'Fecha', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)}
            </tbody>
          </table>
        ) : inspections.length === 0 ? (
          <EmptyState message="No hay inspecciones registradas" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Entidad auditora</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Responsable</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lote</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hallazgos</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Badge color="bg-blue-100 text-blue-700">
                      {VISIT_TYPE_LABELS[inspection.visitType]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={VISIT_STATUS_COLORS[inspection.status] ?? 'bg-gray-100 text-gray-700'}>
                      {VISIT_STATUS_LABELS[inspection.status] ?? inspection.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{inspection.auditorEntity}</td>
                  <td className="px-4 py-3 text-gray-600">{inspection.responsible?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {inspection.lot?.code ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {inspection.findings?.length ?? 0} hallazgos
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(inspection.visitDate).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/inspections/${inspection.id}`} className="text-green-600 hover:underline text-sm font-medium">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal formulario 4 pasos */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Registro de inspección</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              {/* Steps */}
              {!success && (
                <div className="flex items-center gap-2">
                  {steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                        i < currentStep ? 'bg-green-600 text-white' :
                        i === currentStep ? 'bg-green-600 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {i < currentStep ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs hidden sm:block ${i === currentStep ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                        {step}
                      </span>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inspección registrada</h3>
                  <p className="text-sm text-gray-500 mb-6">Los hallazgos han sido enviados a la bitácora de auditoría.</p>
                  <button
                    onClick={handleClose}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  {/* Paso 1 — Datos generales */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Datos generales de la visita</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de visita *</label>
                          <select
                            value={form.visitType}
                            onChange={(e) => setForm({ ...form, visitType: e.target.value as CreateVisitPayload['visitType'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="AUDITORIA">Auditoría</option>
                            <option value="INTERVENTORIA">Interventoría</option>
                            <option value="INSPECCION">Inspección</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de visita *</label>
                          <input
                            type="date"
                            value={form.visitDate}
                            onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Entidad auditora *</label>
                          <input
                            value={form.auditorEntity}
                            onChange={(e) => setForm({ ...form, auditorEntity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="ICA, INVIMA..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del auditor *</label>
                          <input
                            value={form.auditorName}
                            onChange={(e) => setForm({ ...form, auditorName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">N° acta / referencia</label>
                          <input
                            value={form.actReference}
                            onChange={(e) => setForm({ ...form, actReference: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="ACT-2026-001"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proceso auditado</label>
                          <input
                            value={form.auditedProcess}
                            onChange={(e) => setForm({ ...form, auditedProcess: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Almacén, Producción..."
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lote inspeccionado</label>
                          <select
                            value={form.lotId}
                            onChange={(e) => setForm({ ...form, lotId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Sin lote específico</option>
                            {lots.map((lot) => (
                              <option key={lot.id} value={lot.id}>{lot.name} — {lot.code}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo de la visita</label>
                          <textarea
                            value={form.objective}
                            onChange={(e) => setForm({ ...form, objective: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Paso 2 — Hallazgos */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Hallazgos / novedades</h3>
                        <button
                          onClick={addFinding}
                          className="text-sm text-green-600 font-medium hover:text-green-700"
                        >
                          + Agregar hallazgo
                        </button>
                      </div>
                      {form.findings.map((finding, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Hallazgo #{index + 1}</span>
                            {form.findings.length > 1 && (
                              <button
                                onClick={() => removeFinding(index)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo *</label>
                              <select
                                value={finding.type}
                                onChange={(e) => updateFinding(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                {Object.entries(FINDING_TYPE_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Prioridad *</label>
                              <select
                                value={finding.priority}
                                onChange={(e) => updateFinding(index, 'priority', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Criterio / norma</label>
                              <input
                                value={finding.criteria}
                                onChange={(e) => updateFinding(index, 'criteria', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="HACCP 4.3.2"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha límite respuesta</label>
                              <input
                                type="date"
                                value={finding.deadline}
                                onChange={(e) => updateFinding(index, 'deadline', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción *</label>
                              <textarea
                                value={finding.description}
                                onChange={(e) => updateFinding(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge color={PRIORITY_COLORS[finding.priority]}>
                              {PRIORITY_LABELS[finding.priority]}
                            </Badge>
                            <span className="text-xs text-gray-500">{FINDING_TYPE_LABELS[finding.type]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Paso 3 — Compromisos */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Plan de acción / compromisos</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsable (usuario de la organización)</label>
                        <select
                          value={form.responsibleId}
                          onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Sin responsable asignado</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">El responsable recibirá un correo con el detalle de la inspección.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha compromiso</label>
                        <input
                          type="date"
                          value={form.commitmentDate}
                          onChange={(e) => setForm({ ...form, commitmentDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Acciones correctivas propuestas</label>
                        <textarea
                          value={form.correctiveActions}
                          onChange={(e) => setForm({ ...form, correctiveActions: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Paso 4 — Resumen y envío */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Resumen y envío</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tipo de visita</span>
                          <span className="font-medium">{VISIT_TYPE_LABELS[form.visitType]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fecha</span>
                          <span className="font-medium">{form.visitDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Entidad auditora</span>
                          <span className="font-medium">{form.auditorEntity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Auditor</span>
                          <span className="font-medium">{form.auditorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Hallazgos</span>
                          <span className="font-medium">{form.findings.length}</span>
                        </div>
                        {form.responsibleId && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Responsable</span>
                            <span className="font-medium">{users.find((u) => u.id === form.responsibleId)?.name ?? '—'}</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                        Al enviar, cada hallazgo se registrará automáticamente en la bitácora de auditoría.
                      </div>
                      {mutation.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                          Error al registrar la inspección. Verifica los datos.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botones navegación */}
                  <div className="flex gap-3 mt-6">
                    {currentStep > 0 && (
                      <button
                        onClick={handleBack}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ← Anterior
                      </button>
                    )}
                    {currentStep < 3 ? (
                      <button
                        onClick={handleNext}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {mutation.isPending ? 'Enviando...' : 'Guardar y enviar →'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
