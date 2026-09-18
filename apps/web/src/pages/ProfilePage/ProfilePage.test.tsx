import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithAuth } from '../../test/renderWithAuth'
import { ProfilePage } from './ProfilePage'

describe('ProfilePage', () => {
  it('shows the signed-in user', () => {
    renderWithAuth(<ProfilePage />, {
      auth: {
        status: 'authenticated',
        user: { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' },
      },
    })

    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
  })

  it('still renders its heading without a user', () => {
    renderWithAuth(<ProfilePage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
  })
})
