import axios from 'axios'
import { env } from '../env'

const client = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('organization')
      localStorage.removeItem('permissions')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client