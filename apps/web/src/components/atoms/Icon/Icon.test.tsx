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
})
