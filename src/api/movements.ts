import client from './client'
import type { ApiResponse, Movement } from '../types'

export const getMovements = async () => {
  const res = await client.get<ApiResponse<Movement[]>>('/movements')
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