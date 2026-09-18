import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, login } from '../lib/api/auth'
import type { AuthUser, CreateUserRequest } from '../lib/api/types'
import { createUser } from '../lib/api/users'
import {
  clearSession,
  readSession,
  saveSession,
  subscribe,
} from '../lib/session'
import { AuthContext } from './AuthContext'
import type { AuthStatus, SignInCredentials } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    readSession() ? 'loading' : 'anonymous',
  )

  // Bootstrap: a stored token is only trusted once /auth/me confirms it.
  useEffect(() => {
    if (!readSession()) return

    let active = true
    getCurrentUser()
      .then((currentUser) => {
        if (!active) return
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!active) return
        clearSession()
        setUser(null)
        setStatus('anonymous')
      })

    return () => {
      active = false
    }
  }, [])

  // The response interceptor clears the session on a 401; follow it.
  useEffect(
    () =>
      subscribe(() => {
        if (!readSession()) {
          setUser(null)
          setStatus('anonymous')
        }
      }),
    [],
  )

  const signIn = useCallback(
    async ({ email, password, remember }: SignInCredentials) => {
      const session = await login({ email, password })
      saveSession(session, remember)
      setUser(session.user)
      setStatus('authenticated')
    },
    [],
  )

  const signUp = useCallback((values: CreateUserRequest) => createUser(values), [])

  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
