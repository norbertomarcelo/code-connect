import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithAuth } from '../../test/renderWithAuth'
import { HomePage } from './HomePage'

const ana = { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' }

describe('HomePage', () => {
  it('greets the authenticated user', () => {
    renderWithAuth(<HomePage />, { auth: { user: ana, status: 'authenticated' } })

    expect(
      screen.getByRole('heading', { name: 'Olá, Ana Silva!' }),
    ).toBeInTheDocument()
  })

  it('signs out and goes to /login', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn()
    renderWithAuth(
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<p>tela de login</p>} />
      </Routes>,
      { auth: { user: ana, status: 'authenticated', signOut } },
    )

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('tela de login')).toBeInTheDocument()
  })
})
