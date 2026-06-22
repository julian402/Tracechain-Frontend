import client from './client'
import type { ApiResponse, Lot, Paginated } from '../types'

export const getLots = async (params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
  const res = await client.get<ApiResponse<Paginated<Lot>>>('/lots', { params })
  return res.data.data
}

export const getLotById = async (id: string) => {
  const res = await client.get<ApiResponse<Lot>>(`/lots/${id}`)
  return res.data.data
}

export const getLotTree = async (id: string) => {
  const res = await client.get<ApiResponse<{ current: Lot; ancestors: Lot[]; descendants: Lot[] }>>(`/lots/${id}/tree`)
  return res.data.data
}

export const searchLots = async (params: { status?: string; search?: string; fromDate?: string; toDate?: string }) => {
  const res = await client.get<ApiResponse<Lot[]>>('/lots/search', { params })
  return res.data.data
}

export interface CreateLotPayload extends Partial<Lot> {
  ingredients?: { rawMaterialBatchId: string; quantityUsed: number; unit: string }[]
}

export const createLot = async (data: CreateLotPayload) => {
  const res = await client.post<ApiResponse<Lot>>('/lots', data)
  return res.data.data
}

export const changeLotStatus = async (id: string, status: string) => {
  const res = await client.patch<ApiResponse<Lot>>(`/lots/${id}/status`, { status })
  return res.data.data
}

export const updateLot = async (id: string, data: Partial<Lot>) => {
  const res = await client.patch<ApiResponse<Lot>>(`/lots/${id}`, data)
  return res.data.data
}

export const getPublicLot = async (qrCode: string) => {
  const res = await client.get<ApiResponse<Lot>>(`/lots/public/${qrCode}`)
  return res.data.data
}