import client from './client'
import type { ApiResponse, AuditLog, Paginated } from '../types'

export const getAuditLogs = async (params: { page?: number; limit?: number; action?: string; userId?: string; lotId?: string; fromDate?: string; toDate?: string } = {}) => {
  const res = await client.get<ApiResponse<Paginated<AuditLog>>>('/audit', { params })
  return res.data.data
}