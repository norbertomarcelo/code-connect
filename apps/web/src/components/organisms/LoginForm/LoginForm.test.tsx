import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('shows validation errors and does not submit when fields are empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithRouter(
      <LoginForm forgotPasswordTo="/recuperar-senha" onSubmit={onSubmit} />,
    )

    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(
      screen.getByText('Informe seu email ou usuário'),
    ).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the filled values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithRouter(
      <LoginForm forgotPasswordTo="/recuperar-senha" onSubmit={onSubmit} />,
    )

    await user.type(
      screen.getByLabelText('Email ou usuário'),
      'usuario123',
    )
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('checkbox', { name: 'Lembrar-me' }))
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: 'usuario123',
      password: 'segredo123',
      remember: true,
    })
  })
})
