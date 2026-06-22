import client from './client'
import type { ApiResponse, Inspection, VisitStatus } from '../types'

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
  responsibleId?: string
  commitmentDate?: string
  correctiveActions?: string
  lotId?: string
  findings: Finding[]
}

export const createInspection = async (data: CreateVisitPayload) => {
  const res = await client.post<ApiResponse<Inspection>>('/inspections', data)
  return res.data.data
}

export const getInspections = async (params: { status?: VisitStatus; mine?: boolean } = {}): Promise<Inspection[]> => {
  const res = await client.get<ApiResponse<Inspection[]>>('/inspections', {
    params: { ...(params.status && { status: params.status }), ...(params.mine && { mine: 'true' }) },
  })
  return res.data.data
}

export const getInspectionById = async (id: string): Promise<Inspection> => {
  const res = await client.get<ApiResponse<Inspection>>(`/inspections/${id}`)
  return res.data.data
}

export const updateInspectionStatus = async (id: string, status: VisitStatus) => {
  const res = await client.patch<ApiResponse<Inspection>>(`/inspections/${id}/status`, { status })
  return res.data.data
}