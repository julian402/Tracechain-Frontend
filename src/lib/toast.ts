// src/lib/toast.ts
import { toast } from 'sonner'

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  loading: (msg: string) => toast.loading(msg),
  dismiss: (id?: string | number) => toast.dismiss(id),

  // Helpers semánticos del dominio
  lotCreated: () => toast.success('Lote creado correctamente'),
  lotStatusUpdated: () => toast.success('Estado del lote actualizado'),
  movementCreated: () => toast.success('Movimiento registrado'),
  inspectionCreated: () => toast.success('Inspección guardada'),
  userDeleted: () => toast.success('Usuario eliminado'),
  apiError: (err: unknown) => {
    const message =
      err instanceof Error ? err.message : 'Ocurrió un error inesperado'
    toast.error(message)
  },
}