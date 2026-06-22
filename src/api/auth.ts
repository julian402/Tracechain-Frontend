import client from './client'
import type { ApiResponse, AuthResponse } from '../types'

export interface OtpChallenge {
  otpRequired: true
  email: string
}

export const login = async (email: string, password: string) => {
  const res = await client.post<ApiResponse<OtpChallenge>>('/auth/login', { email, password })
  return res.data.data
}

export const verifyOtp = async (email: string, code: string) => {
  const res = await client.post<ApiResponse<AuthResponse>>('/auth/verify-otp', { email, code })
  return res.data.data
}

export const resendOtp = async (email: string) => {
  const res = await client.post<ApiResponse<OtpChallenge>>('/auth/resend-otp', { email })
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
  const res = await client.post<ApiResponse<OtpChallenge>>('/auth/register', data)
  return res.data.data
}

export const verifyRegistration = async (email: string, code: string) => {
  const res = await client.post<ApiResponse<AuthResponse>>('/auth/register/verify', { email, code })
  return res.data.data
}

export const resendRegistrationOtp = async (email: string) => {
  const res = await client.post<ApiResponse<OtpChallenge>>('/auth/register/resend', { email })
  return res.data.data
}
