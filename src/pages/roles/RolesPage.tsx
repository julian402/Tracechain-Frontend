import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoles, createRole, updateRole, updateRolePermissions, deleteRole } from '../../api/roles'
import { getPermissions, type PermissionGroup } from '../../api/permissions'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { notify } from '../../lib/toast'
import { getApiMessage } from '../../lib/apiError'
import { getRoleColor, PERMISSION_MODULE_LABELS } from '../../lib/constants'
import type { DynamicRole } from '../../types'

export default function RolesPage() {
  const queryClient = useQueryClient()

  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [createError, setCreateError] = useState('')

  const [editModal, setEditModal] = useState<DynamicRole | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [editError, setEditError] = useState('')

  const [permsModal, setPermsModal] = useState<DynamicRole | null>(null)
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())

  const [deleteConfirm, setDeleteConfirm] = useState<DynamicRole | null>(null)

  const { data: roles = [], isLoading } = useQuery<DynamicRole[]>({
    queryKey: ['roles'],
    queryFn: getRoles,
  })

  const { data: permGroups = [] } = useQuery<PermissionGroup[]>({
    queryKey: ['permissions'],
    queryFn: getPermissions,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] })

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => { invalidate(); setCreateModal(false); setCreateForm({ name: '', description: '' }); setCreateError(''); notify.success('Rol creado') },
    onError: (e: unknown) => { setCreateError(getApiMessage(e, 'Error al crear el rol')) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) => updateRole(id, data),
    onSuccess: () => { invalidate(); setEditModal(null); setEditError(''); notify.success('Rol actualizado') },
    onError: (e: unknown) => { setEditError(getApiMessage(e, 'Error al actualizar')) },
  })

  const permsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) => updateRolePermissions(id, permissions),
    onSuccess: () => { invalidate(); setPermsModal(null); notify.success('Permisos actualizados') },
    onError: (e: unknown) => notify.apiError(e),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => { invalidate(); setDeleteConfirm(null); notify.success('Rol eliminado') },
    onError: (e: unknown) => notify.apiError(e),
  })

  const openEdit = (role: DynamicRole) => {
    setEditModal(role)
    setEditForm({ name: role.name, description: role.description ?? '' })
    setEditError('')
  }

  const openPerms = (role: DynamicRole) => {
    setPermsModal(role)
    setSelectedPerms(new Set(role.permissions ?? []))
  }

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleModule = (group: PermissionGroup, checked: boolean) => {
    setSelectedPerms(prev => {
      const next = new Set(prev)
      group.permissions.forEach(p => checked ? next.add(p.key) : next.delete(p.key))
      return next
    })
  }

  const isModuleAll = (group: PermissionGroup) =>
    group.permissions.length > 0 && group.permissions.every(p => selectedPerms.has(p.key))
  const isModuleSome = (group: PermissionGroup) => group.permissions.some(p => selectedPerms.has(p.key))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Roles y permisos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona los roles de tu organización y sus permisos</p>
        </div>
        <button
          onClick={() => { setCreateModal(true); setCreateError('') }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          + Nuevo rol
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Rol', 'Descripción', 'Permisos', 'Usuarios', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody>
          </table>
        ) : roles.length === 0 ? (
          <EmptyState message="No hay roles definidos" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Permisos</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuarios</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge color={getRoleColor(role.name)}>{role.name}</Badge>
                      {role.isSystem && (
                        <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Sistema</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {role.description ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{role.permissions?.length ?? 0}</span>
                    <span className="text-xs text-gray-400 ml-1">permisos</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{role.usersCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openPerms(role)} className="text-green-600 hover:text-green-800 text-xs font-medium">
                        Permisos
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => openEdit(role)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                          Editar
                        </button>
                      )}
                      {!role.isSystem && (role.usersCount ?? 0) === 0 && (
                        <button onClick={() => setDeleteConfirm(role)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear rol */}
      {createModal && (
        <Modal title="Nuevo rol" onClose={() => { setCreateModal(false); setCreateError('') }} size="sm">
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(createForm) }} className="p-6 space-y-4">
            {createError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{createError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                required
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Supervisor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {createMutation.isPending ? 'Creando...' : 'Crear rol'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal editar rol */}
      {editModal && (
        <Modal title="Editar rol" onClose={() => setEditModal(null)} size="sm">
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ id: editModal.id, data: editForm }) }} className="p-6 space-y-4">
            {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{editError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                required
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditModal(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal matriz de permisos */}
      {permsModal && (
        <Modal title={`Permisos — ${permsModal.name}`} onClose={() => setPermsModal(null)} size="lg">
          <div className="p-6 space-y-5">
            {permsModal.isSystem && permsModal.name === 'ORG_ADMIN' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Este rol debe conservar siempre la gestión de roles y usuarios.
              </p>
            )}
            {permGroups.map(group => (
              <div key={group.module}>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isModuleSome(group)}
                      onChange={e => toggleModule(group, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      {PERMISSION_MODULE_LABELS[group.module] ?? group.module}
                    </span>
                  </label>
                  <span className="text-xs text-gray-400">
                    {group.permissions.filter(p => selectedPerms.has(p.key)).length}/{group.permissions.length}
                  </span>
                </div>
                <div className="ml-5 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {group.permissions.map(perm => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={selectedPerms.has(perm.key)}
                        onChange={() => togglePerm(perm.key)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-600">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setPermsModal(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
              <button
                onClick={() => permsMutation.mutate({ id: permsModal.id, permissions: [...selectedPerms] })}
                disabled={permsMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {permsMutation.isPending ? 'Guardando...' : 'Guardar permisos'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmar eliminar */}
      {deleteConfirm && (
        <Modal title="¿Eliminar rol?" onClose={() => setDeleteConfirm(null)} size="sm" sheet={false}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Se eliminará el rol <strong>{deleteConfirm.name}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
