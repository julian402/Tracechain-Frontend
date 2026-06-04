import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditLogs, searchAuditLogs } from '../../api/audit'
import type { AuditLog } from '../../types'

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  VISITA_EXTERNA: 'bg-blue-100 text-blue-700',
  HALLAZGO_NO_CONFORMIDAD: 'bg-red-100 text-red-700',
  HALLAZGO_OBSERVACION: 'bg-yellow-100 text-yellow-700',
  HALLAZGO_OPORTUNIDAD: 'bg-purple-100 text-purple-700',
}

export default function AuditPage() {
  const [action, setAction] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', action, fromDate, toDate, isFiltering],
    queryFn: () =>
      isFiltering
        ? searchAuditLogs({
            action: action || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined
          })
        : getAuditLogs()
  })

  const handleFilter = () => setIsFiltering(true)

  const handleClear = () => {
    setAction('')
    setFromDate('')
    setToDate('')
    setIsFiltering(false)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Bitácora de auditoría</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Acción</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todas</option>
              <option value="CREATE">Creación</option>
              <option value="VISITA_EXTERNA">Visita externa</option>
              <option value="HALLAZGO_NO_CONFORMIDAD">No conformidad</option>
              <option value="HALLAZGO_OBSERVACION">Observación</option>
              <option value="HALLAZGO_OPORTUNIDAD">Oportunidad</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Filtrar
          </button>
          {isFiltering && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Cargando bitácora...</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No hay registros en la bitácora</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Entidad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lote</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log: AuditLog) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.entity}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {log.lot?.code ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}