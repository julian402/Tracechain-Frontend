import { useState } from 'react'
import RawMaterialsTab from './RawMaterialsTab'
import FinishedProductsTab from './FinishedProductsTab'
import SuppliersTab from './SuppliersTab'

type Tab = 'raw' | 'finished' | 'suppliers'

const TABS: { key: Tab; label: string }[] = [
  { key: 'raw', label: 'Materias primas' },
  { key: 'finished', label: 'Producto terminado' },
  { key: 'suppliers', label: 'Proveedores' },
]

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('raw')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
        <p className="text-sm text-gray-500 mt-0.5">Materias primas almacenadas, producto terminado y proveedores</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'raw' && <RawMaterialsTab />}
      {tab === 'finished' && <FinishedProductsTab />}
      {tab === 'suppliers' && <SuppliersTab />}
    </div>
  )
}
