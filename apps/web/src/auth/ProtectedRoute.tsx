import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    // No <main> of its own: it renders inside the AppShell, which owns it.
    return (
      <p role="status" className="text-center text-muted">
        Carregando...
      </p>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
