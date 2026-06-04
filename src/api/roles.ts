import client from './client'
import type { ApiResponse, DynamicRole } from '../types'

export const getRoles = async () => {
  const res = await client.get<ApiResponse<DynamicRole[]>>('/roles')
  return res.data.data
}

export const getRolesByOrg = async (organizationId: string) => {
  const res = await client.get<ApiResponse<DynamicRole[]>>(`/roles?organizationId=${organizationId}`)
  return res.data.data
}

export const getRoleById = async (id: string) => {
  const res = await client.get<ApiResponse<DynamicRole>>(`/roles/${id}`)
  return res.data.data
}

export const createRole = async (data: { name: string; description?: string }) => {
  const res = await client.post<ApiResponse<DynamicRole>>('/roles', data)
  return res.data.data
}

export const updateRole = async (id: string, data: { name?: string; description?: string }) => {
  const res = await client.patch<ApiResponse<DynamicRole>>(`/roles/${id}`, data)
  return res.data.data
}

export const deleteRole = async (id: string) => {
  const res = await client.delete(`/roles/${id}`)
  return res.data
}

export const updateRolePermissions = async (id: string, permissions: string[]) => {
  const res = await client.put<ApiResponse<DynamicRole>>(`/roles/${id}/permissions`, { permissions })
  return res.data.data
}
