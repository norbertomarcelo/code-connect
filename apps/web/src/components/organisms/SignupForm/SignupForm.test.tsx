import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SignupForm } from './SignupForm'

describe('SignupForm', () => {
  it('shows validation errors and does not submit when fields are empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SignupForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    expect(screen.getByText('Informe seu nome completo')).toBeInTheDocument()
    expect(screen.getByText('Informe seu email')).toBeInTheDocument()
    expect(screen.getByText('Informe uma senha')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the filled values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SignupForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nome'), 'Ana Silva')
    await user.type(screen.getByLabelText('Email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('checkbox', { name: 'Lembrar-me' }))
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ana Silva',
      email: 'ana@example.com',
      password: 'segredo123',
      remember: true,
    })
  })

  it('rejects a malformed email and a short password', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SignupForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nome'), 'Ana Silva')
    await user.type(screen.getByLabelText('Email'), 'ana')
    await user.type(screen.getByLabelText('Senha'), 'curta')
    await user.click(screen.getByRole('button', { name: /cadastrar/i }))

    expect(screen.getByText('Informe um email válido')).toBeInTheDocument()
    expect(
      screen.getByText('A senha deve ter ao menos 8 caracteres'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows errors reported by the API on their fields', () => {
    render(
      <SignupForm
        onSubmit={vi.fn()}
        fieldErrors={{ email: 'Este email já está cadastrado' }}
      />,
    )

    expect(screen.getByText('Este email já está cadastrado')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInvalid()
  })

  it('shows the submit error as an alert', () => {
    render(<SignupForm onSubmit={vi.fn()} submitError="Falha no servidor" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Falha no servidor')
  })

  it('disables the button while submitting', () => {
    render(<SignupForm onSubmit={vi.fn()} isSubmitting />)

    expect(screen.getByRole('button', { name: /cadastrando/i })).toBeDisabled()
  })
})
