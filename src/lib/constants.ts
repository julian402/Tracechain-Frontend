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

export const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  OPERATOR: 'bg-blue-100 text-blue-700',
  AUDITOR: 'bg-yellow-100 text-yellow-700',
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operario',
  AUDITOR: 'Auditor',
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
