import client from './client'
import type { ApiResponse, Supplier } from '../types'

export interface SupplierPayload {
  name: string
  taxId?: string
  contact?: string
  phone?: string
  email?: string
  notes?: string
}

export const getSuppliers = async () => {
  const res = await client.get<ApiResponse<Supplier[]>>('/suppliers')
  return res.data.data
}

export const createSupplier = async (data: SupplierPayload) => {
  const res = await client.post<ApiResponse<Supplier>>('/suppliers', data)
  return res.data.data
}

export const updateSupplier = async (id: string, data: Partial<SupplierPayload>) => {
  const res = await client.patch<ApiResponse<Supplier>>(`/suppliers/${id}`, data)
  return res.data.data
}

export const deleteSupplier = async (id: string) => {
  const res = await client.delete(`/suppliers/${id}`)
  return res.data
}
