import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { updateUser, changePassword } from '../../api/users'
import { notify } from '../../lib/toast'
import { getRoleColor } from '../../lib/constants'

export default function ProfilePage() {
  const { user, setAuth, token, organization, permissions } = useAuth()
  const [nameForm, setNameForm] = useState({ name: user?.name ?? '' })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwdError, setPwdError] = useState('')

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => updateUser(user!.id, data),
    onSuccess: (updated) => {
      setAuth(updated, token!, organization, permissions)
      notify.success('Perfil actualizado')
    },
    onError: (e) => notify.apiError(e),
  })

  const pwdMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changePassword(user!.id, data),
    onSuccess: () => {
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' })
      setPwdError('')
      notify.success('Contraseña actualizada')
    },
    onError: (e) => notify.apiError(e),
  })

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirm) {
      setPwdError('Las contraseñas no coinciden')
      return
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError('Mínimo 6 caracteres')
      return
    }
    setPwdError('')
    pwdMutation.mutate({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
  }

  const roleName = user?.role?.name ?? ''

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Mi perfil</h1>

      {/* Info de cuenta */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-green-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {roleName && (
              <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(roleName)}`}>
                {roleName}
              </span>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ name: nameForm.name }) }}
          className="space-y-4"
        >
          <h2 className="font-medium text-gray-900 text-sm border-b border-gray-100 pb-2">Editar información</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              value={nameForm.name}
              onChange={(e) => setNameForm({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={user?.email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending || nameForm.name === user?.name}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-medium text-gray-900 text-sm border-b border-gray-100 pb-2 mb-4">Cambiar contraseña</h2>
        <form onSubmit={handlePwdSubmit} className="space-y-4">
          {pwdError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{pwdError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input
              type="password"
              required
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              required
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              required
              value={pwdForm.confirm}
              onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={pwdMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {pwdMutation.isPending ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
