import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api/errors'
import { renderWithAuth } from '../../test/renderWithAuth'
import { LoginPage } from './LoginPage'

function renderLoginRoutes(
  options: Parameters<typeof renderWithAuth>[1] = {},
) {
  return renderWithAuth(
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/inicio" element={<p>área logada</p>} />
    </Routes>,
    options,
  )
}

async function fillAndSubmit(remember = false) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'segredo123')
  if (remember) {
    await user.click(screen.getByRole('checkbox', { name: 'Lembrar-me' }))
  }
  await user.click(screen.getByRole('button', { name: /login/i }))
}

describe('LoginPage', () => {
  it('renders the login heading, form fields, social buttons and signup link', () => {
    renderWithAuth(<LoginPage />)

    expect(
      screen.getByRole('heading', { name: 'Login' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Github' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gmail' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Crie seu cadastro!' }),
    ).toHaveAttribute('href', '/cadastro')
  })

  it('signs in with the typed credentials and goes to /inicio', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined)
    renderLoginRoutes({ auth: { signIn } })

    await fillAndSubmit(true)

    expect(signIn).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'segredo123',
      remember: true,
    })
    expect(await screen.findByText('área logada')).toBeInTheDocument()
  })

  it('shows an alert and re-enables the button when credentials are wrong', async () => {
    const signIn = vi
      .fn()
      .mockRejectedValue(new ApiError('unauthorized', 401, ['Invalid credentials']))
    renderLoginRoutes({ auth: { signIn } })

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email ou senha inválidos',
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /login/i })).toBeEnabled(),
    )
  })

  it('shows the notice and prefills the form after signup', () => {
    renderLoginRoutes({
      state: {
        notice: 'Cadastro realizado! Faça login para continuar.',
        email: 'ana@example.com',
        remember: true,
      },
    })

    expect(screen.getByRole('status')).toHaveTextContent('Cadastro realizado!')
    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com')
    expect(screen.getByRole('checkbox', { name: 'Lembrar-me' })).toBeChecked()
  })
})
