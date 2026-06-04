import client from './client'
import type { ApiResponse, DynamicRole } from '../types'

interface RoleRequestOptions {
  organizationId?: string
}

const withOrganization = (options: RoleRequestOptions = {}) => ({
  params: options.organizationId ? { organizationId: options.organizationId } : undefined,
})

export const getRoles = async (options: RoleRequestOptions = {}) => {
  const res = await client.get<ApiResponse<DynamicRole[]>>('/roles', withOrganization(options))
  return res.data.data
}

export const getRolesByOrg = async (organizationId: string) => {
  return getRoles({ organizationId })
}

export const getRoleById = async (id: string, options: RoleRequestOptions = {}) => {
  const res = await client.get<ApiResponse<DynamicRole>>(`/roles/${id}`, withOrganization(options))
  return res.data.data
}

export const createRole = async (data: { name: string; description?: string }, options: RoleRequestOptions = {}) => {
  const res = await client.post<ApiResponse<DynamicRole>>('/roles', data, withOrganization(options))
  return res.data.data
}

export const updateRole = async (id: string, data: { name?: string; description?: string }, options: RoleRequestOptions = {}) => {
  const res = await client.patch<ApiResponse<DynamicRole>>(`/roles/${id}`, data, withOrganization(options))
  return res.data.data
}

export const deleteRole = async (id: string, options: RoleRequestOptions = {}) => {
  const res = await client.delete(`/roles/${id}`, withOrganization(options))
  return res.data
}

export const updateRolePermissions = async (id: string, permissions: string[], options: RoleRequestOptions = {}) => {
  const res = await client.put<ApiResponse<DynamicRole>>(`/roles/${id}/permissions`, { permissions }, withOrganization(options))
  return res.data.data
}

export const updateRoleUsers = async (id: string, userIds: string[], options: RoleRequestOptions = {}) => {
  const res = await client.put<ApiResponse<DynamicRole>>(`/roles/${id}/users`, { userIds }, withOrganization(options))
  return res.data.data
}
