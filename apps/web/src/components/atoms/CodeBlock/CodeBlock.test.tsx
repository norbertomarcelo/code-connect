import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodeBlock } from './CodeBlock'

describe('CodeBlock', () => {
  it('shows the code in a named region', () => {
    render(<CodeBlock code="const a = 1" />)

    expect(screen.getByRole('region', { name: 'Código' })).toHaveTextContent(
      'const a = 1',
    )
  })

  it('is reachable by keyboard so it can be scrolled', () => {
    render(<CodeBlock code="x" label="Trecho" />)

    expect(screen.getByRole('region', { name: 'Trecho' })).toHaveAttribute(
      'tabindex',
      '0',
    )
  })
})
