import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SortTabs } from './SortTabs'

describe('SortTabs', () => {
  it('marks the current option as pressed', () => {
    render(<SortTabs value="popular" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Populares' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Recentes' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reports the chosen option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SortTabs value="recent" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Populares' }))

    expect(onChange).toHaveBeenCalledWith('popular')
  })
})
