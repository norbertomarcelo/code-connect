import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon } from './Icon'

describe('Icon', () => {
  it('renders an svg hidden from assistive tech', () => {
    render(<Icon name="arrow-right" />)

    const icon = screen.getByRole('presentation', { hidden: true })
    expect(icon.tagName.toLowerCase()).toBe('svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps the svg at 20px by default and scales it with size', () => {
    const { rerender } = render(<Icon name="arrow-right" />)
    const icon = screen.getByRole('presentation', { hidden: true })
    expect(icon).toHaveAttribute('width', '20')

    rerender(<Icon name="arrow-right" size="lg" />)
    expect(icon).toHaveAttribute('width', '32')
  })

  it('renders a material glyph as a ligature hidden from assistive tech', () => {
    const { container } = render(<Icon name="account_circle" />)

    const glyph = container.querySelector('span')
    expect(glyph).toHaveTextContent('account_circle')
    expect(glyph).toHaveAttribute('aria-hidden', 'true')
    expect(glyph).toHaveAttribute('translate', 'no')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('prefers the inline svg when a name exists in both sets', () => {
    const { container } = render(<Icon name="login" />)

    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('span')).toBeNull()
  })
})
