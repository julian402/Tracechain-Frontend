export const LOT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
  QUARANTINE: 'bg-yellow-100 text-yellow-700',
  DEPLETED: 'bg-gray-100 text-gray-700',
}

export const LOT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  EXPIRED: 'Vencido',
  QUARANTINE: 'Cuarentena',
  DEPLETED: 'Agotado',
}

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  CREATED: 'bg-green-100 text-green-700',
  TRANSFERRED: 'bg-blue-100 text-blue-700',
  TRANSFORMED: 'bg-purple-100 text-purple-700',
  SPLIT: 'bg-orange-100 text-orange-700',
  MERGED: 'bg-pink-100 text-pink-700',
  STATUS_CHANGED: 'bg-yellow-100 text-yellow-700',
}

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  CREATED: 'Creado',
  TRANSFERRED: 'Traslado',
  TRANSFORMED: 'Transformado',
  SPLIT: 'Fraccionado',
  MERGED: 'Mezclado',
  STATUS_CHANGED: 'Cambio de estado',
}

const ROLE_PALETTE = [
  'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
]

export function getRoleColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return ROLE_PALETTE[Math.abs(hash) % ROLE_PALETTE.length]
}

export const PERMISSION_MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  lots: 'Lotes',
  movements: 'Movimientos',
  audit: 'Auditoría',
  inspections: 'Inspecciones',
  reports: 'Reportes',
  analytics: 'Analítica',
  users: 'Usuarios',
  roles: 'Roles',
  organizations: 'Organizaciones',
  plans: 'Planes',
  settings: 'Configuración',
}

export const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratis',
  PRO: 'Pro',
  ENTERPRISE: 'Empresarial',
}

export const AUDIT_ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  VISITA_EXTERNA: 'bg-indigo-100 text-indigo-700',
  HALLAZGO_NO_CONFORMIDAD: 'bg-red-100 text-red-700',
  HALLAZGO_OBSERVACION: 'bg-yellow-100 text-yellow-700',
  HALLAZGO_OPORTUNIDAD: 'bg-purple-100 text-purple-700',
}

export const VISIT_TYPE_LABELS: Record<string, string> = {
  AUDITORIA: 'Auditoría',
  INTERVENTORIA: 'Interventoría',
  INSPECCION: 'Inspección',
}

export const FINDING_TYPE_LABELS: Record<string, string> = {
  NO_CONFORMIDAD: 'No conformidad',
  OBSERVACION: 'Observación',
  OPORTUNIDAD: 'Oportunidad de mejora',
}

export const PRIORITY_LABELS: Record<string, string> = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

export const PRIORITY_COLORS: Record<string, string> = {
  ALTA: 'bg-red-100 text-red-700',
  MEDIA: 'bg-yellow-100 text-yellow-700',
  BAJA: 'bg-green-100 text-green-700',
}
