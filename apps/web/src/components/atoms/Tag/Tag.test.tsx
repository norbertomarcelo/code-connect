import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tag } from './Tag'

describe('Tag', () => {
  it('renders its label without a remove button by default', () => {
    render(<Tag>React</Tag>)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRemove from a button named after the tag', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<Tag onRemove={onRemove}>Front-end</Tag>)

    await user.click(screen.getByRole('button', { name: 'Remover Front-end' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('accepts a custom remove label', () => {
    render(
      <Tag onRemove={vi.fn()} removeLabel="Tirar filtro">
        React
      </Tag>,
    )

    expect(screen.getByRole('button', { name: 'Tirar filtro' })).toBeInTheDocument()
  })
})
