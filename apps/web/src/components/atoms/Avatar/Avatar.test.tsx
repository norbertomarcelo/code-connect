import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('shows the first and last initials of a full name', () => {
    const { container } = render(<Avatar name="Júlio Andrade Souza" />)

    expect(container).toHaveTextContent('JS')
  })

  it('shows one initial for a single name', () => {
    const { container } = render(<Avatar name="julio" />)

    expect(container).toHaveTextContent('J')
  })

  it('falls back to a question mark for an empty name', () => {
    const { container } = render(<Avatar name="  " />)

    expect(container).toHaveTextContent('?')
  })

  it('is decorative, hidden from assistive tech', () => {
    const { container } = render(<Avatar name="Ana Souza" />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('gives the same name the same color', () => {
    const first = render(<Avatar name="Ana Souza" />).container.innerHTML
    const second = render(<Avatar name="Ana Souza" />).container.innerHTML

    expect(second).toBe(first)
  })
})
