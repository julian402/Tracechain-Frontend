import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { registerOrg } from '../../api/auth'
import { getApiMessage } from '../../lib/apiError'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { EMAIL_PATTERN, PASSWORD_REQUIREMENTS, getPasswordErrors, normalizeSlug, validateEmail, validatePassword } from '../../lib/validation'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [form, setForm] = useState({
    organizationName: '',
    slug: '',
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  })

  const slugField = {
    value: form.slug,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, slug: normalizeSlug(e.target.value) }),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!validateEmail(form.email)) {
      setError('Ingresa un correo válido, por ejemplo admin@empresa.com.')
      return
    }
    if (!validatePassword(form.password)) {
      setError(`La contraseña debe tener ${getPasswordErrors(form.password).join(', ')}.`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await registerOrg({
        organizationName: form.organizationName,
        slug: form.slug.trim() || undefined,
        name: form.name,
        email: form.email,
        password: form.password,
      })
      setAuth(data.user, data.token, data.organization, data.permissions)
      navigate('/dashboard')
    } catch (err) {
      setError(getApiMessage(err, 'No se pudo crear la organización. Verifica los datos e intenta de nuevo.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TraceChain</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu organización</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Registro de empresa</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos de la empresa</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa *</label>
              <input
                type="text"
                required
                {...field('organizationName')}
                placeholder="Ej: Frutas del Valle S.A.S."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-gray-400 font-normal">(opcional, se genera automáticamente)</span>
              </label>
              <input
                type="text"
                {...slugField}
                placeholder="frutas-del-valle"
                pattern="^[a-z0-9-]+$"
                title="Usa solo letras minúsculas, números y guiones. Ejemplo: frutas-del-valle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
              <p className="mt-1 text-xs text-gray-400">
                Se guarda en minúsculas y solo permite letras, números y guiones.
              </p>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Datos del administrador</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input
                type="text"
                required
                {...field('name')}
                placeholder="Tu nombre"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
              <input
                type="email"
                required
                pattern={EMAIL_PATTERN.source}
                {...field('email')}
                placeholder="admin@tuempresa.com"
                title="Ingresa un correo válido, por ejemplo admin@empresa.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
              <PasswordInput
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                required
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-gray-400">{PASSWORD_REQUIREMENTS}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
              <PasswordInput
                value={form.confirm}
                onChange={(confirm) => setForm({ ...form, confirm })}
                required
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creando organización...' : 'Crear organización'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-green-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          TraceChain © 2026 · 
        </p>
      </div>
    </div>
  )
}
