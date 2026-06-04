import client from './client'
import type { ApiResponse, Permission } from '../types'

export interface PermissionGroup {
  module: string
  permissions: Permission[]
}

export const getPermissions = async () => {
  const res = await client.get<ApiResponse<PermissionGroup[]>>('/permissions')
  return res.data.data
}
