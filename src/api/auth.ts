import client from './client'
import type { ApiResponse, AuthResponse } from '../types'

export const login = async (email: string, password: string) => {
  const res = await client.post<ApiResponse<AuthResponse>>('/auth/login', { email, password })
  return res.data.data
}

export const register = async (name: string, email: string, password: string, role?: string) => {
  const res = await client.post<ApiResponse<AuthResponse>>('/auth/register', { name, email, password, role })
  return res.data.data
}