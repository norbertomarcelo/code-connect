import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField'

describe('SearchField', () => {
  it('is a search landmark with a labelled input', () => {
    render(<SearchField value="" onChange={vi.fn()} />)

    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar publicações')).toBeInTheDocument()
  })

  it('shows the current value', () => {
    render(<SearchField value="react" onChange={vi.fn()} />)

    expect(screen.getByRole('searchbox')).toHaveValue('react')
  })

  it('reports the typed text', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchField value="" onChange={onChange} />)

    await user.type(screen.getByRole('searchbox'), 'a')

    expect(onChange).toHaveBeenCalledWith('a')
  })
})
