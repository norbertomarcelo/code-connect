import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('reports what the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Textarea aria-label="Descrição" onChange={onChange} />)

    await user.type(screen.getByRole('textbox', { name: 'Descrição' }), 'oi')

    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('shows a placeholder', () => {
    render(<Textarea aria-label="Descrição" placeholder="Conte mais" />)

    expect(screen.getByPlaceholderText('Conte mais')).toBeInTheDocument()
  })
})
