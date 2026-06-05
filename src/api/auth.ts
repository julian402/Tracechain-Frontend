import client from './client'
import type { ApiResponse, AuthResponse } from '../types'

export const login = async (email: string, password: string) => {
  const res = await client.post<ApiResponse<AuthResponse>>('/auth/login', { email, password })
  return res.data.data
}

export const getCurrentSession = async () => {
  const res = await client.get<ApiResponse<AuthResponse>>('/auth/me')
  return res.data.data
}

export interface RegisterOrgPayload {
  organizationName: string
  slug?: string
  name: string
  email: string
  password: string
}

export const registerOrg = async (data: RegisterOrgPayload) => {
  const res = await client.post<ApiResponse<AuthResponse>>('/auth/register', data)
  return res.data.data
}
