import client from './client'
import type { ApiResponse } from '../types'

export const getQrImage = async (qrCode: string) => {
  const res = await client.get<ApiResponse<{ qrImage: string; url: string }>>(`/qr/${qrCode}`)
  return res.data.data
}
