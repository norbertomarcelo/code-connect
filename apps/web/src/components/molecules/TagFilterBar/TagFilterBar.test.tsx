import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TagFilterBar } from './TagFilterBar'

const tags = [
  { slug: 'react', label: 'React' },
  { slug: 'css', label: 'CSS' },
]

function setup(selected: string[] = []) {
  const handlers = { onAdd: vi.fn(), onRemove: vi.fn(), onClear: vi.fn() }
  render(<TagFilterBar tags={tags} selected={selected} {...handlers} />)
  return handlers
}

describe('TagFilterBar', () => {
  it('renders nothing when there are no tags', () => {
    const { container } = render(
      <TagFilterBar
        tags={[]}
        selected={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('adds a tag that is not selected', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()

    await user.click(screen.getByRole('button', { name: 'Filtrar por CSS' }))

    expect(onAdd).toHaveBeenCalledWith('css')
  })

  it('removes a selected tag', async () => {
    const user = userEvent.setup()
    const { onRemove } = setup(['react'])

    await user.click(screen.getByRole('button', { name: 'Remover filtro React' }))

    expect(onRemove).toHaveBeenCalledWith('react')
  })

  it('offers to clear everything only while something is selected', async () => {
    const user = userEvent.setup()
    const { onClear } = setup(['react'])

    await user.click(screen.getByRole('button', { name: 'Limpar tudo' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('hides "Limpar tudo" without a selection', () => {
    setup()

    expect(
      screen.queryByRole('button', { name: 'Limpar tudo' }),
    ).not.toBeInTheDocument()
  })
})
