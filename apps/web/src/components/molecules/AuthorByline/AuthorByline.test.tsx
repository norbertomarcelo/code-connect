import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthorByline } from './AuthorByline'

describe('AuthorByline', () => {
  it('shows the handle as text', () => {
    render(<AuthorByline name="Júlio Andrade" handle="julio" />)

    expect(screen.getByText('@julio')).toBeInTheDocument()
  })

  it('shows the initials of the author', () => {
    const { container } = render(
      <AuthorByline name="Júlio Andrade" handle="julio" />,
    )

    expect(container).toHaveTextContent('JA')
  })
})
