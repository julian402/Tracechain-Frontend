import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoles,
  createRole,
  updateRole,
  updateRolePermissions,
  updateRoleUsers,
  deleteRole,
} from '../../api/roles'
import { getPermissions, type PermissionGroup } from '../../api/permissions'
import { getUsersGlobal } from '../../api/users'
import { getOrganizations } from '../../api/organizations'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { notify } from '../../lib/toast'
import { getApiMessage } from '../../lib/apiError'
import { getRoleColor } from '../../lib/constants'
import type { DynamicRole, Organization, User } from '../../types'
import { RoleFormModal } from './components/RoleFormModal'
import { RolePermissionsModal } from './components/RolePermissionsModal'
import { RoleUsersModal } from './components/RoleUsersModal'

interface RoleFormState {
  name: string
  description: string
}

const emptyForm: RoleFormState = { name: '', description: '' }

export default function RolesPage() {
  const queryClient = useQueryClient()

  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<RoleFormState>(emptyForm)
  const [createError, setCreateError] = useState('')

  const [editModal, setEditModal] = useState<DynamicRole | null>(null)
  const [editForm, setEditForm] = useState<RoleFormState>(emptyForm)
  const [editError, setEditError] = useState('')

  const [permissionsModal, setPermissionsModal] = useState<DynamicRole | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  const [usersModal, setUsersModal] = useState<DynamicRole | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const [deleteConfirm, setDeleteConfirm] = useState<DynamicRole | null>(null)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  useEffect(() => {
    if (!selectedOrganizationId && organizations.length > 0) {
      setSelectedOrganizationId(organizations[0].id)
    }
  }, [organizations, selectedOrganizationId])

  const { data: roles = [], isLoading } = useQuery<DynamicRole[]>({
    queryKey: ['roles', selectedOrganizationId],
    queryFn: () => getRoles({ organizationId: selectedOrganizationId }),
    enabled: !!selectedOrganizationId,
  })

  const { data: permissionGroups = [] } = useQuery<PermissionGroup[]>({
    queryKey: ['permissions'],
    queryFn: getPermissions,
  })

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users-global'],
    queryFn: getUsersGlobal,
  })

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId),
    [organizations, selectedOrganizationId]
  )

  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ['roles', selectedOrganizationId] })
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users-global'] })

  const createMutation = useMutation({
    mutationFn: (data: RoleFormState) => createRole(data, { organizationId: selectedOrganizationId }),
    onSuccess: () => {
      invalidateRoles()
      setCreateModal(false)
      setCreateForm(emptyForm)
      setCreateError('')
      notify.success('Rol creado')
    },
    onError: (error: unknown) => setCreateError(getApiMessage(error, 'Error al crear el rol')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleFormState }) => updateRole(id, data, { organizationId: selectedOrganizationId }),
    onSuccess: () => {
      invalidateRoles()
      setEditModal(null)
      setEditError('')
      notify.success('Rol actualizado')
    },
    onError: (error: unknown) => setEditError(getApiMessage(error, 'Error al actualizar')),
  })

  const permissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      updateRolePermissions(id, permissions, { organizationId: selectedOrganizationId }),
    onSuccess: () => {
      invalidateRoles()
      setPermissionsModal(null)
      notify.success('Permisos actualizados')
    },
    onError: (error: unknown) => notify.apiError(error),
  })

  const usersMutation = useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      updateRoleUsers(id, userIds, { organizationId: selectedOrganizationId }),
    onSuccess: () => {
      invalidateRoles()
      invalidateUsers()
      setUsersModal(null)
      notify.success('Usuarios actualizados')
    },
    onError: (error: unknown) => notify.apiError(error),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id, { organizationId: selectedOrganizationId }),
    onSuccess: () => {
      invalidateRoles()
      setDeleteConfirm(null)
      notify.success('Rol eliminado')
    },
    onError: (error: unknown) => notify.apiError(error),
  })

  const openCreate = () => {
    setCreateForm(emptyForm)
    setCreateError('')
    setCreateModal(true)
  }

  const openEdit = (role: DynamicRole) => {
    setEditModal(role)
    setEditForm({ name: role.name, description: role.description ?? '' })
    setEditError('')
  }

  const openPermissions = (role: DynamicRole) => {
    setPermissionsModal(role)
    setSelectedPermissions(new Set(role.permissions ?? []))
  }

  const openUsers = (role: DynamicRole) => {
    setUsersModal(role)
    setSelectedUsers(new Set(
      users
        .filter((user) => user.organizationId === selectedOrganizationId && user.role?.id === role.id)
        .map((user) => user.id)
    ))
  }

  const saveRoleUsers = () => {
    if (!usersModal) return
    const assignableUserIds = users
      .filter((user) => user.organizationId === selectedOrganizationId && selectedUsers.has(user.id))
      .map((user) => user.id)
    usersMutation.mutate({ id: usersModal.id, userIds: assignableUserIds })
  }

  const renderActions = (role: DynamicRole) => (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={() => openPermissions(role)} className="text-green-600 hover:text-green-800 text-xs font-medium">
        Permisos
      </button>
      <button
        onClick={() => openUsers(role)}
        disabled={usersLoading}
        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium disabled:opacity-50"
      >
        Usuarios
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
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Roles y permisos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona roles, permisos y usuarios por organización
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedOrganizationId}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>{organization.name}</option>
            ))}
          </select>
          <button
            onClick={openCreate}
            disabled={!selectedOrganizationId}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
          >
            + Nuevo rol
          </button>
        </div>
      </div>

      {selectedOrganization && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Organización seleccionada</p>
          <p className="text-sm font-semibold text-gray-900">{selectedOrganization.name}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <>
            <table className="hidden md:table w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Rol', 'Descripción', 'Permisos', 'Usuarios', ''].map((header) => (
                    <th key={header} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{Array.from({ length: 4 }).map((_, index) => <TableRowSkeleton key={index} cols={5} />)}</tbody>
            </table>
            <div className="md:hidden divide-y divide-gray-100">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 space-y-3">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </>
        ) : roles.length === 0 ? (
          <EmptyState message="No hay roles definidos" />
        ) : (
          <>
            <table className="hidden md:table w-full text-sm">
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
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge color={getRoleColor(role.name)}>{role.name}</Badge>
                        {role.isSystem && (
                          <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                            Sistema
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {role.description ?? <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-700">{role.permissions?.length ?? 0}</span>
                      <span className="text-xs text-gray-400 ml-1">permisos</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{role.usersCount ?? 0}</td>
                    <td className="px-4 py-3">{renderActions(role)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-gray-100">
              {roles.map((role) => (
                <article key={role.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge color={getRoleColor(role.name)}>{role.name}</Badge>
                      {role.isSystem && (
                        <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                          Sistema
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{role.usersCount ?? 0} usuarios</span>
                  </div>
                  <p className="text-xs text-gray-500">{role.description ?? 'Sin descripción'}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{role.permissions?.length ?? 0} permisos</span>
                    {renderActions(role)}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {createModal && (
        <RoleFormModal
          mode="create"
          form={createForm}
          error={createError}
          pending={createMutation.isPending}
          onChange={setCreateForm}
          onClose={() => {
            setCreateModal(false)
            setCreateError('')
          }}
          onSubmit={() => createMutation.mutate(createForm)}
        />
      )}

      {editModal && (
        <RoleFormModal
          mode="edit"
          role={editModal}
          form={editForm}
          error={editError}
          pending={updateMutation.isPending}
          onChange={setEditForm}
          onClose={() => setEditModal(null)}
          onSubmit={() => updateMutation.mutate({ id: editModal.id, data: editForm })}
        />
      )}

      {permissionsModal && (
        <RolePermissionsModal
          role={permissionsModal}
          organizationName={selectedOrganization?.name}
          groups={permissionGroups}
          selected={selectedPermissions}
          pending={permissionsMutation.isPending}
          onSelectedChange={setSelectedPermissions}
          onClose={() => setPermissionsModal(null)}
          onSave={() => permissionsMutation.mutate({ id: permissionsModal.id, permissions: [...selectedPermissions] })}
        />
      )}

      {usersModal && (
        <RoleUsersModal
          role={usersModal}
          users={users}
          organizationId={selectedOrganizationId}
          organizationName={selectedOrganization?.name}
          selected={selectedUsers}
          pending={usersMutation.isPending}
          onSelectedChange={setSelectedUsers}
          onClose={() => setUsersModal(null)}
          onSave={saveRoleUsers}
        />
      )}

      {deleteConfirm && (
        <Modal title="¿Eliminar rol?" onClose={() => setDeleteConfirm(null)} size="sm" sheet={false}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Se eliminará el rol <strong>{deleteConfirm.name}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
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
