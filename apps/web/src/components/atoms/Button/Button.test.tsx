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
})
