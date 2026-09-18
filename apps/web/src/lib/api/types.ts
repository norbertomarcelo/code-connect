export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  /** Absolute ISO-8601 instant, not a duration. */
  expiresAt: string
  user: AuthUser
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
}

export type CreateUserResponse = AuthUser
