import client from './client'
import type { ApiResponse, Inspection } from '../types'

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
  const res = await client.post<ApiResponse<Inspection>>('/inspections', data)
  return res.data.data
}

export const getInspections = async (): Promise<Inspection[]> => {
  const res = await client.get<ApiResponse<Inspection[]>>('/inspections')
  return res.data.data
}