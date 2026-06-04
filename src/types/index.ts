export type Role = 'ADMIN' | 'OPERATOR' | 'AUDITOR'
export type LotStatus = 'ACTIVE' | 'EXPIRED' | 'QUARANTINE' | 'DEPLETED'
export type MovementType = 'CREATED' | 'TRANSFERRED' | 'TRANSFORMED' | 'SPLIT' | 'MERGED' | 'STATUS_CHANGED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

export interface Lot {
  id: string
  code: string
  qrCode: string
  name: string
  quantity: number
  unit: string
  status: LotStatus
  productionDate: string
  expirationDate: string
  sanitaryRecord?: string
  storageTemp?: number
  storageHumidity?: number
  notes?: string
  parentLotId?: string
  createdById: string
  createdBy?: Pick<User, 'id' | 'name' | 'email'>
  createdAt: string
  updatedAt: string
  movements?: Movement[]
  childLots?: Lot[]
  parentLot?: Lot
}

export interface Movement {
  id: string
  type: MovementType
  description: string
  quantity?: number
  fromLocation?: string
  toLocation?: string
  lotId: string
  createdById: string
  createdBy?: Pick<User, 'id' | 'name' | 'email'>
  createdAt: string
}

export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  oldData?: unknown
  newData?: unknown
  userId: string
  user?: Pick<User, 'id' | 'name' | 'email'>
  lotId?: string
  lot?: Pick<Lot, 'id' | 'code' | 'name'>
  createdAt: string
}

export interface DashboardStats {
  kpis: {
    totalLots: number
    activeLots: number
    expiredLots: number
    quarantineLots: number
    expiringIn7Days: number
    totalMovements: number
  }
  recentLots: Lot[]
  activeAlerts: Lot[]
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message?: string
}

export interface AuthResponse {
  token: string
  user: User
}