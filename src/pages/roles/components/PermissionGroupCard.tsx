import { PERMISSION_MODULE_LABELS } from '../../../lib/constants'
import type { Permission } from '../../../types'

interface PermissionGroupCardProps {
  module: string
  permissions: Permission[]
  selected: Set<string>
  onTogglePermission: (key: string) => void
  onToggleModule: (keys: string[], checked: boolean) => void
}

export function PermissionGroupCard({
  module,
  permissions,
  selected,
  onTogglePermission,
  onToggleModule,
}: PermissionGroupCardProps) {
  const selectedCount = permissions.filter((permission) => selected.has(permission.key)).length
  const allSelected = permissions.length > 0 && selectedCount === permissions.length

  return (
    <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <label className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 cursor-pointer">
        <span className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => onToggleModule(permissions.map((permission) => permission.key), event.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="font-semibold text-sm text-gray-900 truncate">
            {PERMISSION_MODULE_LABELS[module] ?? module}
          </span>
        </span>
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
          {selectedCount}/{permissions.length}
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3">
        {permissions.map((permission) => (
          <label
            key={permission.key}
            className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-green-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.has(permission.key)}
              onChange={() => onTogglePermission(permission.key)}
              className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-xs text-gray-700 leading-5">{permission.label}</span>
          </label>
        ))}
      </div>
    </section>
  )
}
