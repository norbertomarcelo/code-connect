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

    expect(screen.getByText('Informe seu email')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithRouter(
      <LoginForm forgotPasswordTo="/recuperar-senha" onSubmit={onSubmit} />,
    )

    await user.type(screen.getByLabelText('Email'), 'usuario123')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByText('Informe um email válido')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the filled values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithRouter(
      <LoginForm forgotPasswordTo="/recuperar-senha" onSubmit={onSubmit} />,
    )

    await user.type(screen.getByLabelText('Email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('checkbox', { name: 'Lembrar-me' }))
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'segredo123',
      remember: true,
    })
  })

  it('shows the submit error as an alert', () => {
    renderWithRouter(
      <LoginForm
        forgotPasswordTo="/recuperar-senha"
        onSubmit={vi.fn()}
        submitError="Email ou senha inválidos"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email ou senha inválidos',
    )
  })

  it('disables the button while submitting', () => {
    renderWithRouter(
      <LoginForm
        forgotPasswordTo="/recuperar-senha"
        onSubmit={vi.fn()}
        isSubmitting
      />,
    )

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled()
  })

  it('starts with the default email and remember values', () => {
    renderWithRouter(
      <LoginForm
        forgotPasswordTo="/recuperar-senha"
        onSubmit={vi.fn()}
        defaultEmail="ana@example.com"
        defaultRemember
      />,
    )

    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com')
    expect(screen.getByRole('checkbox', { name: 'Lembrar-me' })).toBeChecked()
  })
})
