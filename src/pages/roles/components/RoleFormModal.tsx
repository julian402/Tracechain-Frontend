import { Modal } from '../../../components/ui/Modal'
import type { DynamicRole } from '../../../types'

interface RoleFormState {
  name: string
  description: string
}

interface RoleFormModalProps {
  mode: 'create' | 'edit'
  role?: DynamicRole | null
  form: RoleFormState
  error: string
  pending: boolean
  onChange: (form: RoleFormState) => void
  onClose: () => void
  onSubmit: () => void
}

export function RoleFormModal({
  mode,
  role,
  form,
  error,
  pending,
  onChange,
  onClose,
  onSubmit,
}: RoleFormModalProps) {
  const isSystem = role?.isSystem ?? false

  return (
    <Modal title={mode === 'create' ? 'Nuevo rol' : 'Editar rol'} onClose={onClose} size="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="p-6 space-y-4"
      >
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
        {isSystem && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Los roles del sistema pueden conservar su nombre para mantener reglas internas.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            required
            disabled={isSystem}
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            placeholder="Ej: Supervisor"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <input
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            placeholder="Opcional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
          >
            {pending ? 'Guardando...' : mode === 'create' ? 'Crear rol' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
