import client from './client'
import type { ApiResponse, User } from '../types'

export const getUsers = async () => {
  const res = await client.get<ApiResponse<User[]>>('/users')
  return res.data.data
}

export const createUser = async (data: { name: string; email: string; password: string; role: string }) => {
  const res = await client.post<ApiResponse<User>>('/auth/register', data)
  return res.data.data
}

export const getUserById = async (id: string) => {
  const res = await client.get<ApiResponse<User>>(`/users/${id}`)
  return res.data.data
}

export const updateUser = async (id: string, data: Partial<User>) => {
  const res = await client.patch<ApiResponse<User>>(`/users/${id}`, data)
  return res.data.data
}

export const changePassword = async (id: string, data: { currentPassword: string; newPassword: string }) => {
  const res = await client.patch(`/users/${id}/password`, data)
  return res.data
}

export const deleteUser = async (id: string) => {
  const res = await client.delete(`/users/${id}`)
  return res.data
}