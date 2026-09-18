import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makePost } from '../../../test/fixtures'
import { PostHeader } from './PostHeader'

describe('PostHeader', () => {
  it('shows the title as the page heading, with description, tags and author', () => {
    render(<PostHeader post={makePost()} onToggleLike={vi.fn()} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Lista acessível com teclado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Como navegar uma lista só com as setas.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Acessibilidade')).toBeInTheDocument()
    expect(screen.getByText('@julio')).toBeInTheDocument()
  })

  it('reports a click on Aprovar with the post', async () => {
    const user = userEvent.setup()
    const onToggleLike = vi.fn()
    const post = makePost()
    render(<PostHeader post={post} onToggleLike={onToggleLike} />)

    await user.click(screen.getByRole('button', { name: /Aprovar/ }))

    expect(onToggleLike).toHaveBeenCalledWith(post)
  })

  it('shows the placeholder when the post has no cover', () => {
    render(
      <PostHeader post={makePost({ thumbnailUrl: null })} onToggleLike={vi.fn()} />,
    )

    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument()
  })
})
