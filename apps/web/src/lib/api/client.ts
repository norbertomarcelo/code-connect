import axios from 'axios'
import { clearSession, getAccessToken } from '../session'
import { normalizeError } from './errors'

const LOGIN_PATH = '/auth/login'

export const apiClient = axios.create({
  // The dev server proxies /api to the Nest app; VITE_API_URL covers builds
  // served without that proxy.
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeError(error)

    // A 401 from a real request means the stored token is gone or expired.
    // A 401 from the login endpoint just means wrong credentials.
    const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : ''
    if (apiError.kind === 'unauthorized' && !url.endsWith(LOGIN_PATH)) {
      clearSession()
    }

    return Promise.reject(apiError)
  },
)
