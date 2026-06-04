import client from './client'
import type { ApiResponse, Movement, Paginated } from '../types'

export const getMovements = async (params: { page?: number; limit?: number; type?: string; lotCode?: string; fromDate?: string; toDate?: string } = {}) => {
  const res = await client.get<ApiResponse<Paginated<Movement>>>('/movements', { params })
  return res.data.data
}

export const getMovementsByLot = async (lotId: string) => {
  const res = await client.get<ApiResponse<Movement[]>>(`/movements/lot/${lotId}`)
  return res.data.data
}

export const createMovement = async (data: Partial<Movement>) => {
  const res = await client.post<ApiResponse<Movement>>('/movements', data)
  return res.data.data
}