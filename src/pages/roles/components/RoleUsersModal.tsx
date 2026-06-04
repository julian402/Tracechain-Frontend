import { useMemo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { EmptyState } from '../../../components/ui/EmptyState'
import type { DynamicRole, User } from '../../../types'

interface RoleUsersModalProps {
  role: DynamicRole
  users: User[]
  organizationId: string
  selected: Set<string>
  pending: boolean
  onSelectedChange: (selected: Set<string>) => void
  onClose: () => void
  onSave: () => void
}

export function RoleUsersModal({
  role,
  users,
  organizationId,
  selected,
  pending,
  onSelectedChange,
  onClose,
  onSave,
}: RoleUsersModalProps) {
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.role?.name ?? '').toLowerCase().includes(term) ||
        (user.organization?.name ?? '').toLowerCase().includes(term)
      )
    })
  }, [search, users])

  const toggleUser = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectedChange(next)
  }

  const selectableUsers = filteredUsers.filter((user) => user.organizationId === organizationId)
  const visibleIds = selectableUsers.map((user) => user.id)
  const visibleSelected = visibleIds.filter((id) => selected.has(id)).length
  const allVisibleSelected = visibleIds.length > 0 && visibleSelected === visibleIds.length

  const toggleVisibleUsers = () => {
    const next = new Set(selected)
    visibleIds.forEach((id) => {
      if (allVisibleSelected) next.delete(id)
      else next.add(id)
    })
    onSelectedChange(next)
  }

  return (
    <Modal title={`Usuarios - ${role.name}`} onClose={onClose} size="xl">
      <div className="flex max-h-[calc(90vh-81px)] flex-col">
        <div className="p-5 border-b border-gray-100 space-y-4">
          <p className="text-sm text-gray-500">
            Asigna usuarios a este rol. Puedes ver todos los usuarios de la plataforma; solo los de la organización del rol se pueden seleccionar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={toggleVisibleUsers}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
            </button>
          </div>
          <div className="text-xs text-gray-500">{selected.size} usuarios seleccionados</div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {filteredUsers.length === 0 ? (
            <EmptyState message="No hay usuarios disponibles" />
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const selectable = user.organizationId === organizationId
                return (
                  <label
                    key={user.id}
                    className={[
                      'flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3',
                      selectable ? 'cursor-pointer hover:border-green-200 hover:bg-green-50' : 'opacity-60',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        disabled={!selectable}
                        onChange={() => toggleUser(user.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 truncate">{user.name}</span>
                        <span className="block text-xs text-gray-500 truncate">{user.email}</span>
                      </span>
                    </span>
                    <span className="text-right text-xs text-gray-500 whitespace-nowrap">
                      <span className="block">{user.role?.name ?? 'Sin rol'}</span>
                      <span className="block text-gray-400">{user.organization?.name ?? 'Plataforma'}</span>
                    </span>
                  </label>
                )
              })}
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
            {pending ? 'Guardando...' : 'Guardar usuarios'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
