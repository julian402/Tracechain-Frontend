import { useState } from 'react'
import { downloadLotsCSV, downloadLotsPDF, downloadMovementsCSV } from '../../api/reports'
import { notify } from '../../lib/toast'

interface ReportCard {
  title: string
  description: string
  format: string
  color: string
  action: () => Promise<void>
}

const reports: ReportCard[] = [
  {
    title: 'Lotes — CSV',
    description: 'Exporta todos los lotes con sus datos completos en formato CSV para Excel o Google Sheets.',
    format: 'CSV',
    color: 'bg-green-50 border-green-200',
    action: downloadLotsCSV,
  },
  {
    title: 'Lotes — PDF',
    description: 'Genera un reporte PDF con resumen ejecutivo y detalle de todos los lotes registrados.',
    format: 'PDF',
    color: 'bg-red-50 border-red-200',
    action: downloadLotsPDF,
  },
  {
    title: 'Movimientos — CSV',
    description: 'Exporta el historial completo de movimientos con lote, tipo, origen y destino.',
    format: 'CSV',
    color: 'bg-blue-50 border-blue-200',
    action: downloadMovementsCSV,
  },
]

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleDownload = async (report: ReportCard) => {
    setLoading(report.title)
    try {
      await report.action()
      notify.success(`${report.title} descargado`)
    } catch (e) {
      notify.apiError(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Descarga exportaciones de datos en CSV o PDF</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <div key={report.title} className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${report.color}`}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-gray-600">{report.format}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{report.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{report.description}</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(report)}
              disabled={loading === report.title}
              className="shrink-0 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading === report.title ? 'Descargando...' : 'Descargar'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500">
          Los reportes incluyen todos los datos disponibles hasta el momento de la descarga.
          Los archivos CSV son compatibles con Excel, Google Sheets y LibreOffice Calc.
        </p>
      </div>
    </div>
  )
}
