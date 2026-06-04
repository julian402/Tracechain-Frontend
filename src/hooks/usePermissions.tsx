import type { ReactNode } from 'react'
import { useAuth } from './useAuth'

export function usePermissions() {
  const { permissions, isSuperAdmin } = useAuth()

  function can(key: string): boolean {
    if (isSuperAdmin) return true
    return permissions.includes(key)
  }

  function canAny(...keys: string[]): boolean {
    if (isSuperAdmin) return true
    return keys.some((k) => permissions.includes(k))
  }

  return { can, canAny }
}

interface CanProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = usePermissions()
  return can(permission) ? <>{children}</> : <>{fallback}</>
}
