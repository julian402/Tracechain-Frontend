import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getLots } from '../../api/lots'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { LOT_STATUS_COLORS, LOT_STATUS_LABELS } from '../../lib/constants'

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('es-CO') : '—')

export default function FinishedProductsTab() {
  const [page] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['lots', 'inventory', page],
    queryFn: () => getLots({ page, limit: 50 }),
  })
  const lots = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Producto terminado que comercializa la empresa (lotes). Se crean desde Lotes, enlazando las materias primas usadas.</p>
        <Link to="/lots" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          Ir a Lotes
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-gray-400">Cargando…</div>
        ) : lots.length === 0 ? (
          <EmptyState message="No hay productos terminados registrados" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Código', 'Nombre', 'Cantidad', 'Estado', 'Vencimiento', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lots.map((lot) => (
                <tr key={lot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{lot.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{lot.name}</td>
                  <td className="px-4 py-3 text-gray-600">{lot.quantity} {lot.unit}</td>
                  <td className="px-4 py-3">
                    <Badge color={LOT_STATUS_COLORS[lot.status] ?? 'bg-gray-100 text-gray-700'}>
                      {LOT_STATUS_LABELS[lot.status] ?? lot.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(lot.expirationDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/lots/${lot.id}`} className="text-green-600 hover:underline text-sm font-medium">Ver detalle</Link>
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
