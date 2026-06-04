export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  supersetDashboardUrl: import.meta.env.VITE_SUPERSET_DASHBOARD_URL as string | undefined,
} as const
