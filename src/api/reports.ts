import client from './client'

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const downloadLotsCSV = async () => {
  const res = await client.get('/reports/lots/csv', { responseType: 'blob' })
  downloadBlob(res.data, `lotes-${new Date().toISOString().slice(0, 10)}.csv`)
}

export const downloadLotsPDF = async () => {
  const res = await client.get('/reports/lots/pdf', { responseType: 'blob' })
  downloadBlob(res.data, `lotes-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export const downloadMovementsCSV = async () => {
  const res = await client.get('/reports/movements/csv', { responseType: 'blob' })
  downloadBlob(res.data, `movimientos-${new Date().toISOString().slice(0, 10)}.csv`)
}

export const downloadMovementsPDF = async () => {
  const res = await client.get('/reports/movements/pdf', { responseType: 'blob' })
  downloadBlob(res.data, `movimientos-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export const downloadAuditCSV = async () => {
  const res = await client.get('/reports/audit/csv', { responseType: 'blob' })
  downloadBlob(res.data, `auditoria-${new Date().toISOString().slice(0, 10)}.csv`)
}
