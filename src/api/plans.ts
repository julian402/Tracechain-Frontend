import client from './client'
import type { ApiResponse, Plan, PlanCatalog } from '../types'

export interface PlanPayload {
  key?: string
  name: string
  description?: string | null
  price: number
  currency?: string
  billingPeriod: Plan['billingPeriod']
  isActive: boolean
  sortOrder?: number
  limits: Record<string, number | null>
  features: Record<string, boolean>
  stripeProductId?: string | null
  stripePriceId?: string | null
}

export const getPlans = async () => {
  const res = await client.get<ApiResponse<Plan[]>>('/plans')
  return res.data.data
}

export const getPlanCatalog = async () => {
  const res = await client.get<ApiResponse<PlanCatalog>>('/plans/catalog')
  return res.data.data
}

export const createPlan = async (data: PlanPayload) => {
  const res = await client.post<ApiResponse<Plan>>('/plans', data)
  return res.data.data
}

export const updatePlan = async (id: string, data: Partial<PlanPayload>) => {
  const res = await client.patch<ApiResponse<Plan>>(`/plans/${id}`, data)
  return res.data.data
}

export const deletePlan = async (id: string) => {
  const res = await client.delete<ApiResponse<{ message: string }>>(`/plans/${id}`)
  return res.data.data
}
