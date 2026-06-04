import client from './client'
import type { ApiResponse, DashboardStats } from '../types'

export const getDashboardStats = async () => {
  const res = await client.get<ApiResponse<DashboardStats>>('/stats/dashboard')
  return res.data.data
}