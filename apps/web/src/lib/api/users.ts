import { apiClient } from './client'
import type { CreateUserRequest, CreateUserResponse } from './types'

/** POST /users -> 201 + Location | 409 duplicate email | 422 validation */
export async function createUser(
  payload: CreateUserRequest,
): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>('/users', payload)
  return data
}
