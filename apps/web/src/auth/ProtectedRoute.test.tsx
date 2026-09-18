import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithAuth } from '../test/renderWithAuth'
import { ProtectedRoute } from './ProtectedRoute'

function renderRoute(status: 'loading' | 'anonymous' | 'authenticated') {
  return renderWithAuth(
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <p>conteúdo privado</p>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<p>tela de login</p>} />
    </Routes>,
    { auth: { status } },
  )
}

describe('ProtectedRoute', () => {
  it('shows a loading status while the session is being validated', () => {
    renderRoute('loading')

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(screen.queryByText('conteúdo privado')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to /login', () => {
    renderRoute('anonymous')

    expect(screen.getByText('tela de login')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo privado')).not.toBeInTheDocument()
  })

  it('renders children for authenticated users', () => {
    renderRoute('authenticated')

    expect(screen.getByText('conteúdo privado')).toBeInTheDocument()
  })
})
