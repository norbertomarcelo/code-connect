import { createContext } from 'react'
import type { AuthUser, CreateUserRequest } from '../lib/api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface SignInCredentials {
  email: string
  password: string
  remember: boolean
}

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  signIn: (credentials: SignInCredentials) => Promise<void>
  /** Registration does not log the user in; the caller redirects to /login. */
  signUp: (values: CreateUserRequest) => Promise<AuthUser>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
