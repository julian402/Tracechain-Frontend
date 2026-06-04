import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsersGlobal, createUser, updateUser, deleteUser } from '../../api/users'
import { getOrganizations } from '../../api/organizations'
import { getRolesByOrg } from '../../api/roles'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { TableRowSkeleton } from '../../components/ui/Skeleton'
import { notify } from '../../lib/toast'
import { getApiMessage } from '../../lib/apiError'
import { getRoleColor } from '../../lib/constants'
import type { User, DynamicRole } from '../../types'

interface GlobalUser extends User {
  organization?: { id: string; name: string; slug: string } | null
}

const initialForm = { name: '', email: '', password: '', roleId: '', organizationId: '' }

export default function GlobalUsersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')
  const [editUser, setEditUser] = useState<GlobalUser | null>(null)
  const [editForm, setEditForm] = useState({ name: '', roleId: '' })
  const [editError, setEditError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [orgRoles, setOrgRoles] = useState<DynamicRole[]>([])
  const [editOrgRoles, setEditOrgRoles] = useState<DynamicRole[]>([])

  const { data: users = [], isLoading } = useQuery<GlobalUser[]>({
    queryKey: ['users-global'],
    queryFn: getUsersGlobal as unknown as () => Promise<GlobalUser[]>,
  })

  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users-global'] })

  const handleOrgChange = async (orgId: string) => {
    setForm((f) => ({ ...f, organizationId: orgId, roleId: '' }))
    if (orgId) {
      try {
        const roles = await getRolesByOrg(orgId)
        setOrgRoles(roles)
      } catch { setOrgRoles([]) }
    } else {
      setOrgRoles([])
    }
  }

  const handleEditOrgLoad = async (orgId: string | null | undefined) => {
    if (orgId) {
      try {
        const roles = await getRolesByOrg(orgId)
        setEditOrgRoles(roles)
      } catch { setEditOrgRoles([]) }
    }
  }

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => { invalidate(); setShowForm(false); setForm(initialForm); setFormError(''); notify.success('Usuario creado') },
    onError: (e: unknown) => { setFormError(getApiMessage(e, 'Error al crear el usuario')); notify.apiError(e) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; roleId: string } }) => updateUser(id, data),
    onSuccess: () => { invalidate(); setEditUser(null); setEditError(''); notify.success('Usuario actualizado') },
    onError: (e: unknown) => { setEditError(getApiMessage(e, 'Error al actualizar')); notify.apiError(e) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { invalidate(); setDeleteConfirm(null); notify.userDeleted() },
    onError: (e) => notify.apiError(e),
  })

  const openEdit = (user: GlobalUser) => {
    setEditUser(user)
    setEditForm({ name: user.name, roleId: user.role?.id ?? '' })
    setEditError('')
    handleEditOrgLoad(user.organization?.id ?? user.organizationId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.organizationId) { setFormError('Selecciona una organización.'); return }
    if (!form.roleId) { setFormError('Selecciona un rol.'); return }
    createMutation.mutate({ ...form, organizationId: form.organizationId })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setEditError('')
    updateMutation.mutate({ id: editUser.id, data: editForm })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios globales</h1>
          <p className="text-sm text-gray-500 mt-0.5">Todos los usuarios de todas las organizaciones</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          + Nuevo usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total usuarios</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Organizaciones</p>
          <p className="text-2xl font-bold text-gray-900">{orgs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Super admins</p>
          <p className="text-2xl font-bold text-purple-600">{users.filter((u) => u.isSuperAdmin).length}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Usuario', 'Organización', 'Rol', 'Registro', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody>
          </table>
        ) : users.length === 0 ? (
          <EmptyState message="No hay usuarios registrados" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organización</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-gray-600">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.isSuperAdmin ? (
                      <Badge color="bg-purple-100 text-purple-700">Plataforma</Badge>
                    ) : (
                      <span className="text-gray-700">{user.organization?.name ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.isSuperAdmin ? (
                      <Badge color="bg-purple-100 text-purple-700">Super Admin</Badge>
                    ) : user.role ? (
                      <Badge color={getRoleColor(user.role.name)}>{user.role.name}</Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    {!user.isSuperAdmin && (
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Editar</button>
                        <button onClick={() => setDeleteConfirm(user.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear usuario */}
      {showForm && (
        <Modal title="Nuevo usuario" onClose={() => { setShowForm(false); setFormError('') }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organización *</label>
              <select
                value={form.organizationId}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona una organización</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                disabled={!form.organizationId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">{form.organizationId ? 'Selecciona un rol' : 'Primero selecciona org'}</option>
                {orgRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {createMutation.isPending ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal editar */}
      {editUser && (
        <Modal title="Editar usuario" onClose={() => setEditUser(null)}>
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{editError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organización</label>
              <input disabled value={editUser.organization?.name ?? '—'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Sin cambio</option>
                {editOrgRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditUser(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmar eliminación */}
      {deleteConfirm && (
        <Modal title="¿Eliminar usuario?" onClose={() => setDeleteConfirm(null)} size="sm" sheet={false}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
