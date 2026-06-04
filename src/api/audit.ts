import client from './client'
import type { ApiResponse, AuditLog } from '../types'

export const getAuditLogs = async () => {
  const res = await client.get<ApiResponse<AuditLog[]>>('/audit')
  return res.data.data
}

export const searchAuditLogs = async (params: { action?: string; userId?: string; lotId?: string; fromDate?: string; toDate?: string }) => {
  const res = await client.get<ApiResponse<AuditLog[]>>('/audit/search', { params })
  return res.data.data
}