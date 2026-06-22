import client from './client'
import type { ApiResponse, RawMaterialBatch } from '../types'

export interface RawMaterialPayload {
  name: string
  batchNumber?: string
  quantity: number
  unit: string
  receivedDate?: string
  expirationDate?: string
  supplierId?: string | null
  notes?: string
}

export const getRawMaterials = async () => {
  const res = await client.get<ApiResponse<RawMaterialBatch[]>>('/raw-materials')
  return res.data.data
}

export const getRawMaterialById = async (id: string) => {
  const res = await client.get<ApiResponse<RawMaterialBatch>>(`/raw-materials/${id}`)
  return res.data.data
}

export const createRawMaterial = async (data: RawMaterialPayload) => {
  const res = await client.post<ApiResponse<RawMaterialBatch>>('/raw-materials', data)
  return res.data.data
}

export const updateRawMaterial = async (id: string, data: Partial<RawMaterialPayload>) => {
  const res = await client.patch<ApiResponse<RawMaterialBatch>>(`/raw-materials/${id}`, data)
  return res.data.data
}

export const deleteRawMaterial = async (id: string) => {
  const res = await client.delete(`/raw-materials/${id}`)
  return res.data
}
