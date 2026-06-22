import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { login, verifyOtp, resendOtp } from '../../api/auth'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { EMAIL_PATTERN, validateEmail } from '../../lib/validation'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateEmail(email)) {
      setError('Ingresa un correo válido, por ejemplo admin@empresa.com.')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      setStep('otp')
      setInfo('Te enviamos un código de verificación a tu correo. Vence en 10 minutos.')
    } catch {
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) {
      setError('El código debe tener 6 dígitos.')
      return
    }
    setLoading(true)
    try {
      const data = await verifyOtp(email, code)
      setAuth(data.user, data.token, data.organization, data.permissions)
      navigate('/dashboard')
    } catch {
      setError('Código inválido o expirado. Solicita uno nuevo si es necesario.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await resendOtp(email)
      setInfo('Te enviamos un nuevo código a tu correo.')
    } catch {
      setError('No se pudo reenviar el código. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TraceChain</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de trazabilidad agroalimentaria</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {step === 'credentials' ? 'Iniciar sesión' : 'Verificación en dos pasos'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {info && !error && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {info}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  pattern={EMAIL_PATTERN.source}
                  placeholder="admin@tracechain.com"
                  title="Ingresa un correo válido, por ejemplo admin@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-gray-500">
                Ingresa el código de 6 dígitos que enviamos a <span className="font-medium text-gray-700">{email}</span>.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verificando...' : 'Verificar e ingresar'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setCode(''); setError(''); setInfo('') }}
                  className="text-gray-500 hover:underline"
                >
                  ← Cambiar cuenta
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-green-600 hover:underline font-medium disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-green-600 hover:underline font-medium">
            Registra tu empresa
          </Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          TraceChain © 2026 · 
        </p>
      </div>
    </div>
  )
}
