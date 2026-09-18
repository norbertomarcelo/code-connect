import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label and calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Login</Button>)

    const button = screen.getByRole('button', { name: 'Login' })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Login
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Login' })
    await user.click(button)

    expect(button).toBeDisabled()
    expect(onClick).not.toHaveBeenCalled()
  })
  it.each(['primary', 'outline', 'secondary', 'ghost'] as const)(
    'renders the %s variant as an enabled button',
    (variant) => {
      render(<Button variant={variant}>Publicar</Button>)

      expect(screen.getByRole('button', { name: 'Publicar' })).toBeEnabled()
    },
  )

  it('renders a material icon after the label without leaking its name', () => {
    render(
      <Button icon="upload" variant="secondary">
        Publicar
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument()
  })

  it('accepts the small size', () => {
    render(<Button size="sm">Limpar tudo</Button>)

    expect(screen.getByRole('button', { name: 'Limpar tudo' })).toBeInTheDocument()
  })
})
