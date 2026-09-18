import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PostThumbnail } from './PostThumbnail'

describe('PostThumbnail', () => {
  it('shows the image when there is a src', () => {
    const { container } = render(
      <PostThumbnail src="https://example.com/capa.png" />,
    )

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/capa.png',
    )
    expect(screen.queryByTestId('thumbnail-placeholder')).not.toBeInTheDocument()
  })

  it('shows the placeholder when the post has no image', () => {
    const { container } = render(<PostThumbnail src={null} />)

    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('falls back to the placeholder when the image fails to load', () => {
    const { container } = render(<PostThumbnail src="https://dead.invalid/x.png" />)

    fireEvent.error(container.querySelector('img')!)

    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('gives a new src another chance after a failure', () => {
    const { container, rerender } = render(
      <PostThumbnail src="https://dead.invalid/x.png" />,
    )
    fireEvent.error(container.querySelector('img')!)

    rerender(<PostThumbnail src="https://example.com/ok.png" />)

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/ok.png',
    )
  })

  it('uses the given alt text', () => {
    render(<PostThumbnail src="https://example.com/a.png" alt="Capa do post" />)

    expect(screen.getByRole('img', { name: 'Capa do post' })).toBeInTheDocument()
  })
})
