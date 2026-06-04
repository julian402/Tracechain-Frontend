import { useMemo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { EmptyState } from '../../../components/ui/EmptyState'
import type { PermissionGroup } from '../../../api/permissions'
import type { DynamicRole } from '../../../types'
import { PermissionGroupCard } from './PermissionGroupCard'

interface RolePermissionsModalProps {
  role: DynamicRole
  groups: PermissionGroup[]
  selected: Set<string>
  pending: boolean
  onSelectedChange: (selected: Set<string>) => void
  onClose: () => void
  onSave: () => void
}

export function RolePermissionsModal({
  role,
  groups,
  selected,
  pending,
  onSelectedChange,
  onClose,
  onSave,
}: RolePermissionsModalProps) {
  const [search, setSearch] = useState('')

  const totalPermissions = groups.reduce((total, group) => total + group.permissions.length, 0)
  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return groups

    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => {
          return (
            permission.label.toLowerCase().includes(term) ||
            permission.key.toLowerCase().includes(term) ||
            group.module.toLowerCase().includes(term)
          )
        }),
      }))
      .filter((group) => group.permissions.length > 0)
  }, [groups, search])

  const togglePermission = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSelectedChange(next)
  }

  const toggleModule = (keys: string[], checked: boolean) => {
    const next = new Set(selected)
    keys.forEach((key) => {
      if (checked) next.add(key)
      else next.delete(key)
    })
    onSelectedChange(next)
  }

  const selectAll = () => {
    onSelectedChange(new Set(groups.flatMap((group) => group.permissions.map((permission) => permission.key))))
  }

  return (
    <Modal title={`Permisos - ${role.name}`} onClose={onClose} size="2xl">
      <div className="flex max-h-[calc(90vh-81px)] flex-col">
        <div className="p-5 border-b border-gray-100 space-y-4">
          {role.isSystem && role.name === 'ORG_ADMIN' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Este rol debe conservar siempre la gestión de roles y usuarios.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar permiso o módulo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Seleccionar todo
              </button>
              <button
                type="button"
                onClick={() => onSelectedChange(new Set())}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{selected.size} de {totalPermissions} permisos seleccionados</span>
            <span>{groups.length} módulos</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {filteredGroups.length === 0 ? (
            <EmptyState message="No hay permisos que coincidan con la búsqueda" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredGroups.map((group) => (
                <PermissionGroupCard
                  key={group.module}
                  module={group.module}
                  permissions={group.permissions}
                  selected={selected}
                  onTogglePermission={togglePermission}
                  onToggleModule={toggleModule}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={pending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
          >
            {pending ? 'Guardando...' : 'Guardar permisos'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
