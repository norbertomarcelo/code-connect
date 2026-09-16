import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('toggles when clicking its label text', async () => {
    const user = userEvent.setup()
    render(<Checkbox>Lembrar-me</Checkbox>)

    const checkbox = screen.getByRole('checkbox', { name: 'Lembrar-me' })
    expect(checkbox).not.toBeChecked()

    await user.click(screen.getByText('Lembrar-me'))

    expect(checkbox).toBeChecked()
  })
})
