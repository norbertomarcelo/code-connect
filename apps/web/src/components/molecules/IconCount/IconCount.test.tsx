import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconCount } from './IconCount'

describe('IconCount', () => {
  it('shows the count and names the action for assistive tech', () => {
    render(<IconCount icon="chat" label="Comentários" count={12} />)

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText(/Comentários/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('becomes a button that reports clicks when it has an onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconCount icon="code" label="Aprovar" count={3} onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: /Aprovar/ }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('exposes whether it is pressed', () => {
    render(
      <IconCount icon="code" label="Aprovar" count={3} onClick={vi.fn()} pressed />,
    )

    expect(screen.getByRole('button', { name: /Aprovar/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
