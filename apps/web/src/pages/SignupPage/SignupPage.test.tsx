import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api/errors'
import { renderWithAuth } from '../../test/renderWithAuth'
import { SignupPage } from './SignupPage'

function LoginProbe() {
  const state = useLocation().state as { notice: string; email: string }
  return (
    <p>
      tela de login: {state.notice} ({state.email})
    </p>
  )
}

function renderSignupRoutes(auth: Parameters<typeof renderWithAuth>[1]) {
  return renderWithAuth(
    <Routes>
      <Route path="/" element={<SignupPage />} />
      <Route path="/login" element={<LoginProbe />} />
    </Routes>,
    auth,
  )
}

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nome'), 'Ana Silva')
  await user.type(screen.getByLabelText('Email'), 'ana@example.com')
  await user.type(screen.getByLabelText('Senha'), 'segredo123')
  await user.click(screen.getByRole('button', { name: /cadastrar/i }))
}

describe('SignupPage', () => {
  it('renders the signup heading, form fields, social buttons and login link', () => {
    renderWithAuth(<SignupPage />)

    expect(
      screen.getByRole('heading', { name: 'Cadastro' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Github' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gmail' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Faça seu login!' }),
    ).toHaveAttribute('href', '/login')
  })

  it('registers the user and redirects to /login with a notice', async () => {
    const signUp = vi
      .fn()
      .mockResolvedValue({ id: '1', name: 'Ana Silva', email: 'ana@example.com' })
    renderSignupRoutes({ auth: { signUp } })

    await fillAndSubmit()

    expect(signUp).toHaveBeenCalledWith({
      name: 'Ana Silva',
      email: 'ana@example.com',
      password: 'segredo123',
    })
    expect(
      await screen.findByText(/Cadastro realizado! Faça login para continuar\./),
    ).toBeInTheDocument()
    expect(screen.getByText(/ana@example.com/)).toBeInTheDocument()
  })

  it('shows a duplicate email error on the email field', async () => {
    const signUp = vi
      .fn()
      .mockRejectedValue(new ApiError('conflict', 409, ['Email already registered']))
    renderSignupRoutes({ auth: { signUp } })

    await fillAndSubmit()

    expect(
      await screen.findByText('Este email já está cadastrado'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInvalid()
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeEnabled()
  })

  it('shows a generic alert when the server fails', async () => {
    const signUp = vi.fn().mockRejectedValue(new ApiError('server', 500, ['x']))
    renderSignupRoutes({ auth: { signUp } })

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir o cadastro',
    )
  })
})
