import { create } from 'zustand'
import type { User, Organization } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  organization: Organization | null
  permissions: string[]
  isSuperAdmin: boolean
  isAuthenticated: boolean
  setAuth: (user: User, token: string, organization?: Organization | null, permissions?: string[]) => void
  logout: () => void
}

const stored = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : fallback
}

export const useAuth = create<AuthState>((set) => ({
  user: stored<User | null>('user', null),
  token: localStorage.getItem('token'),
  organization: stored<Organization | null>('organization', null),
  permissions: stored<string[]>('permissions', []),
  isSuperAdmin: stored<User | null>('user', null)?.isSuperAdmin ?? false,
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (user, token, organization = null, permissions = []) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    if (organization) localStorage.setItem('organization', JSON.stringify(organization))
    else localStorage.removeItem('organization')
    localStorage.setItem('permissions', JSON.stringify(permissions))
    set({
      user,
      token,
      organization,
      permissions,
      isSuperAdmin: user.isSuperAdmin ?? false,
      isAuthenticated: true,
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('organization')
    localStorage.removeItem('permissions')
    set({ user: null, token: null, organization: null, permissions: [], isSuperAdmin: false, isAuthenticated: false })
  },
}))
