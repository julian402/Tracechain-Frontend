import client from './client'
import type { ApiResponse } from '../types'

export interface Finding {
  type: 'NO_CONFORMIDAD' | 'OBSERVACION' | 'OPORTUNIDAD'
  priority: 'ALTA' | 'MEDIA' | 'BAJA'
  criteria?: string
  description: string
  deadline?: string
}

export interface CreateVisitPayload {
  visitType: 'AUDITORIA' | 'INTERVENTORIA' | 'INSPECCION'
  visitDate: string
  actReference?: string
  auditorEntity: string
  auditorName: string
  auditedProcess?: string
  objective?: string
  responsible?: string
  commitmentDate?: string
  correctiveActions?: string
  lotId?: string
  findings: Finding[]
}

export const createInspection = async (data: CreateVisitPayload) => {
  const res = await client.post<ApiResponse<unknown>>('/inspections', data)
  return res.data.data
}

export const getInspections = async () => {
  const res = await client.get<ApiResponse<unknown[]>>('/inspections')
  return res.data.data
}