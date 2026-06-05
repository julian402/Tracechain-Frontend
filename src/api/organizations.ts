import client from './client'
import type { ApiResponse, Organization } from '../types'

export interface OrgUsage {
  organization: Organization & {
    usage: { lots: number; users: number }
  }
}

export interface CreateOrgPayload {
  name: string
  slug?: string
  planId: string
  customLimits?: Record<string, number | null>
  customFeatures?: Record<string, boolean>
  analyticsConfig?: { dashboardUrl?: string | null }
}

export interface UpdateOrgPayload {
  name?: string
  slug?: string
  planId?: string
  customLimits?: Record<string, number | null>
  customFeatures?: Record<string, boolean>
  analyticsConfig?: { dashboardUrl?: string | null }
}

export const createOrganization = async (data: CreateOrgPayload) => {
  const res = await client.post<ApiResponse<Organization>>('/organizations', data)
  return res.data.data
}

export const getOrganizations = async () => {
  const res = await client.get<ApiResponse<Organization[]>>('/organizations')
  return res.data.data
}

export const getMyOrganization = async () => {
  const res = await client.get<ApiResponse<OrgUsage['organization']>>('/organizations/me')
  return res.data.data
}

export const updateMyOrganization = async (data: { name?: string; slug?: string }) => {
  const res = await client.patch<ApiResponse<OrgUsage['organization']>>('/organizations/me', data)
  return res.data.data
}

export const updateOrganization = async (id: string, data: UpdateOrgPayload) => {
  const res = await client.patch<ApiResponse<Organization>>(`/organizations/${id}`, data)
  return res.data.data
}

export const getOrganizationById = async (id: string) => {
  const res = await client.get<ApiResponse<Organization>>(`/organizations/${id}`)
  return res.data.data
}

export const suspendOrganization = async (id: string) => {
  const res = await client.patch<ApiResponse<Organization>>(`/organizations/${id}/suspend`)
  return res.data.data
}

export const activateOrganization = async (id: string) => {
  const res = await client.patch<ApiResponse<Organization>>(`/organizations/${id}/activate`)
  return res.data.data
}

export const changeOrgPlan = async (id: string, planId: string) => {
  const res = await client.patch<ApiResponse<Organization>>(`/organizations/${id}/plan`, { planId })
  return res.data.data
}
