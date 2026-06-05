import type { AxiosError } from 'axios'

interface ApiErrorBody {
  message?: string
  details?: Array<{ field?: string; message: string }>
}

export function getApiMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorBody>
  const data = axiosError.response?.data
  if (data?.details?.length) return data.details.map((detail) => detail.message).join('\n')
  return data?.message ?? fallback
}
