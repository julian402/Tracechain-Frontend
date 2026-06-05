export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const SLUG_PATTERN = /^[a-z0-9-]+$/
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const PASSWORD_REQUIREMENTS = 'Mínimo 8 caracteres, una mayúscula, una minúscula y un número.'

export function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim())
}

export function validatePassword(password: string) {
  return PASSWORD_PATTERN.test(password)
}

export function getPasswordErrors(password: string) {
  const errors: string[] = []
  if (password.length < 8) errors.push('mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('una mayúscula')
  if (!/[a-z]/.test(password)) errors.push('una minúscula')
  if (!/\d/.test(password)) errors.push('un número')
  return errors
}
