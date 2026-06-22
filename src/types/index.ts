export type LotStatus = 'ACTIVE' | 'EXPIRED' | 'QUARANTINE' | 'DEPLETED'
export type MovementType = 'CREATED' | 'TRANSFERRED' | 'TRANSFORMED' | 'SPLIT' | 'MERGED' | 'STATUS_CHANGED'

export interface Organization {
  id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'SUSPENDED'
  planId: string
  plan?: Plan
  customLimits?: Record<string, number | null>
  customFeatures?: Record<string, boolean>
  analyticsConfig?: {
    dashboardUrl?: string | null
  }
  usersCount?: number
  lotsCount?: number
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  key: string
  module: string
  action: string
  label: string
}

export interface DynamicRole {
  id: string
  name: string
  description?: string | null
  isSystem: boolean
  organizationId?: string | null
  permissions?: string[]
  usersCount?: number
  createdAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  role?: { id: string; name: string } | null
  organizationId?: string | null
  organization?: Pick<Organization, 'id' | 'name' | 'slug'> | null
  isSuperAdmin?: boolean
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
  supplierId?: string | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  ingredients?: LotIngredient[]
  createdById: string
  createdBy?: Pick<User, 'id' | 'name' | 'email'>
  createdAt: string
  updatedAt: string
  movements?: Movement[]
  childLots?: Lot[]
  parentLot?: Lot
}

export interface Supplier {
  id: string
  name: string
  taxId?: string | null
  contact?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
  organizationId?: string
  createdAt: string
  updatedAt: string
}

export interface RawMaterialBatch {
  id: string
  name: string
  batchNumber?: string | null
  quantity: number
  unit: string
  receivedDate?: string | null
  expirationDate?: string | null
  notes?: string | null
  supplierId?: string | null
  supplier?: Pick<Supplier, 'id' | 'name'> | null
  createdById?: string
  createdBy?: Pick<User, 'id' | 'name' | 'email'>
  createdAt: string
  updatedAt: string
  usedIn?: Array<{ id: string; quantityUsed: number; unit: string; lot?: Pick<Lot, 'id' | 'code' | 'name'> }>
}

export interface LotIngredient {
  id: string
  quantityUsed: number
  unit: string
  rawMaterialBatchId: string
  rawMaterialBatch?: Pick<RawMaterialBatch, 'id' | 'name' | 'batchNumber' | 'expirationDate'> & {
    supplier?: Pick<Supplier, 'id' | 'name'> | null
  }
}

export interface Movement {
  id: string
  type: MovementType
  description: string
  quantity?: number
  fromLocation?: string
  toLocation?: string
  lotId: string
  lot?: Pick<Lot, 'id' | 'code' | 'name'>
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
  lotsByMonth: { mes: string; lotes: number }[]
}

export type VisitStatus = 'PENDIENTE' | 'EN_CURSO' | 'RESUELTO'

export interface Inspection {
  id: string
  visitType: 'AUDITORIA' | 'INTERVENTORIA' | 'INSPECCION'
  visitDate: string
  actReference?: string
  auditorEntity: string
  auditorName: string
  auditedProcess?: string
  objective?: string
  status: VisitStatus
  responsibleId?: string | null
  responsible?: Pick<User, 'id' | 'name' | 'email'> | null
  commitmentDate?: string
  correctiveActions?: string
  lotId?: string
  lot?: Pick<Lot, 'id' | 'code' | 'name'>
  findings: Array<{
    id: string
    type: 'NO_CONFORMIDAD' | 'OBSERVACION' | 'OPORTUNIDAD'
    priority: 'ALTA' | 'MEDIA' | 'BAJA'
    criteria?: string
    description: string
    deadline?: string
    createdAt?: string
  }>
  createdById: string
  createdBy?: Pick<User, 'id' | 'name' | 'email'>
  createdAt: string
  updatedAt: string
}

export type BillingPeriod = 'MONTHLY' | 'YEARLY' | 'ONE_TIME'

export interface Plan {
  id: string
  key: string
  name: string
  description?: string | null
  price: number
  currency: string
  billingPeriod: BillingPeriod
  isActive: boolean
  sortOrder: number
  limits: Record<string, number | null>
  features: Record<string, boolean>
  stripeProductId?: string | null
  stripePriceId?: string | null
  createdAt: string
  updatedAt: string
}

export interface PlanLimitDef {
  key: string
  label: string
  description: string
  default: number | null
}

export interface PlanFeatureDef {
  key: string
  label: string
  description: string
}

export interface PlanCatalog {
  limits: PlanLimitDef[]
  features: PlanFeatureDef[]
  billingPeriods: BillingPeriod[]
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message?: string
}

export interface AuthResponse {
  token: string
  user: User
  organization?: Organization | null
  permissions?: string[]
}
