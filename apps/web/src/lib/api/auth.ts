import { apiClient } from './client'
import type { AuthUser, LoginRequest, LoginResponse } from './types'

/** POST /auth/login -> 200 | 401 invalid credentials | 422 validation */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
  return data
}

/** GET /auth/me -> 200 with the bare user | 401 */
export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me')
  return data
}
