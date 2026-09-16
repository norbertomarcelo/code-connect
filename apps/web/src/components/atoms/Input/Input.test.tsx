import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('accepts typing', async () => {
    const user = userEvent.setup()
    render(<Input aria-label="Email ou usuário" />)

    const input = screen.getByLabelText('Email ou usuário')
    await user.type(input, 'usuario123')

    expect(input).toHaveValue('usuario123')
  })
})
